"use client";
import clsx from "clsx";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "info";
};

export default function Badge({ variant = "default", className, ...props }: Props) {
  const styles = {
    default: "bg-white/10 text-white border border-white/10",
    success: "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30",
    warning: "bg-[#FFB347]/20 text-[#FFB347] border border-[#FFB347]/30",
    info: "bg-[#4BA3FF]/20 text-[#4BA3FF] border border-[#4BA3FF]/30",
  } as const;
  return <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs", styles[variant], className)} {...props} />;
}


