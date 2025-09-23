export default function AccountsSummary({ totals }: { totals: number }) {
  return (
    <div className="grid md:grid-cols-2 gap-4" style={{ width: '100%' }}>
      <div className="rounded-2xl glass p-4" >
        <div className="text-sm text-[var(--text-secondary)]">Cash</div>
        <div className="text-2xl font-bold mt-1">₹{(1361.7).toFixed(2)}</div>
        <div className="text-xs text-[var(--text-muted)] mt-2">Expenses</div>
        <div className="text-sm">₹{totals.toFixed(2)}</div>
      </div>
      <div className="rounded-2xl glass p-4">
        <div className="text-sm text-[var(--text-secondary)]">Credit Card</div>
        <div className="text-2xl font-bold mt-1">₹{(790).toFixed(2)}</div>
        <div className="text-xs text-[var(--text-muted)] mt-2">Expenses</div>
        <div className="text-sm">₹{totals.toFixed(2)}</div>
      </div>
    </div>
  );
}


