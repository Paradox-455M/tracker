"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={prefersReduced ? false : { opacity: 0.6, y: 4 }}
        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={prefersReduced ? { opacity: 1 } : { opacity: 0.6, y: -4 }}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.12 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}


