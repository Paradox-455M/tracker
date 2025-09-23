import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import CategoryPie from "@/components/CategoryPie";
import InsightsCard from "@/components/InsightsCard";
import BudgetAlerts from "@/components/BudgetAlerts";
import DashboardCard from "@/components/DashboardCard";
import QuickActions from "@/components/QuickActions";
import AccountsSummary from "@/components/AccountsSummary";
import RecentExpenses from "@/components/RecentExpenses";
import SubscriptionsPanel from "@/components/SubscriptionsPanel";
const Sparkline = dynamic(() => import("@/components/Sparkline"));
import DeferRender from "@/components/DeferRender";
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
    .select("id, tx_date, description, category, final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", since);

  const totals: Record<string, number> = {};
  (rows || []).forEach((r: { category?: string; final_category?: string; amount: number | string }) => {
    const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
    const key = r.category || r.final_category || "Other";
    totals[key] = (totals[key] || 0) + (isNaN(amt) ? 0 : amt);
  });
  const chartData = Object.entries(totals).map(([name, value]) => ({ name, value }));
  // const colors = ["#82ca9d", "#8884d8", "#ffc658", "#ff7f50", "#6495ed", "#a78bfa", "#34d399"]; // kept for future legends

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

      <div className="mt-6 grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2"><QuickActions /></div>
        <div className="rounded-2xl glass p-4 shadow-card">
          <div className="text-sm text-[var(--text-secondary)] mb-2">Budget Alerts</div>
          <BudgetAlerts />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <DashboardCard title="This month">
          <div className="text-3xl font-bold mt-1">₹{(chartData.reduce((a, c) => a + c.value, 0)).toFixed(2)}</div>
          <DeferRender>
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded bg-white/5" />}>
              <Sparkline data={[12,18,10,22,19,28,24]} />
            </Suspense>
          </DeferRender>
          <div className="text-xs text-[var(--text-muted)] mt-1">Total spend</div>
        </DashboardCard>
        <DashboardCard title="Top category">
          <div className="text-3xl font-bold mt-1">{chartData.sort((a,b)=>b.value-a.value)[0]?.name || "—"}</div>
          <DeferRender>
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded bg-white/5" />}>
              <Sparkline data={[8,12,9,14,12,16,17]} color="#00FFC6" />
            </Suspense>
          </DeferRender>
          <div className="text-xs text-[var(--text-muted)] mt-1">Highest share</div>
        </DashboardCard>
        <DashboardCard title="Budgets">
          <div className="text-3xl font-bold mt-1">2 nearing limit</div>
          <DeferRender>
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded bg-white/5" />}>
              <Sparkline data={[5,7,6,9,10,12,14]} color="#FFB347" />
            </Suspense>
          </DeferRender>
          <div className="text-xs text-[var(--text-muted)] mt-1">Set alerts to stay on track</div>
        </DashboardCard>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-8 space-y-4">
          <DashboardCard title="Accounts">
            <div className="w-full"><AccountsSummary totals={chartData.reduce((a, c) => a + c.value, 0)} /></div>
          </DashboardCard>
          <DashboardCard title="Category breakdown">
            <div className="h-64 w-full">
              <CategoryPie data={chartData} />
            </div>
          </DashboardCard>
          <DashboardCard title="Recent Expenses">
            <div className="w-full"><RecentExpenses rows={(rows || []).slice(0,5).map((r: { id: string; tx_date: string; description: string | null; category?: string | null; final_category?: string | null; amount: number | string })=>({ id: r.id, tx_date: r.tx_date, description: r.description, category: r.category, final_category: r.final_category, amount: typeof r.amount === 'number' ? r.amount : parseFloat(String(r.amount)) }))} /></div>
          </DashboardCard>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-4 ">
          <DashboardCard title="Weekly insights" className="min-h-[48%] max-h-[48%] overflow-auto">
            <InsightsCard />
          </DashboardCard>
          <DashboardCard title="Subscriptions" className="min-h-[50%] max-h-[50%] overflow-auto">
            <SubscriptionsPanel />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}


