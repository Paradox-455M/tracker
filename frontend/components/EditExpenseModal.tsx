"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

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
      amount: String(expense.amount) as unknown as number,
      description: expense.description || "",
      category: expense.final_category,
      tx_date: expense.tx_date?.split("T")[0],
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Expense updated!");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error("Error updating expense");
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="rounded-xl border border-white/10 bg-white p-6 w-96 text-black">
        <h2 className="text-lg font-semibold mb-4">Edit Expense</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <input type="number" step="0.01" {...register("amount")} className="border rounded p-2" />
          {errors.amount && <p className="text-red-600 text-xs">{String(errors.amount.message)}</p>}

          <input {...register("description")} className="border rounded p-2" />
          {errors.description && <p className="text-red-600 text-xs">{String(errors.description.message)}</p>}

          <input {...register("category")} placeholder="Category" className="border rounded p-2" />
          <input type="date" {...register("tx_date")} className="border rounded p-2" />

          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button disabled={isSubmitting} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


