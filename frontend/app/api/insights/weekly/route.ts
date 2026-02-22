import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyInsights } from "@/lib/ai/insights";

// In-memory cache per instance to avoid repeated AI calls
type CacheEntry = { expiresAt: number; payload: { summary: Record<string, number>; text: string } | unknown };
const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 500;
const memoryCache = new Map<string, CacheEntry>();

function setCacheWithEviction(cache: Map<string, CacheEntry>, key: string, value: CacheEntry) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, value);
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const offsetParam = Number(searchParams.get("offset") || "0");
  const weekOffset = isNaN(offsetParam) ? 0 : Math.max(0, Math.min(52, offsetParam));

  const bust = searchParams.get("bust") === "1";
  const cacheKey = `weekly:${user.id}:offset:${weekOffset}`;
  const cached = memoryCache.get(cacheKey);
  if (!bust && cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload, { headers: { "Cache-Control": "private, max-age=3600" } });
  }

  const now = Date.now();
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  const endThis = new Date(now - weekOffset * msWeek).toISOString();
  const startThis = new Date(new Date(endThis).getTime() - msWeek).toISOString();
  const endPrev = startThis;
  const startPrev = new Date(new Date(endPrev).getTime() - msWeek).toISOString();

  const { data: current } = await supabase
    .from("expenses")
    .select("category, final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", startThis)
    .lt("tx_date", endThis);

  const { data: previous } = await supabase
    .from("expenses")
    .select("category, final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", startPrev)
    .lt("tx_date", endPrev);

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

  const periodKey = new Date(endThis).toISOString().slice(0, 10); // yyyy-mm-dd for period end
  const text = await generateWeeklyInsights(summary);

  if (text) {
    const { error: upsertErr } = await supabase
      .from("insights")
      .upsert({ user_id: user.id, period_key: `week-${periodKey}`, summary: text, metrics: summary }, { onConflict: "user_id,period_key" });
    if (upsertErr) console.error("[insights/weekly] Failed to cache insight:", upsertErr.message);
  }

  const payload = { summary, text };
  setCacheWithEviction(memoryCache, cacheKey, { expiresAt: Date.now() + TTL_MS, payload });
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, max-age=3600" } });
}


