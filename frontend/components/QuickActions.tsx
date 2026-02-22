"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { invalidateCache, refetchNow } from "@/lib/clientCache";
const EditExpenseModal = dynamic(() => import("@/components/EditExpenseModal"), { ssr: false });

type GmailStatus = {
  connected: boolean;
  connectedAt: string | null;
  lastSyncedAt: string | null;
};

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);

  const loadGmailStatus = useCallback(() => {
    fetch("/api/gmail/status")
      .then((r) => r.json())
      .then((data: GmailStatus) => setGmailStatus(data))
      .catch(() => setGmailStatus({ connected: false, connectedAt: null, lastSyncedAt: null }));
  }, []);

  useEffect(() => {
    // Handle feedback from OAuth redirect (?gmail=connected|cancelled|error)
    const params = new URLSearchParams(window.location.search);
    const gmailParam = params.get("gmail");
    if (gmailParam) {
      if (gmailParam === "connected") toast.success("Gmail connected! Click Sync to import transactions.");
      else if (gmailParam === "cancelled") toast("Gmail connection cancelled.");
      else if (gmailParam === "error") toast.error("Gmail connection failed. Please try again.");
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail");
      window.history.replaceState({}, "", url.toString());
    }

    loadGmailStatus();
  }, [loadGmailStatus]);

  async function handleSync() {
    try {
      setSyncing(true);
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();

      if (res.status === 422) {
        toast("Connect Gmail first to enable sync.");
        return;
      }
      if (!res.ok) {
        toast.error("Gmail sync failed. Please try again.");
        return;
      }

      if (Array.isArray(data.logs)) {
        data.logs.forEach((l: string) => console.log(l));
      }

      const n = data.synced ?? 0;
      const sk = data.skipped ?? 0;
      toast.success(
        n > 0
          ? `Synced ${n} new transaction${n !== 1 ? "s" : ""}${sk > 0 ? ` · ${sk} skipped` : ""}`
          : `No new transactions found${sk > 0 ? ` · ${sk} already synced` : ""}`
      );

      // Bust all caches so the UI and Gemini both see the freshest data
      invalidateCache("/api/expenses");
      await Promise.all([
        refetchNow("/api/expenses"),
        // Force server-side caches to rebuild with fresh DB data
        fetch("/api/expenses/summary?bust=1"),
        fetch("/api/insights/weekly?bust=1"),
        // Warm the Gemini context cache for the current month
        fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bust: true, mode: "monthly_summary" }),
        }).then((r) => r.body?.cancel()), // fire-and-forget the stream
      ]);

      loadGmailStatus();
      router.refresh();
    } catch {
      toast.error("Gmail sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Button variant="outline" onClick={() => setOpen(true)}>+ Expense</Button>
      <Button variant="outline">+ Income</Button>
      <Button variant="outline">+ Transfer</Button>

      {/* Gmail section — conditional on status */}
      {gmailStatus === null ? (
        // Loading state — keeps layout stable
        <Button variant="outline" disabled>Gmail…</Button>
      ) : gmailStatus.connected ? (
        <>
          <span className="inline-flex items-center gap-1.5 text-xs text-lime-400">
            <span className="inline-block w-2 h-2 rounded-full bg-lime-400" />
            Gmail connected
            {gmailStatus.lastSyncedAt && (
              <span className="text-gray-400">
                · last synced {new Date(gmailStatus.lastSyncedAt).toLocaleDateString()}
              </span>
            )}
          </span>
          <Button variant="outline" disabled={syncing} onClick={handleSync}>
            {syncing ? "Syncing…" : "Sync Gmail"}
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={() => { window.location.href = "/api/gmail/auth"; }}>
          Connect Gmail
        </Button>
      )}

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
