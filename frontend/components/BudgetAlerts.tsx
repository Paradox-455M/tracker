import { computeBudgetAlerts, type BudgetRow } from "@/lib/budgets";
import { createClient } from "@/lib/supabase/server";

export default async function BudgetAlerts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const start = new Date(year, month - 1, 1).toISOString();
  const next = new Date(year, month, 1).toISOString();

  const [{ data: budgets }, { data: rows }] = await Promise.all([
    supabase
      .from("budgets")
      .select("category, limit_amount, period_month, period_year")
      .eq("user_id", user.id),
    supabase
      .from("expenses")
      .select("category, amount")
      .eq("user_id", user.id)
      .gte("tx_date", start)
      .lt("tx_date", next),
  ]);

  const totals: Record<string, number> = {};
  (rows || []).forEach((r: { category?: string; amount: number | string }) => {
    const key = r.category || "Other";
    const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
    totals[key] = (totals[key] || 0) + (isNaN(amt) ? 0 : amt);
  });

  const alerts = computeBudgetAlerts((budgets || []) as BudgetRow[], totals, month, year);
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a, idx) => (
        <div key={idx} className={a.level === "alert" ? "bg-red-500/10 border border-red-500/30 text-red-300 rounded px-3 py-2" : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded px-3 py-2"}>
          {a.level === "alert" ? "🚨" : "⚠️"} {a.category}: ₹{a.spent.toFixed(0)} / ₹{a.limit.toFixed(0)} ({Math.round(a.percent)}%)
        </div>
      ))}
    </div>
  );
}


