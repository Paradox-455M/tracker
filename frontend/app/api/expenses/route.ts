import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestCategory } from "@/lib/ai/categorize";

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
  return NextResponse.json({ expenses: data });
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

  const aiCategory = await suggestCategory(description || "");
  const finalCategory = (incomingCategory && String(incomingCategory).trim())
    ? String(incomingCategory).trim()
    : aiCategory;

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      amount: Number(amount),
      description: description || null,
      ai_category: aiCategory,
      final_category: finalCategory,
      category: finalCategory,
      tx_date: tx_date ? new Date(tx_date).toISOString() : new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ expense: data });
}
