"use client";
import { useState } from "react";

export default function Accordion({ items }: { items: { title: string; content: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
      {items.map((it, idx) => (
        <div key={idx}>
          <button
            className="w-full text-left px-4 py-4 flex items-center justify-between"
            onClick={() => setOpen(open === idx ? null : idx)}
          >
            <span className="font-medium">{it.title}</span>
            <span className="text-xl">{open === idx ? "–" : "+"}</span>
          </button>
          {open === idx && (
            <div className="px-4 pb-4 text-sm text-gray-400">{it.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}


