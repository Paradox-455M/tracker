import Button from "@/components/ui/Button";

export default function SubscriptionsPanel() {
  return (
    <div className="rounded-2xl glass p-4" >
      <div className="text-xl font-bold">Subscriptions</div>
      <div className="text-sm text-[var(--text-secondary)] mt-1">Track recurring subscriptions and renewals</div>
      <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="text-sm">No subscriptions yet</div>
        <div className="text-xs text-[var(--text-muted)]">Add your recurring services to avoid surprises</div>
        <Button className="mt-3">Add Subscription</Button>
      </div>
    </div>
  );
}


