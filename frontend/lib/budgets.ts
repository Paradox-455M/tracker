export type BudgetRow = {
  id: string;
  category: string;
  limit_amount: number;
  period_month: number;
  period_year: number;
};

export type Alert = { category: string; level: "warning" | "alert"; percent: number; spent: number; limit: number };

export function computeBudgetAlerts(budgets: BudgetRow[], totalsByCategory: Record<string, number>, month: number, year: number): Alert[] {
  const alerts: Alert[] = [];
  for (const b of budgets) {
    if (b.period_month !== month || b.period_year !== year) continue;
    const spent = totalsByCategory[b.category] || 0;
    if (b.limit_amount <= 0) continue;
    const percent = (spent / b.limit_amount) * 100;
    if (percent >= 100) {
      alerts.push({ category: b.category, level: "alert", percent, spent, limit: b.limit_amount });
    } else if (percent >= 80) {
      alerts.push({ category: b.category, level: "warning", percent, spent, limit: b.limit_amount });
    }
  }
  return alerts.sort((a, b) => b.percent - a.percent);
}

// Server-side helper: insert alert only once per threshold per period
export async function upsertBudgetAlertsServer(userId: string, alerts: Alert[], periodKey: string) {
  // no-op placeholder: In MVP we keep inline alerts only; extended version could insert into alerts table here.
}


