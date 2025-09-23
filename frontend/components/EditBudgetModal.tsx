"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";

const schema = z.object({
  category: z.string().min(2, "Category required"),
  amount: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, "Amount must be > 0"),
  month: z.string().optional(),
  year: z.string().optional(),
});

export type BudgetModel = {
  id: string;
  category: string;
  limit_amount: number;
  period_month: number;
  period_year: number;
};

export default function EditBudgetModal({ budget, onClose, onUpdated }: { budget: Partial<BudgetModel> & { id: string }; onClose: () => void; onUpdated: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: budget.category || "",
      amount: String(budget.limit_amount ?? ""),
      month: String(budget.period_month ?? new Date().getMonth() + 1),
      year: String(budget.period_year ?? new Date().getFullYear()),
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const isCreate = budget.id === "new";
      const url = isCreate ? "/api/budgets" : `/api/budgets/${budget.id}`;
      const method = isCreate ? "POST" : "PATCH";
      const payload = {
        category: values.category,
        amount: Number(values.amount),
        month: Number(values.month || new Date().getMonth() + 1),
        year: Number(values.year || new Date().getFullYear()),
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(isCreate ? "Budget added" : "Budget updated");
      onUpdated();
      onClose();
    } catch {
      toast.error("Error saving budget");
    }
  })

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50" aria-modal>
      <div className="relative rounded-2xl glass p-6 w-[480px] text-white shadow-card">
        <h2 className="text-xl font-semibold mb-4">{budget.id === "new" ? "Add Budget" : "Edit Budget"}</h2>
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10" aria-label="Close">
          <X size={16} />
        </button>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Category</label>
            <Select {...register("category")}>
              <option value="">Select category</option>
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
            {errors.category && <p className="text-red-400 text-xs mt-1">{String(errors.category.message)}</p>}
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Amount</label>
            <Input type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-red-400 text-xs mt-1">{String(errors.amount.message)}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Month</label>
              <Input type="number" min={1} max={12} {...register("month")} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Year</label>
              <Input type="number" min={2000} max={2999} {...register("year")} />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


