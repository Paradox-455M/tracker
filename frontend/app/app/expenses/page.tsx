"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJsonCached, invalidateCache, refetchNow } from "@/lib/clientCache";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import EditExpenseModal from "@/components/EditExpenseModal";
import CategoryLabel from "@/components/CategoryLabel";
// import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
// Badge is currently unused
// import Badge from "@/components/ui/Badge";

const schema = z.object({
  amount: z.string().transform((v) => Number(v)).refine((n) => !isNaN(n) && n > 0, "Amount must be > 0"),
  description: z.string().min(2, "Description required"),
  tx_date: z.string().optional(),
  category: z.string().optional(),
});

type Expense = {
  id: string;
  tx_date: string;
  description: string | null;
  amount: number;
  ai_category?: string | null;
  final_category?: string | null;
  category?: string | null;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [adding, setAdding] = useState<boolean>(false);
  const [month, setMonth] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { tx_date: new Date().toISOString().slice(0, 10) },
  });

  const loadingRef = useRef(false);
  const loadedRef = useRef(false);
  const loadExpenses = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setExpenses(null);
    try {
      const data = await fetchJsonCached<{ expenses: Expense[] }>("/api/expenses", { ttl: 30000, swrTtl: 30000 });
      setExpenses(data.expenses || []);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Form submission handled via modal; page uses listing and filters only

  async function deleteExpense(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Expense deleted!");
      invalidateCache("/api/expenses");
      await refetchNow<{ expenses: Expense[] }>("/api/expenses");
      await loadExpenses();
    } catch {
      toast.error("Failed to delete expense");
    }
  }

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadExpenses();
  }, [loadExpenses]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (expenses || []).forEach(e => set.add((e.category || e.final_category || "Other") as string));
    return Array.from(set).sort();
  }, [expenses]);

  const filtered = useMemo(() => {
    if (!expenses) return null;
    const m = month === "all" ? null : Number(month);
    const rows = (expenses || []).filter((e) => {
      const d = new Date(e.tx_date);
      const matchesMonth = m ? d.getMonth() + 1 === m : true;
      const cat = (e.category || e.final_category || "Other") as string;
      const matchesCat = category === "all" ? true : cat === category;
      return matchesMonth && matchesCat;
    });
    // Newest first for better UX
    return rows.sort((a,b)=> new Date(b.tx_date).getTime() - new Date(a.tx_date).getTime());
  }, [expenses, month, category]);

  const numPages = useMemo(() => {
    if (!filtered) return 1;
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  }, [filtered]);

  const paged = useMemo(() => {
    if (!filtered) return null;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // Aggregation available if needed for charts; omitted to avoid unused variable warnings

  const currency = typeof Intl !== "undefined" ? new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 2 }) : null;
  return (
    <div>
      <div className="mb-3">
        <h1 className="text-3xl font-bold">Expenses</h1>
      </div>

      <div className="flex items-center gap-3">
        <Select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-40">
          <option value="all">All</option>
          {categories.map(c => <option value={c} key={c}>{c}</option>)}
        </Select>
        <Select value={month} onChange={(e)=>setMonth(e.target.value)} className="w-40">
          <option value="all">All months</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={String(m)}>{new Date(new Date().getFullYear(), m-1, 1).toLocaleString(undefined, { month: 'long' })}</option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end mt-3" style={{ marginBottom: '3%' , marginTop: '2%' }}>
        <Button onClick={() => setAdding(true)}>+ Add Expense</Button>
      </div>

      {/* Main expense list */}
      <div className="rounded-2xl glass p-4 shadow-card mb-6 h-[35vh] flex flex-col">
        <div className="text-sm text-[var(--text-secondary)] mb-2">Expense</div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400">
              <tr className="border-b border-white/10 divide-x divide-white/10">
                <th className="px-2 py-2">Expense</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null && (
                <tr><td colSpan={4} className="p-4 text-gray-500">Loading…</td></tr>
              )}
              {filtered && filtered.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No expenses</td></tr>
              )}
              {paged && paged.map(e => {
                const cat = (e.category || e.final_category || 'Other') as string;
                return (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors divide-x divide-white/10">
                    <td className="px-2 py-2 font-medium">{e.description}</td>
                    <td className="px-2 py-2">{currency ? currency.format(Number(e.amount)) : `₹${Number(e.amount).toFixed(2)}`}</td>
                    <td className="px-2 py-2"><CategoryLabel category={cat} /></td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => setEditing(e)} className="text-lime-300 hover:text-lime-200 mr-3">Edit</button>
                      <button onClick={() => deleteExpense(e.id)} className="text-red-400 hover:text-red-300">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        <div className="flex items-center justify-between pt-2 text-xs text-[var(--text-secondary)]">
          <div>
            Page {page} of {numPages} {filtered ? `( ${filtered.length} items )` : ""}
          </div>
          <div className="inline-flex gap-2">
            <button
              className="px-2 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="px-2 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50"
              disabled={page >= numPages}
              onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Recent expenses table */}
      <div className="rounded-2xl glass p-4 shadow-card h-[30vh] flex flex-col">
        <div className="text-sm text-[var(--text-secondary)] mb-2">Recent Expenses</div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400">
              <tr className="border-b border-white/10 divide-x divide-white/10">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Expense</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered === null && (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">Loading…</td>
                </tr>
              )}
              {filtered && filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">No expenses yet</td>
                </tr>
              )}
              {filtered && filtered.slice(0, 10).map((exp) => {
                const cat = (exp as { category?: string | null; final_category?: string | null }).category ?? exp.final_category ?? "Other";
                return (
                  <tr key={exp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors divide-x divide-white/10">
                    <td className="px-2 py-2">{new Date(exp.tx_date).toLocaleDateString()}</td>
                    <td className="px-2 py-2">{exp.description}</td>
                    <td className="px-2 py-2 text-right">{currency ? currency.format(Number(exp.amount)) : `₹${Number(exp.amount).toFixed(2)}`}</td>
                    <td className="px-2 py-2"><CategoryLabel category={cat} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditExpenseModal
          expense={{ id: editing.id, amount: editing.amount, description: editing.description, final_category: ((editing as { category?: string | null; final_category?: string | null }).category ?? editing.final_category ?? "Other") as string, tx_date: editing.tx_date }}
          onClose={() => setEditing(null)}
          onUpdated={loadExpenses}
        />
      )}

      {adding && (
        <EditExpenseModal
          expense={{ id: "new", amount: 0, description: "", final_category: "Other", tx_date: new Date().toISOString() }}
          onClose={() => setAdding(false)}
          onUpdated={() => { setAdding(false); loadExpenses(); }}
        />
      )}
    </div>
  );
}


