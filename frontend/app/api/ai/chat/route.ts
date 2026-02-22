import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

// ── Context cache ────────────────────────────────────────────────────────────
// Caches DB query results for the current month per user so rapid-fire chat
// messages don't hammer the DB. Invalidated by ?bust=1 (called after Gmail sync).
type ExpenseLite = { id: string; amount: number | string; category?: string | null; final_category?: string | null; description?: string | null; tx_date: string };
type BudgetLite = { id: string; category: string; limit_amount: number; period_month: number; period_year: number };

type ContextPayload = {
  budgets: BudgetLite[];
  currentMonthExpenses: ExpenseLite[];
  totalByCategory: Record<string, number>;
  grandTotal: number;
};

type ContextEntry = { expiresAt: number; payload: ContextPayload };
const CTX_TTL_MS = 5 * 60 * 1000; // 5 minutes
const contextStore = new Map<string, ContextEntry>();

function ctxKey(userId: string, year: number, month: number) {
  return `ctx:${userId}:${year}-${month}`;
}

async function loadContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, bust: boolean): Promise<ContextPayload> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const key = ctxKey(userId, year, month);

  if (!bust) {
    const cached = contextStore.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.payload;
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const monthEnd = new Date(Date.UTC(year, month, 1)).toISOString();

  const [{ data: budgetsRaw }, { data: expensesRaw }] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, category, limit_amount, period_month, period_year")
      .eq("user_id", userId)
      .eq("period_month", month)
      .eq("period_year", year),
    supabase
      .from("expenses")
      .select("id, amount, category, final_category, description, tx_date")
      .eq("user_id", userId)
      .gte("tx_date", monthStart)
      .lt("tx_date", monthEnd)
      .order("tx_date", { ascending: false })
      .limit(500),
  ]);

  const currentMonthExpenses: ExpenseLite[] = (expensesRaw || []).map((e) => ({
    ...e,
    // Normalize: always expose the resolved category as `category`
    category: (e.final_category || e.category || "Other") as string,
  }));

  const totalByCategory: Record<string, number> = {};
  for (const e of currentMonthExpenses) {
    const cat = (e.category as string) || "Other";
    const amt = typeof e.amount === "number" ? e.amount : parseFloat(String(e.amount));
    totalByCategory[cat] = (totalByCategory[cat] || 0) + (isNaN(amt) ? 0 : amt);
  }
  const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);

  const payload: ContextPayload = {
    budgets: (budgetsRaw as BudgetLite[] | null) || [],
    currentMonthExpenses,
    totalByCategory,
    grandTotal,
  };

  contextStore.set(key, { expiresAt: Date.now() + CTX_TTL_MS, payload });
  return payload;
}

// ── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message, mode, bust } = (await req.json()) as {
      message?: string;
      mode?: "weekly_summary" | "monthly_summary" | string;
      bust?: boolean;
    };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Load pre-computed monthly context (cached, or fresh if bust=true)
    const ctx = await loadContext(supabase, user.id, bust === true);

    // For weekly/monthly summary modes, we also need the comparison period
    const now = new Date();
    const startOfWeek = (d: Date) => { const n = new Date(d); const day = n.getDay(); const diff = (day === 0 ? -6 : 1) - day; n.setDate(n.getDate() + diff); n.setHours(0,0,0,0); return n; };
    const endOfWeek = (d: Date) => { const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999); return e; };
    const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    let thisPeriod: ExpenseLite[] | null = null;
    let lastPeriod: ExpenseLite[] | null = null;

    if (mode === "weekly_summary") {
      const thisStart = startOfWeek(now).toISOString();
      const thisEnd = endOfWeek(now).toISOString();
      const lastStart = startOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString();
      const lastEnd = endOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString();
      const [{ data: t }, { data: l }] = await Promise.all([
        supabase.from("expenses").select("id, amount, category, final_category, description, tx_date").eq("user_id", user.id).gte("tx_date", thisStart).lte("tx_date", thisEnd).order("tx_date", { ascending: false }).limit(500),
        supabase.from("expenses").select("id, amount, category, final_category, description, tx_date").eq("user_id", user.id).gte("tx_date", lastStart).lte("tx_date", lastEnd).order("tx_date", { ascending: false }).limit(500),
      ]);
      thisPeriod = (t || []).map((e) => ({ ...e, category: (e.final_category || e.category || "Other") as string }));
      lastPeriod = (l || []).map((e) => ({ ...e, category: (e.final_category || e.category || "Other") as string }));
    } else if (mode === "monthly_summary") {
      const thisStart = startOfMonth(now).toISOString();
      const thisEnd = endOfMonth(now).toISOString();
      const lastStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).toISOString();
      const lastEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).toISOString();
      const [{ data: t }, { data: l }] = await Promise.all([
        supabase.from("expenses").select("id, amount, category, final_category, description, tx_date").eq("user_id", user.id).gte("tx_date", thisStart).lte("tx_date", thisEnd).order("tx_date", { ascending: false }).limit(1000),
        supabase.from("expenses").select("id, amount, category, final_category, description, tx_date").eq("user_id", user.id).gte("tx_date", lastStart).lte("tx_date", lastEnd).order("tx_date", { ascending: false }).limit(1000),
      ]);
      thisPeriod = (t || []).map((e) => ({ ...e, category: (e.final_category || e.category || "Other") as string }));
      lastPeriod = (l || []).map((e) => ({ ...e, category: (e.final_category || e.category || "Other") as string }));
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const guardrails = `
You are an AI assistant for a personal finance tracking app. Your ONLY purpose is to help the user understand their own financial data.

RULES:
- Only answer about the user's expenses, budgets, and summaries based on the JSON provided.
- Be concise, give numbers with units (₹) and counts.
- If a question is unrelated to personal finance, reply: "I can only answer questions about your expenses, budgets, and financial summaries."
- If data is missing, reply: "I don't have enough data to answer that."
`;

    // Build context — always include the monthly snapshot + pre-computed totals
    const contextForGemini: Record<string, unknown> = {
      currentMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      budgets: ctx.budgets,
      totalByCategory: ctx.totalByCategory,
      grandTotal: ctx.grandTotal,
    };

    let prompt: string;
    if (mode === "weekly_summary" || mode === "monthly_summary") {
      contextForGemini.thisPeriod = thisPeriod;
      contextForGemini.lastPeriod = lastPeriod;
      prompt = `Context JSON:\n${JSON.stringify(contextForGemini)}\n\nGenerate a structured ${mode === "weekly_summary" ? "weekly" : "monthly"} digest that includes:\n1) Total vs previous period with % change\n2) Top 3 categories\n3) Budgets >80% used\n4) Biggest single expense\n5) One actionable suggestion\nKeep it concise.`;
    } else {
      // Free-form: include the full current-month expense list too
      contextForGemini.expenses = ctx.currentMonthExpenses;
      prompt = `Context JSON:\n${JSON.stringify(contextForGemini)}\n\nUser question: ${String(message)}\n\nAnswer:`;
    }

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
