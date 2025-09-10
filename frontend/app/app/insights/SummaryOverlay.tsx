"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SummaryOverlay() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    function onStart() {
      setText("");
      setOpen(true);
    }
    function onChunk(e: any) {
      setText((prev) => prev + (e.detail || ""));
    }
    function onEnd() {
      // keep open until user closes or runs again
    }
    window.addEventListener("summary:start", onStart);
    window.addEventListener("summary:chunk", onChunk as any);
    window.addEventListener("summary:end", onEnd);
    return () => {
      window.removeEventListener("summary:start", onStart);
      window.removeEventListener("summary:chunk", onChunk as any);
      window.removeEventListener("summary:end", onEnd);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="fixed top-4 right-6 z-50 w-[min(420px,90vw)]">
          <div className="glass rounded-2xl border border-white/10 shadow-card p-4 text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Weekly Digest</div>
              <button onClick={()=>setOpen(false)} className="text-xs text-white/70 hover:text-white">Close</button>
            </div>
            {text || "Preparing summary…"}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


