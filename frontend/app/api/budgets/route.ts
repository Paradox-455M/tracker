import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budgets: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { category, amount, month, year } = body || {};
  if (!category || !amount || !month || !year) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: user.id,
      category,
      limit_amount: Number(amount),
      period_month: Number(month),
      period_year: Number(year),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budget: data });
}


