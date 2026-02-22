import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory TTL cache (per server instance)
type CacheEntry = { expiresAt: number; payload: unknown };
const CACHE_TTL_MS = 60_000; // 60s
const MAX_CACHE_ENTRIES = 500;
const memoryCache = new Map<string, CacheEntry>();
const cacheKey = (userId: string, month1: number, year: number) => `${userId}:${year}:${month1}`;

function setCacheWithEviction(cache: Map<string, CacheEntry>, key: string, value: CacheEntry) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, value);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const now = new Date();
  const month = monthParam ? Number(monthParam) - 1 : now.getMonth();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const start = new Date(year, month, 1).toISOString();
  const next = new Date(year, month + 1, 1).toISOString();

  // Serve from cache if fresh (skip if ?bust=1)
  const bust = searchParams.get("bust") === "1";
  const key = cacheKey(user.id, month + 1, year);
  const cached = memoryCache.get(key);
  if (!bust && cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" },
    });
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", start)
    .lt("tx_date", next);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const totals: Record<string, number> = {};
  (data || []).forEach((r: { category?: string; amount: number | string }) => {
    const key = r.category || "Other";
    const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
    totals[key] = (totals[key] || 0) + (isNaN(amt) ? 0 : amt);
  });

  const payload = { totals, month: month + 1, year };
  setCacheWithEviction(memoryCache, key, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" },
  });
}


