"use client";
import { useState } from "react";

export default function ClientSummaryTrigger() {
  const [loading, setLoading] = useState(false);

  async function run() {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "weekly_summary" }) });
      const event = new CustomEvent("summary:start");
      window.dispatchEvent(event);
      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          window.dispatchEvent(new CustomEvent("summary:chunk", { detail: chunk }));
        }
      } else {
        const json = await res.json();
        window.dispatchEvent(new CustomEvent("summary:chunk", { detail: json.reply || "Not enough data." }));
      }
      window.dispatchEvent(new CustomEvent("summary:end"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={run} className="rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black text-sm px-4 py-2">
      {loading ? "Generating…" : "Get Smart Summary"}
    </button>
  );
}


