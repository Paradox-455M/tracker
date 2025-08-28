import type { SupabaseClient } from "@supabase/supabase-js";

export async function checkAndInsertBudgetAlerts(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const start = new Date(year, month - 1, 1).toISOString();
  const next = new Date(year, month, 1).toISOString();

  // Fetch budgets for this month
  const { data: budgets } = await supabase
    .from("budgets")
    .select("category, limit_amount")
    .eq("user_id", userId)
    .eq("period_month", month)
    .eq("period_year", year);

  if (!budgets || budgets.length === 0) return 0;

  // Monthly totals by final_category
  const { data: rows } = await supabase
    .from("expenses")
    .select("final_category, amount")
    .eq("user_id", userId)
    .gte("tx_date", start)
    .lt("tx_date", next);

  const totals: Record<string, number> = {};
  (rows || []).forEach((r: { final_category?: string; amount: number | string }) => {
    const key = r.final_category || "Other";
    const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
    totals[key] = (totals[key] || 0) + (isNaN(amt) ? 0 : amt);
  });

  // Existing alerts this month to avoid duplicates
  const { data: existing } = await supabase
    .from("alerts")
    .select("category, level")
    .eq("user_id", userId)
    .gte("created_at", start);

  const existingKey = new Set((existing || []).map((a: { category: string; level: string }) => `${a.category}|${a.level}`));

  const toInsert: Array<{ user_id: string; category: string; message: string; level: "warning" | "alert" }> = [];

  for (const b of budgets) {
    const spent = totals[b.category] || 0;
    if (Number(b.limit_amount) <= 0) continue;
    const percent = (spent / Number(b.limit_amount)) * 100;
    if (percent >= 100) {
      const key = `${b.category}|alert`;
      if (!existingKey.has(key)) {
        toInsert.push({
          user_id: userId,
          category: b.category,
          message: `🚨 Alert: You exceeded your ${b.category} budget. Spent ₹${Math.round(spent)} / ₹${Math.round(Number(b.limit_amount))}.`,
          level: "alert",
        });
      }
    } else if (percent >= 80) {
      const key = `${b.category}|warning`;
      if (!existingKey.has(key)) {
        toInsert.push({
          user_id: userId,
          category: b.category,
          message: `⚠️ Warning: You reached ${Math.round(percent)}% of your ${b.category} budget (₹${Math.round(spent)} / ₹${Math.round(Number(b.limit_amount))}).`,
          level: "warning",
        });
      }
    }
  }

  if (toInsert.length > 0) {
    await supabase.from("alerts").insert(toInsert);
  }
  return toInsert.length;
}


