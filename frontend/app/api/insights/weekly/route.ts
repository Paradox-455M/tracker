import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyInsights } from "@/lib/ai/insights";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  const start = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const prevStart = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const prevEnd = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: current } = await supabase
    .from("expenses")
    .select("final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", start);

  const { data: previous } = await supabase
    .from("expenses")
    .select("final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", prevStart)
    .lt("tx_date", prevEnd);

  const sum = (rows?: Array<{ final_category?: string; amount: number | string }> | null) => {
    const tot: Record<string, number> = {};
    (rows || []).forEach((r) => {
      const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
      const key = r.final_category || "Other";
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

  return NextResponse.json({ summary, text });
}


