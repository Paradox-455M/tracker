"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJsonCached, invalidateCache } from "@/lib/clientCache";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import EditBudgetModal from "@/components/EditBudgetModal";
import CategoryLabel from "@/components/CategoryLabel";

type Budget = {
  id: string;
  category: string;
  limit_amount: number;
  period_month: number;
  period_year: number;
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [form, setForm] = useState({ category: "", amount: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [totalsByPeriod, setTotalsByPeriod] = useState<Record<string, Record<string, number>>>({});

  const budgetsLoadingRef = useRef(false);
  const budgetsLoadedRef = useRef(false);
  const loadBudgets = useCallback(async () => {
    if (budgetsLoadingRef.current) return;
    budgetsLoadingRef.current = true;
    try {
      const data = await fetchJsonCached<{ budgets: Budget[] }>("/api/budgets", { ttl: 10000 });
      setBudgets(data.budgets || []);
    } finally {
      budgetsLoadingRef.current = false;
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function addBudget(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: form.category, amount: Number(form.amount), month: Number(form.month), year: Number(form.year) }) });
    if (!res.ok) return toast.error("Failed to add");
    toast.success("Budget added");
    setForm({ ...form, category: "", amount: "" });
    invalidateCache("/api/budgets");
    loadBudgets();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function updateBudget(id: string, patch: Partial<Budget>) {
    const res = await fetch(`/api/budgets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: patch.category, amount: patch.limit_amount, month: patch.period_month, year: patch.period_year }) });
    if (!res.ok) return toast.error("Failed to update");
    toast.success("Budget updated");
    invalidateCache("/api/budgets");
    loadBudgets();
  }

  async function deleteBudget(id: string) {
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete");
    toast.success("Budget deleted");
    invalidateCache("/api/budgets");
    loadBudgets();
  }

  useEffect(() => {
    if (budgetsLoadedRef.current) return;
    budgetsLoadedRef.current = true;
    loadBudgets();
  }, [loadBudgets]);

  const filtered = useMemo(() => {
    return budgets.filter(b => {
      const byCat = categoryFilter === "all" ? true : b.category === categoryFilter;
      const byMonth = monthFilter === "all" ? true : b.period_month === Number(monthFilter);
      return byCat && byMonth;
    });
  }, [budgets, categoryFilter, monthFilter]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const spentByCategory = useMemo(() => async (category: string, month: number, year: number) => {
    try {
      const res = await fetch(`/api/expenses/summary?month=${month}&year=${year}`);
      const json = await res.json();
      const totals = json?.totals || {};
      return Number(totals[category] || 0);
    } catch {
      return 0;
    }
  }, []);

  const uniqueCategories = useMemo(() => Array.from(new Set(budgets.map(b => b.category))).sort(), [budgets]);

  // Prefetch totals once per distinct (year, month) visible in the filtered list
  useEffect(() => {
    const periodKeys = Array.from(new Set(filtered.map(b => `${b.period_year}-${b.period_month}`)));
    const missing = periodKeys.filter(k => !totalsByPeriod[k]);
    if (missing.length === 0) return;
    (async () => {
      const results = await Promise.all(missing.map(async (key) => {
        const [year, month] = key.split("-").map(Number);
        try {
          const res = await fetch(`/api/expenses/summary?month=${month}&year=${year}`);
          const json = await res.json();
          return [key, json?.totals || {}] as const;
        } catch {
          return [key, {}] as const;
        }
      }));
      setTotalsByPeriod(prev => {
        const next = { ...prev } as Record<string, Record<string, number>>;
        for (const [key, totals] of results) next[key] = totals;
        return next;
      });
    })();
  }, [filtered, totalsByPeriod]);

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-3xl font-bold">Budgets</h1>
      </div>

      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className="w-40">
          <option value="all">All</option>
          {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={monthFilter} onChange={(e)=>setMonthFilter(e.target.value)} className="w-40">
          <option value="all">All months</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={String(m)}>{new Date(new Date().getFullYear(), m-1, 1).toLocaleString(undefined, { month: 'long' })}</option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end mt-3" style={{ marginBottom: '3%' , marginTop: '2%' }}>
        <Button onClick={(e)=>{ e.preventDefault(); setEditing({ id: "new" }); }}>+ Add Budget</Button>
      </div>

      <div className="rounded-2xl glass p-4 shadow-card mb-6 h-[55vh] flex flex-col" >
        <div className="text-sm text-[var(--text-secondary)] mb-2">Category</div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400">
              <tr className="border-b border-white/10 divide-x divide-white/10">
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Budget</th>
                <th className="px-4 py-2">Spent</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-white/5 divide-x divide-white/10">
                  <td className="px-4 py-3 font-medium"><CategoryLabel category={b.category} /></td>
                  <td className="px-4 py-3">₹{Number(b.limit_amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <BudgetSpent category={b.category} month={b.period_month} year={b.period_year} totalsByPeriod={totalsByPeriod} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={()=>setEditing({ id: b.id })} className="text-lime-300 hover:text-lime-200 mr-3">Edit</button>
                    <button onClick={()=>deleteBudget(b.id)} className="text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

     
    
      {editing && (
        <EditBudgetModal
          budget={budgets.find(x=>x.id===editing.id) || ({ id: editing.id } as unknown as Budget)}
          onClose={()=>setEditing(null)}
          onUpdated={()=>{ setEditing(null); loadBudgets(); }}
        />
      )}
    </div>
  );
}



function normalizeCategoryKey(key: string): string {
  return key?.trim?.().toLowerCase() || "";
}

const categoryAliases: Record<string, string> = {
  "food": "Food & Dining",
  "food & dining": "Food & Dining",
};

function BudgetSpent({ category, month, year, totalsByPeriod }: { category: string; month: number; year: number; totalsByPeriod: Record<string, Record<string, number>> }) {
  const key = `${year}-${month}`;
  const totals = totalsByPeriod[key] || {};
  const normalizedCategory = normalizeCategoryKey(categoryAliases[normalizeCategoryKey(category)] || category);
  const matchKey = Object.keys(totals).find(k => normalizeCategoryKey(k) === normalizedCategory);
  const amount = Number((totals as Record<string, number>)[(matchKey ?? category) as string] ?? 0);
  return <span>₹{amount.toFixed(2)}</span>;
}
