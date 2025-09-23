"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import dynamic from "next/dynamic";
const EditExpenseModal = dynamic(() => import("@/components/EditExpenseModal"), { ssr: false });

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>+ Expense</Button>
      <Button variant="outline">+ Income</Button>
      <Button variant="outline">+ Transfer</Button>
      {open && (
        <EditExpenseModal
          expense={{ id: "new", amount: 0, description: "", final_category: "Other", tx_date: new Date().toISOString() }}
          onClose={() => setOpen(false)}
          onUpdated={() => { router.refresh(); setOpen(false); }}
        />
      )}
    </div>
  );
}


