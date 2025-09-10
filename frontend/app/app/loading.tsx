export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-white/10 rounded" />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="h-28 rounded-2xl bg-white/10" />
        <div className="h-28 rounded-2xl bg-white/10" />
        <div className="h-28 rounded-2xl bg-white/10" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-72 rounded-2xl bg-white/10" />
        <div className="h-72 rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}


