import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestCategory } from "@/lib/ai/categorize";

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount, description, category, tx_date } = body || {};

  const { data: existing } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let updatedCategory: string | undefined = undefined;
  if (typeof category === "string" && category.trim()) {
    updatedCategory = String(category).trim();
  } else if (typeof description === "string" && description !== existing.description) {
    try {
      updatedCategory = await suggestCategory(description);
    } catch {
      updatedCategory = existing.category;
    }
  }

  const { data, error } = await supabase
    .from("expenses")
    .update({
      amount: amount ?? existing.amount,
      description: description ?? existing.description,
      category: updatedCategory ?? existing.category,
      tx_date: tx_date ? new Date(tx_date).toISOString() : existing.tx_date,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ expense: data });
}
