"use client";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function DeferRender({ children, threshold = 0, idle = true, placeholder }: { children: ReactNode; threshold?: number; idle?: boolean; placeholder?: ReactNode }) {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    if (!el) {
      setReady(true);
      return;
    }
    const onVisible = () => {
      if (cancelled) return;
      if (idle && typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => void }).requestIdleCallback?.(() => !cancelled && setReady(true), { timeout: 500 });
      } else {
        setReady(true);
      }
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        onVisible();
        io.disconnect();
      }
    }, { rootMargin: "200px", threshold });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [threshold, idle]);

  return (
    <div ref={ref} style={{ display: "block", minHeight: 1 }}>
      {ready ? children : placeholder ?? null}
    </div>
  );
}


