"use client";
import { ReactNode, useMemo } from "react";
import {
  Utensils,
  ShoppingCart,
  Car,
  CreditCard,
  Home,
  HeartPulse,
  Film,
  Plane,
  Zap,
  BadgeIndianRupee,
  Boxes,
} from "lucide-react";

type CategoryIconProps = { category: string | null | undefined; className?: string };

function normalizeCategory(input: string | null | undefined): string {
  return (input || "Other").trim().toLowerCase();
}

const aliasMap: Record<string, string> = {
  food: "Food & Dining",
  "food & dining": "Food & Dining",
  dining: "Food & Dining",
  restaurant: "Food & Dining",
  restaurants: "Food & Dining",

  grocery: "Groceries",
  groceries: "Groceries",

  transport: "Transportation",
  transportation: "Transportation",
  commute: "Transportation",

  shopping: "Shopping",

  subscription: "Subscriptions",
  subscriptions: "Subscriptions",

  utilities: "Utilities",
  bills: "Utilities",

  health: "Health",
  healthcare: "Health",
  medical: "Health",

  entertainment: "Entertainment",
  fun: "Entertainment",

  travel: "Travel",

  rent: "Rent",
};

function canonicalizeCategory(input: string | null | undefined): string {
  const normalized = normalizeCategory(input);
  const canonical = aliasMap[normalized];
  return canonical || (input || "Other");
}

function iconForCategory(category: string): ReactNode {
  const key = normalizeCategory(category);
  if (key.includes("food") || key.includes("dining")) return <Utensils size={14} />;
  if (key.includes("grocery")) return <ShoppingCart size={14} />;
  if (key.includes("transport")) return <Car size={14} />;
  if (key.includes("shopping")) return <ShoppingCart size={14} />;
  if (key.includes("subscription")) return <CreditCard size={14} />;
  if (key.includes("utilit") || key.includes("bill")) return <Zap size={14} />;
  if (key.includes("health") || key.includes("medical")) return <HeartPulse size={14} />;
  if (key.includes("entertain") || key.includes("fun")) return <Film size={14} />;
  if (key.includes("travel")) return <Plane size={14} />;
  if (key.includes("rent")) return <Home size={14} />;
  if (key.includes("other")) return <Boxes size={14} />;
  return <BadgeIndianRupee size={14} />;
}

export default function CategoryLabel({ category, className }: CategoryIconProps) {
  const display = useMemo(() => canonicalizeCategory(category), [category]);
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 border border-white/15 text-white/90">
        {iconForCategory(display)}
      </span>
      <span>{display}</span>
    </span>
  );
}


