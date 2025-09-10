import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { suggestCategory, fallbackCategoryFromKeywords } from "@/lib/ai/categorize";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("tx_date", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const normalized = (data || []).map((e: any) => ({
    ...e,
    final_category: e.final_category ?? e.category,
    ai_category: e.ai_category ?? null,
  }));

  return NextResponse.json({ expenses: normalized });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount, description, category: incomingCategory, tx_date } = body || {};

  if (!amount || isNaN(Number(amount))) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  let finalCategory: string;
  if (incomingCategory && String(incomingCategory).trim()) {
    finalCategory = String(incomingCategory).trim();
  } else {
    const desc = (description || "").toLowerCase();

    // Hard-stop mapping for common food strings
    if (/(\bsweet\b|\bsweets\b|\bzomato\b|\bswiggy\b|\bice\s?cream\b|\brestaurant\b|\bpizza\b|\bburger\b|\bcafe\b)/.test(desc)) {
      finalCategory = "Food & Dining";
    } else {
      // Use exported local mapping first
      const local = desc ? fallbackCategoryFromKeywords(desc) : null;
      if (local) {
        finalCategory = local;
      } else {
        try {
          finalCategory = await suggestCategory(description || "");
        } catch {
          finalCategory = "Other";
        }
      }
    }

    // Debug: log classification path in dev
    if (process.env.NODE_ENV !== "production") {
      console.log("[POST /api/expenses] desc=", description, "=> category=", finalCategory);
    }
  }

  const { data: inserted, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      amount: Number(amount),
      description: description || null,
      category: finalCategory,
      tx_date: tx_date ? new Date(tx_date).toISOString() : new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const normalized = inserted ? { ...inserted, final_category: inserted.final_category ?? inserted.category, ai_category: inserted.ai_category ?? null } : null;
  return NextResponse.json({ expense: normalized });
}
