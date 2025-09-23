import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyInsights } from "@/lib/ai/insights";

// In-memory cache per instance to avoid repeated AI calls
type CacheEntry = { expiresAt: number; payload: { summary: Record<string, number>; text: string } | unknown };
const TTL_MS = 60 * 60 * 1000; // 1 hour
const memoryCache = new Map<string, CacheEntry>();

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cacheKey = `weekly:${user.id}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload, { headers: { "Cache-Control": "private, max-age=3600" } });
  }

  const now = Date.now();
  const start = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const prevStart = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const prevEnd = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: current } = await supabase
    .from("expenses")
    .select("category, final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", start);

  const { data: previous } = await supabase
    .from("expenses")
    .select("category, final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", prevStart)
    .lt("tx_date", prevEnd);

  const sum = (rows?: Array<{ category?: string | null; final_category?: string | null; amount: number | string }> | null) => {
    const tot: Record<string, number> = {};
    (rows || []).forEach((r) => {
      const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
      // Prefer explicit category the user sees; fall back to final_category, then Other
      const key = (r.category || r.final_category || "Other") as string;
      tot[key] = (tot[key] || 0) + (isNaN(amt) ? 0 : amt);
    });
    return tot;
  };

  const summary = { current: sum(current), previous: sum(previous) };

  const periodKey = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  const text = await generateWeeklyInsights(summary);

  if (text) {
    await supabase
      .from("insights")
      .upsert({ user_id: user.id, period_key: `week-${periodKey}`, summary: text, metrics: summary }, { onConflict: "user_id,period_key" });
  }

  const payload = { summary, text };
  memoryCache.set(cacheKey, { expiresAt: Date.now() + TTL_MS, payload });
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, max-age=3600" } });
}


