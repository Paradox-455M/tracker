import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoryPie from "@/components/CategoryPie";
import InsightsCard from "@/components/InsightsCard";
import BudgetAlerts from "@/components/BudgetAlerts";
import { checkAndInsertBudgetAlerts } from "@/lib/alerts/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Server-side: insert alerts once per threshold when crossing
  await checkAndInsertBudgetAlerts(supabase, user.id);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("expenses")
    .select("category, final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", since);

  const totals: Record<string, number> = {};
  (rows || []).forEach((r: { category?: string; final_category?: string; amount: number | string }) => {
    const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
    const key = r.final_category || r.category || "Other";
    totals[key] = (totals[key] || 0) + (isNaN(amt) ? 0 : amt);
  });
  const chartData = Object.entries(totals).map(([name, value]) => ({ name, value }));
  const colors = ["#82ca9d", "#8884d8", "#ffc658", "#ff7f50", "#6495ed", "#a78bfa", "#34d399"]; // kept for future legends

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back, {user.email}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-lime-300">
          Last 30 days
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-gray-400 mb-2">Budget Alerts</div>
          <BudgetAlerts />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">This month</div>
          <div className="text-2xl font-bold mt-1">₹{(chartData.reduce((a, c) => a + c.value, 0)).toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-2">Total spend</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">Top category</div>
          <div className="text-2xl font-bold mt-1">{chartData.sort((a,b)=>b.value-a.value)[0]?.name || "—"}</div>
          <div className="text-xs text-gray-500 mt-2">Highest share</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">Budgets</div>
          <div className="text-2xl font-bold mt-1">2 nearing limit</div>
          <div className="text-xs text-gray-500 mt-2">Set alerts to stay on track</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-72">
          <div className="text-sm text-gray-400 mb-2">Category breakdown</div>
          <CategoryPie data={chartData} />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-72">
          <div className="text-sm text-gray-400 mb-2">Weekly insights</div>
          <InsightsCard />
        </div>
      </div>
    </div>
  );
}


