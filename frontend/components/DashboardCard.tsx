"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export default function DashboardCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children?: ReactNode; className?: string }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
      className={`rounded-2xl glass p-4 shadow-card inline-flex flex-col gap-2 w-full ${className ?? ""}`}
    >
      {subtitle && <div className="text-xs text-[var(--text-muted)]">{subtitle}</div>}
      <div className="text-sm text-[var(--text-secondary)]">{title}</div>
      <div className="contents">{children}</div>
    </motion.div>
  );
}


