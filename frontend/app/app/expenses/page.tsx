"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";
import EditExpenseModal from "@/components/EditExpenseModal";

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
  final_category: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { tx_date: new Date().toISOString().slice(0, 10) },
  });

  async function loadExpenses() {
    setExpenses(null);
    const res = await fetch("/api/expenses", { cache: "no-store" });
    const data = await res.json();
    setExpenses(data.expenses || []);
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amount,
          description: values.description,
          tx_date: values.tx_date,
          category: values.category,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Expense added!");
      reset({ amount: "", description: "", tx_date: new Date().toISOString().slice(0, 10), category: "" } as unknown as z.infer<typeof schema>);
      await loadExpenses();
    } catch {
      toast.error("Error saving expense");
    }
  }

  async function deleteExpense(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Expense deleted!");
      await loadExpenses();
    } catch {
      toast.error("Failed to delete expense");
    }
  }

  useEffect(() => { loadExpenses(); }, []);

  return (
    <div>
      <Toaster position="top-right" />
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid md:grid-cols-[160px_1fr_160px_160px_120px] gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Amount</label>
          <input {...register("amount")} type="number" step="0.01" placeholder="0.00" className="w-full border border-white/10 bg-white/5 rounded p-2" />
          {errors.amount && <span className="text-xs text-red-400">{String(errors.amount.message)}</span>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <input {...register("description")} className="w-full border border-white/10 bg-white/5 rounded p-2" placeholder="e.g., Zomato" />
          {errors.description && <span className="text-xs text-red-400">{String(errors.description.message)}</span>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input {...register("tx_date")} type="date" className="w-full border border-white/10 bg-white/5 rounded p-2" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category (optional)</label>
          <input {...register("category")} className="w-full border border-white/10 bg-white/5 rounded p-2" placeholder="Auto if blank" />
        </div>
        <button disabled={isSubmitting} className="h-10 rounded bg-lime-400 text-black px-4 disabled:opacity-50">
          {isSubmitting ? "Saving…" : "Add"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-sm text-gray-400">Last 20</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400">
              <tr className="border-b border-white/10">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {expenses === null && (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">Loading…</td>
                </tr>
              )}
              {expenses && expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No expenses yet</td>
                </tr>
              )}
              {expenses && expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2">{new Date(exp.tx_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{exp.description}</td>
                  <td className="px-4 py-2">
                    <span className="mr-2">{exp.final_category}</span>
                    {exp.ai_category && exp.final_category === exp.ai_category ? (
                      <span className="text-xs text-gray-500">(AI)</span>
                    ) : (
                      <span className="text-xs text-blue-400">(Edited)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">₹{Number(exp.amount).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex gap-3">
                      <button onClick={() => setEditing(exp)} className="text-lime-300 hover:text-lime-200">Edit</button>
                      <button onClick={() => deleteExpense(exp.id)} className="text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditExpenseModal
          expense={{ id: editing.id, amount: editing.amount, description: editing.description, final_category: editing.final_category, tx_date: editing.tx_date }}
          onClose={() => setEditing(null)}
          onUpdated={loadExpenses}
        />
      )}
    </div>
  );
}


