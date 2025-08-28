"use client";
import { useEffect, useState } from "react";
import { computeBudgetAlerts, type BudgetRow, type Alert } from "@/lib/budgets";

export default function BudgetAlerts() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [budgetsRes, totalsRes] = await Promise.all([
          fetch("/api/budgets"),
          fetch("/api/expenses/summary"),
        ]);
        const budgetsJson = await budgetsRes.json();
        const totalsJson = await totalsRes.json();
        const computed = computeBudgetAlerts(
          (budgetsJson.budgets || []) as BudgetRow[],
          (totalsJson.totals || {}) as Record<string, number>,
          totalsJson.month,
          totalsJson.year
        );
        setAlerts(computed);
      } catch {
        setAlerts([]);
      }
    })();
  }, []);

  if (!alerts) return <div className="text-sm text-gray-500">Loading alerts…</div>;
  if (alerts.length === 0) return null;

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


