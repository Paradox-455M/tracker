import { memo } from "react";
export type Row = { id: string; tx_date: string; description: string | null; category?: string | null; final_category?: string | null; amount: number };
import CategoryLabel from "@/components/CategoryLabel";

function RecentExpensesImpl({ rows }: { rows: Row[] }) {
  const currency = typeof Intl !== "undefined" ? new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 2 }) : null;
  return (
    <div className="rounded-2xl glass p-4">
      <div className="text-xl font-bold mb-3">Recent Expenses</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const cat = r.category || r.final_category || "Other";
              return (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="px-2 py-2">{new Date(r.tx_date).toLocaleDateString()}</td>
                  <td className="px-2 py-2">{r.description}</td>
                  <td className="px-2 py-2"><CategoryLabel category={cat} /></td>
                  <td className="px-2 py-2 text-right">{currency ? currency.format(Number(r.amount)) : `₹${Number(r.amount).toFixed(2)}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const RecentExpenses = memo(RecentExpensesImpl);
export default RecentExpenses;


