"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Message = { id: string; role: "user" | "assistant"; content: string };

export default function AIChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", role: "assistant", content: "Hi! Ask me about your spending, budgets, or summaries." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    const newUser: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, newUser]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      if (!res.body) {
        const fallback = await res.json().catch(() => ({} as any));
        const reply = (fallback && fallback.reply) || "I don’t have enough data to answer that.";
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-2xl glass p-4 h-80 shadow-card flex flex-col">
      <div className="text-sm text-[var(--text-secondary)] mb-2">AI Assistant</div>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "assistant" ? "flex" : "flex justify-end"}>
            <div className={m.role === "assistant" ? "rounded-2xl rounded-tl-md bg-white/10 px-3 py-2 text-sm max-w-[70%]" : "rounded-2xl rounded-tr-md bg-[var(--primary)]/20 text-[var(--primary)] px-3 py-2 text-sm max-w-[70%]"}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-[var(--text-muted)]">Gemini is typing…</div>}
      </div>
      <form onSubmit={sendMessage} className="mt-3 flex items-center gap-2">
        <Input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask about your spending…" onKeyDown={(e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
        <Button type="submit">Send</Button>
      </form>
    </motion.div>
  );
}


