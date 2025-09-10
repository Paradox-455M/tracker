"use client";
import clsx from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  size?: "sm" | "md" | "lg";
};

const Input = forwardRef<HTMLInputElement, Props>(function Input({ size = "md", className, ...props }, ref) {
  const sizes = {
    sm: "h-8 px-2 text-xs",
    md: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base",
  } as const;
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

export default Input;


