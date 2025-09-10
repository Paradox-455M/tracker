"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, PiggyBank, LineChart } from "lucide-react";

const links = [
  { href: "/app", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { href: "/app/expenses", label: "Expenses", icon: <Wallet size={16} /> },
  { href: "/app/budgets", label: "Budgets", icon: <PiggyBank size={16} /> },
  { href: "/app/insights", label: "Insights", icon: <LineChart size={16} /> },
];

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="grid gap-2">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              active
                ? "flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--primary)] text-black"
                : "flex items-center gap-2 px-3 py-2 rounded-full text-[var(--text-secondary)] hover:bg-white/5"
            }
          >
            <span>{l.icon}</span>
            <span className="text-sm">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}


