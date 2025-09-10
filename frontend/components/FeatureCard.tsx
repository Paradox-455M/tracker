"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl glass p-6 shadow-card transition-shadow hover:shadow-glow"
    >
      <div className="text-[var(--primary)]">{icon}</div>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{desc}</p>
    </motion.div>
  );
}


