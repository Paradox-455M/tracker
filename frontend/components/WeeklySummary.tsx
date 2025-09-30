"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useReducedMotion } from "framer-motion";
import Select from "@/components/ui/Select";

type Row = { category: string; amount: number };

export default function WeeklySummary() {
  const prefersReduced = useReducedMotion();
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, number>>({});
  const [selectedYm, setSelectedYm] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        // Use weekly insights API; transform totals map → rows
        const res = await fetch(`/api/insights/weekly?offset=${offset}`, { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        const currentTotals = (json?.summary?.current || {}) as Record<string, number | string>;
        const previousTotals = (json?.summary?.previous || {}) as Record<string, number | string>;
        const rows: Row[] = Object.entries(currentTotals).map(([category, amount]) => ({ category, amount: Number(amount) || 0 }));
        setData(rows);
        const prevTotal = Object.values(previousTotals).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
        setPreviousTotal(prevTotal);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [offset]);

  const [budgets, setBudgets] = useState<Array<{ category: string; limit_amount: number; period_month: number; period_year: number }> | null>(null);

  useEffect(() => {
    let act = true;
    (async () => {
      const res = await fetch("/api/budgets", { cache: "no-store" });
      const json: { budgets?: Array<{ category: string; limit_amount: number; period_month: number; period_year: number }> } = await res.json();
      if (!act) return;
      setBudgets(json?.budgets || []);
    })();
    return () => { act = false; };
  }, []);

  // Load monthly totals for side cards and summary
  useEffect(() => {
    let act = true;
    (async () => {
      try {
        const res = await fetch(`/api/insights/monthly?ym=${selectedYm}`, { cache: "no-store" });
        const json = await res.json();
        if (!act) return;
        const cur = (json?.summary?.current || {}) as Record<string, number | string>;
        const normalized: Record<string, number> = {};
        Object.entries(cur).forEach(([k, v]) => { normalized[k] = Number(v) || 0; });
        setMonthlyTotals(normalized);
      } catch {
        setMonthlyTotals({});
      }
    })();
    return () => { act = false; };
  }, [selectedYm]);

  // Weekly totals used only for chart; cards use monthlyTotals
  const totalWeekly = useMemo(() => data.reduce((a, c) => a + (Number(c.amount) || 0), 0), [data]);
  const totalMonthly = useMemo(() => Object.values(monthlyTotals).reduce<number>((s, v) => s + (Number(v) || 0), 0), [monthlyTotals]);
  const topMonthly = useMemo(() => Object.entries(monthlyTotals).sort((a,b)=> (b[1]||0)-(a[1]||0))[0]?.[0] || "—", [monthlyTotals]);

  const [selYear, selMonth] = selectedYm.split("-").map((v) => Number(v));
  const monthBudgets = useMemo(() => (budgets || []).filter(b => b.period_year === selYear && b.period_month === selMonth), [budgets, selYear, selMonth]);
  const remainingPct = useMemo(() => {
    if (!monthBudgets || monthBudgets.length === 0) return 100;
    const budgetTotal = monthBudgets.reduce((a, b) => a + (Number(b.limit_amount) || 0), 0);
    if (budgetTotal <= 0) return 100;
    const pct = Math.round(((budgetTotal - totalMonthly) / budgetTotal) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [monthBudgets, totalMonthly]);

  const monthOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth() - i, 1));
      const value = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = dt.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      opts.push({ value, label });
    }
    return opts;
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-2xl glass p-4 shadow-card min-h-[70vh] flex flex-col">
      {/* Header with selectors */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-[var(--text-secondary)]">This week</div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-[var(--text-muted)]">Spending by category</div>
          <Select value={String(offset)} onChange={(e)=> setOffset(Number(e.target.value))} className="w-36">
            <option value="0">This week</option>
            <option value="1">Last week</option>
            <option value="2">2 weeks ago</option>
            <option value="3">3 weeks ago</option>
            <option value="4">4 weeks ago</option>
          </Select>
          <Select value={selectedYm} onChange={(e)=> setSelectedYm(e.target.value)} className="w-44">
            {monthOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
      </div>
      {/* Weekly chart only */}
      <div className="grid md:grid-cols-1 gap-4">
        <div className="h-[38vh] md:h-[42vh]">
          {loading ? (
            <div className="h-full animate-pulse rounded-xl bg-white/5" />
          ) : data.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)]">No data this week</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="category" stroke="#6C6C6C" tick={{ fill: "#B0B0B0", fontSize: 12 }} />
                <YAxis stroke="#6C6C6C" tick={{ fill: "#B0B0B0", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "rgba(30,30,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                <Bar dataKey="amount" fill="#9EFF00" radius={[6,6,0,0]} isAnimationActive={!prefersReduced} animationDuration={prefersReduced ? 0 : 400} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly cards */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-xs text-[var(--text-muted)]">Total spent ({monthOptions.find(o=>o.value===selectedYm)?.label || selectedYm})</div>
          <div className="text-2xl font-bold mt-1">₹{totalMonthly.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-xs text-[var(--text-muted)]">Top category</div>
          <div className="text-lg mt-1">{topMonthly}</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-xs text-[var(--text-muted)]">Remaining budget</div>
          <div className="mt-2 w-full h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${remainingPct}%` }} />
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{remainingPct}%</div>
        </div>
      </div>

      {/* Summary section */}
      <div className="mt-6 grid  gap-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-sm text-[var(--text-secondary)]">Summary</div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div className="text-[var(--text-muted)]">Total Expenses</div>
            <div className="text-right font-medium">₹{totalMonthly.toFixed(2)}</div>
            <div className="text-[var(--text-muted)]">Savings (budget left)</div>
            <div className="text-right font-medium">₹{Math.max(0, (monthBudgets||[]).reduce((a,b)=> a + (Number(b.limit_amount)||0), 0) - totalMonthly).toFixed(2)}</div>
            <div className="text-[var(--text-muted)]">Change vs last week</div>
            <div className="text-right font-medium">{previousTotal > 0 ? `${Math.round(((totalWeekly-previousTotal)/previousTotal)*100)}%` : "—"}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


