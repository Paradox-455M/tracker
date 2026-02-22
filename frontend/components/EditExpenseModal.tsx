"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { X } from "lucide-react";
import { invalidateCache } from "@/lib/clientCache";
import { CATEGORIES } from "@/lib/categories";

const schema = z.object({
  amount: z.string().transform((v) => Number(v)).refine((n) => !isNaN(n) && n > 0, "Amount must be > 0"),
  description: z.string().min(2, "Description required"),
  category: z.string().optional(),
  tx_date: z.string().optional(),
});

export type Expense = {
  id: string;
  amount: number;
  description: string | null;
  final_category: string;
  tx_date: string;
};

export default function EditExpenseModal({ expense, onClose, onUpdated }: { expense: Expense; onClose: () => void; onUpdated: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      // Keep defaults as strings for HTML inputs; schema will transform
      amount: String(expense.amount) as unknown as number,
      description: expense.description || "",
      category: expense.final_category,
      tx_date: expense.tx_date?.split("T")[0],
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const isCreate = expense.id === "new";
      const url = isCreate ? "/api/expenses" : `/api/expenses/${expense.id}`;
      const method = isCreate ? "POST" : "PATCH";
      const payload = {
        amount: values.amount,
        description: values.description,
        category: values.category,
        tx_date: values.tx_date,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(isCreate ? "Failed to create" : "Failed to update");
      toast.success(isCreate ? "Expense added!" : "Expense updated!");
      // Bust cached expense list so the table re-renders immediately
      invalidateCache("/api/expenses");
      onUpdated();
      onClose();
    } catch {
      toast.error("Error saving expense");
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50" aria-modal="true" role="dialog">
      <div className="relative rounded-2xl glass p-6 w-[480px] text-white shadow-card">
        <h2 className="text-xl font-semibold mb-4">{expense.id === "new" ? "Add Expense" : "Edit Expense"}</h2>
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10" aria-label="Close">
          <X size={16} />
        </button>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Amount</label>
            <Input type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-red-400 text-xs mt-1">{String(errors.amount.message)}</p>}
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
            <Input {...register("description")} placeholder="e.g., Zomato order" />
            {errors.description && <p className="text-red-400 text-xs mt-1">{String(errors.description.message)}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Category</label>
              <Select {...register("category")}>
                <option value="">Auto</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Date</label>
              <Input type="date" {...register("tx_date")} />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


