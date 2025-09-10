"use client";
import clsx from "clsx";
import { SelectHTMLAttributes, forwardRef } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  size?: "sm" | "md" | "lg";
};

const Select = forwardRef<HTMLSelectElement, Props>(function Select({ size = "md", className, children, ...props }, ref) {
  const sizes = {
    sm: "h-8 px-2 text-xs",
    md: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base",
  } as const;
  return (
    <select
      ref={ref}
      className={clsx(
        "w-full rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;


