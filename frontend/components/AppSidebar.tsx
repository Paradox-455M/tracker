"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/expenses", label: "Expenses" },
  { href: "/app/budgets", label: "Budgets" },
  { href: "/app/insights", label: "Insights" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="h-full p-4 border-r border-white/10 bg-white/5">
      <div className="font-black text-xl mb-6">fintrack</div>
      <nav className="grid gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "px-3 py-2 rounded-md text-sm",
              pathname === l.href ? "bg-lime-400/15 text-lime-300" : "text-gray-300 hover:bg-white/5"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
