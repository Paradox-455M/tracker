import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { message, mode } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Base budgets
    const { data: budgets } = await supabase
      .from("budgets")
      .select("id, category, limit_amount")
      .eq("user_id", user.id);

    let expenses: any[] = [];
    let thisPeriod: any[] | null = null;
    let lastPeriod: any[] | null = null;

    const now = new Date();
    const startOfWeek = (d: Date) => { const n = new Date(d); const day = n.getDay(); const diff = (day === 0 ? -6 : 1) - day; n.setDate(n.getDate() + diff); n.setHours(0,0,0,0); return n; };
    const endOfWeek = (d: Date) => { const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999); return e; };
    const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    if (mode === "weekly_summary") {
      const thisStart = startOfWeek(now).toISOString();
      const thisEnd = endOfWeek(now).toISOString();
      const lastStart = startOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString();
      const lastEnd = endOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString();
      const { data: t } = await supabase.from("expenses").select("id, amount, category, description, tx_date").eq("user_id", user.id).gte("tx_date", thisStart).lte("tx_date", thisEnd).order("tx_date", { ascending: false }).limit(500);
      const { data: l } = await supabase.from("expenses").select("id, amount, category, description, tx_date").eq("user_id", user.id).gte("tx_date", lastStart).lte("tx_date", lastEnd).order("tx_date", { ascending: false }).limit(500);
      thisPeriod = t || [];
      lastPeriod = l || [];
    } else if (mode === "monthly_summary") {
      const thisStart = startOfMonth(now).toISOString();
      const thisEnd = endOfMonth(now).toISOString();
      const lastStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).toISOString();
      const lastEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).toISOString();
      const { data: t } = await supabase.from("expenses").select("id, amount, category, description, tx_date").eq("user_id", user.id).gte("tx_date", thisStart).lte("tx_date", thisEnd).order("tx_date", { ascending: false }).limit(1000);
      const { data: l } = await supabase.from("expenses").select("id, amount, category, description, tx_date").eq("user_id", user.id).gte("tx_date", lastStart).lte("tx_date", lastEnd).order("tx_date", { ascending: false }).limit(1000);
      thisPeriod = t || [];
      lastPeriod = l || [];
    } else {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: e } = await supabase
        .from("expenses")
        .select("id, amount, category, description, tx_date")
        .eq("user_id", user.id)
        .gte("tx_date", since)
        .order("tx_date", { ascending: false })
        .limit(100);
      expenses = e || [];
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: "I don't have an AI key configured. Based on your data, I can answer simple summaries, totals, and budget usage." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const guardrails = `
You are an AI assistant for a personal finance tracking app. Your ONLY purpose is to help the user understand their own financial data.

RULES:
- Only answer about the user's expenses, budgets, and summaries based on the JSON provided.
- Be concise, give numbers with units (₹) and counts.
- If a question is unrelated to personal finance, reply: "I can only answer questions about your expenses, budgets, and financial summaries."
- If data is missing, reply: "I don’t have enough data to answer that."
`;

    const context: any = { budgets: budgets || [] };
    if (mode === "weekly_summary" || mode === "monthly_summary") {
      context.thisPeriod = thisPeriod;
      context.lastPeriod = lastPeriod;
    } else {
      context.expenses = expenses || [];
    }

    const prompt = mode === "weekly_summary" || mode === "monthly_summary"
      ? `Context JSON:\n${JSON.stringify(context)}\n\nGenerate a structured ${mode === "weekly_summary" ? "weekly" : "monthly"} digest that includes:\n1) Total vs previous period with % change\n2) Top 3 categories\n3) Budgets >80% used\n4) Biggest single expense\n5) One actionable suggestion\nKeep it concise.`
      : `Context JSON:\n${JSON.stringify(context)}\n\nUser question: ${String(message)}\n\nAnswer:`;

    const fullPrompt = `${guardrails}\n\n${prompt}`;

    // Stream response tokens to the client
    const encoder = new TextEncoder();
    const stream = await model.generateContentStream(fullPrompt);

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (e) {
          controller.error(e);
          return;
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("/api/ai/chat error", err);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}


