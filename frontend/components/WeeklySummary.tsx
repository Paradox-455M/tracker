"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Row = { category: string; amount: number };

export default function WeeklySummary() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/expenses/summary", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        const week = json?.weekly || [];
        setData(week);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const total = useMemo(() => data.reduce((a, c) => a + (Number(c.amount) || 0), 0), [data]);
  const top = useMemo(() => data.slice().sort((a,b)=> (b.amount||0)-(a.amount||0))[0]?.category || "—", [data]);
  const remainingPct = useMemo(() => {
    const monthlyBudget = 10000; // placeholder; future: fetch from budgets
    return Math.max(0, Math.min(100, Math.round(((monthlyBudget - total) / monthlyBudget) * 100)));
  }, [total]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-2xl glass p-4 h-80 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-[var(--text-secondary)]">This week</div>
        <div className="text-xs text-[var(--text-muted)]">Spending by category</div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-56">
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
                <Bar dataKey="amount" fill="#9EFF00" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid gap-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-xs text-[var(--text-muted)]">Total spent</div>
            <div className="text-2xl font-bold mt-1">₹{total.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-xs text-[var(--text-muted)]">Top category</div>
            <div className="text-lg mt-1">{top}</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-xs text-[var(--text-muted)]">Remaining budget</div>
            <div className="mt-2 w-full h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${remainingPct}%` }} />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{remainingPct}%</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


