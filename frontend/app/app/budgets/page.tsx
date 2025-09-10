"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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

  async function loadBudgets() {
    const res = await fetch("/api/budgets");
    const data = await res.json();
    setBudgets(data.budgets || []);
  }

  async function addBudget(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: form.category, amount: Number(form.amount), month: Number(form.month), year: Number(form.year) }) });
    if (!res.ok) return toast.error("Failed to add");
    toast.success("Budget added");
    setForm({ ...form, category: "", amount: "" });
    loadBudgets();
  }

  async function updateBudget(id: string, patch: Partial<Budget>) {
    const res = await fetch(`/api/budgets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: patch.category, amount: patch.limit_amount, month: patch.period_month, year: patch.period_year }) });
    if (!res.ok) return toast.error("Failed to update");
    toast.success("Budget updated");
    loadBudgets();
  }

  async function deleteBudget(id: string) {
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete");
    toast.success("Budget deleted");
    loadBudgets();
  }

  useEffect(() => { loadBudgets(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Budgets</h1>
      <form onSubmit={addBudget} className="mt-4 grid md:grid-cols-[1fr_160px_120px_120px_120px] gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category</label>
          <Input value={form.category} onChange={(e)=>setForm(f=>({...f, category: e.target.value}))} placeholder="Food & Dining" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Amount</label>
          <Input value={form.amount} onChange={(e)=>setForm(f=>({...f, amount: e.target.value}))} type="number" step="0.01" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Month</label>
          <Input value={form.month} onChange={(e)=>setForm(f=>({...f, month: e.target.value}))} type="number" min={1} max={12} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Year</label>
          <Input value={form.year} onChange={(e)=>setForm(f=>({...f, year: e.target.value}))} type="number" min={2000} max={2999} />
        </div>
        <Button>Add</Button>
      </form>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-sm text-gray-400">Budgets</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400">
              <tr className="border-b border-white/10">
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Month</th>
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => (
                <tr key={b.id} className="border-b border-white/5">
                  <td className="px-4 py-2">
                    <Input defaultValue={b.category} onBlur={(e)=>updateBudget(b.id,{ category: e.target.value })} size="sm" />
                  </td>
                  <td className="px-4 py-2">
                    <Input type="number" step="0.01" defaultValue={String(b.limit_amount)} onBlur={(e)=>updateBudget(b.id,{ limit_amount: Number(e.target.value) })} size="sm" className="w-32" />
                  </td>
                  <td className="px-4 py-2">
                    <Input type="number" min={1} max={12} defaultValue={b.period_month} onBlur={(e)=>updateBudget(b.id,{ period_month: Number(e.target.value) })} size="sm" className="w-20" />
                  </td>
                  <td className="px-4 py-2">
                    <Input type="number" min={2000} max={2999} defaultValue={b.period_year} onBlur={(e)=>updateBudget(b.id,{ period_year: Number(e.target.value) })} size="sm" className="w-24" />
                  </td>
                  <td className="px-4 py-2 text-right"><button onClick={()=>deleteBudget(b.id)} className="text-red-400 hover:text-red-300">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


