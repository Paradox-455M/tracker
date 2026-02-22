import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { category, amount, month, year } = body || {};
  const update: Partial<{ category: string; limit_amount: number; period_month: number; period_year: number }> = {};
  if (category !== undefined) update.category = category;
  if (amount !== undefined) {
    const n = Number(amount);
    if (n <= 0 || !isFinite(n)) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    update.limit_amount = n;
  }
  if (month !== undefined) {
    const n = Number(month);
    if (n < 1 || n > 12) return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    update.period_month = n;
  }
  if (year !== undefined) {
    const n = Number(year);
    if (n < 2000 || n > 2100) return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    update.period_year = n;
  }
  const { data, error } = await supabase
    .from("budgets")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budget: data });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}


