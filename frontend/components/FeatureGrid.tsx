import FeatureCard from "./FeatureCard";
import { Target, BarChart3, ReceiptText, Bell, Bot, MessagesSquare } from "lucide-react";

export default function FeatureGrid() {
  const features = [
    { title: "Goal Setting", desc: "Set and track financial goals easily.", icon: <Target /> },
    { title: "Financial Reports", desc: "Generate reports to understand spending.", icon: <BarChart3 /> },
    { title: "Expense Tracking", desc: "Track all your expenses in one place.", icon: <ReceiptText /> },
    { title: "Budget Alerts", desc: "Stay within limits with proactive alerts.", icon: <Bell /> },
    { title: "AI Insights", desc: "Weekly summaries and a chat assistant.", icon: <Bot /> },
    { title: "SMS Import", desc: "Auto-parse transactions from SMS (mock).", icon: <MessagesSquare /> },
  ];
  return (
    <section id="features" className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-3 gap-6">
      {features.map((f) => (
        <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
      ))}
    </section>
  );
}


