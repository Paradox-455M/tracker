"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import EditExpenseModal from "@/components/EditExpenseModal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";

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
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid md:grid-cols-[160px_1fr_160px_160px_120px] gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Amount</label>
          <Input {...register("amount")} type="number" step="0.01" placeholder="0.00" />
          {errors.amount && <span className="text-xs text-red-400">{String(errors.amount.message)}</span>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <Input {...register("description")} placeholder="e.g., Zomato" />
          {errors.description && <span className="text-xs text-red-400">{String(errors.description.message)}</span>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <Input {...register("tx_date")} type="date" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category (optional)</label>
          <Select {...register("category")}>
            <option value="">Auto</option>
            <option>Food & Dining</option>
            <option>Groceries</option>
            <option>Transportation</option>
            <option>Shopping</option>
            <option>Subscriptions</option>
            <option>Utilities</option>
            <option>Health</option>
            <option>Entertainment</option>
            <option>Travel</option>
            <option>Rent</option>
            <option>Other</option>
          </Select>
        </div>
        <Button disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add"}
        </Button>
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
              {expenses && expenses.map((exp) => {
                const cat = (exp as any).category ?? exp.final_category ?? "Other";
                return (
                  <tr key={exp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2">{new Date(exp.tx_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{exp.description}</td>
                    <td className="px-4 py-2">
                      <Badge>{cat}</Badge>
                      {exp.ai_category ? (
                        <span className="text-xs text-gray-500 ml-2">(AI)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-right">₹{Number(exp.amount).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-3">
                        <button onClick={() => setEditing(exp)} className="text-lime-300 hover:text-lime-200">Edit</button>
                        <button onClick={() => deleteExpense(exp.id)} className="text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditExpenseModal
          expense={{ id: editing.id, amount: editing.amount, description: editing.description, final_category: ((editing as any).category ?? editing.final_category ?? "Other") as string, tx_date: editing.tx_date }}
          onClose={() => setEditing(null)}
          onUpdated={loadExpenses}
        />
      )}
    </div>
  );
}


