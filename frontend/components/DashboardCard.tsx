"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function DashboardCard({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl glass p-4 h-full shadow-card"
    >
      {subtitle && <div className="text-xs text-[var(--text-muted)]">{subtitle}</div>}
      <div className="text-sm text-[var(--text-secondary)] mb-1">{title}</div>
      <div>{children}</div>
    </motion.div>
  );
}


