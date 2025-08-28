"use client";
import { useEffect, useState } from "react";

export default function InsightsCard() {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/insights/weekly");
        const data = await res.json();
        setText(data.text || "No insights yet");
      } catch {
        setText("Unable to load insights");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Generating…</div>;
  return (
    <div className="text-sm whitespace-pre-wrap leading-6 text-gray-200">
      {text}
    </div>
  );
}


