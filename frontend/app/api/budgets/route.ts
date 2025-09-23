import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple per-instance in-memory cache
type CacheEntry = { expiresAt: number; payload: unknown };
const BUDGETS_TTL_MS = 30_000; // 30s
const memoryCache = new Map<string, CacheEntry>();

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cacheKey = `budgets:${user.id}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" } });
  }
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const payload = { budgets: data };
  memoryCache.set(cacheKey, { expiresAt: Date.now() + BUDGETS_TTL_MS, payload });
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" } });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { category, amount, month, year } = body || {};
  if (!category || !amount || !month || !year) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: user.id,
      category,
      limit_amount: Number(amount),
      period_month: Number(month),
      period_year: Number(year),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budget: data });
}


