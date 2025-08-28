export default function FeatureGrid() {
  const features = [
    { title: "Goal Setting", desc: "Set and track financial goals easily." },
    { title: "Financial Reports", desc: "Generate reports to understand spending." },
    { title: "Expense Tracking", desc: "Track all your expenses in one place." },
    { title: "Monthly limit", desc: "Stay within budgets with alerts." },
    { title: "AI Insights", desc: "Weekly summaries and a chat assistant." },
    { title: "SMS Import", desc: "Auto-parse transactions from SMS (mock)." },
  ];
  return (
    <section id="features" className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-3 gap-6">
      {features.map((f) => (
        <div key={f.title} className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <div className="text-lime-300 text-sm">●</div>
          <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
          <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
        </div>
      ))}
    </section>
  );
}


