"use client";
import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export default function Button({ variant = "primary", size = "md", className, ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  } as const;
  const variants = {
    primary: "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black",
    outline: "border border-white/20 text-white hover:bg-white/5",
    ghost: "text-white hover:bg-white/5",
  } as const;
  return <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />;
}


