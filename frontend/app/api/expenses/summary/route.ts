import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .select("final_category, amount")
    .eq("user_id", user.id)
    .gte("tx_date", start)
    .lt("tx_date", next);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const totals: Record<string, number> = {};
  (data || []).forEach((r: { final_category?: string; amount: number | string }) => {
    const key = r.final_category || "Other";
    const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
    totals[key] = (totals[key] || 0) + (isNaN(amt) ? 0 : amt);
  });

  return NextResponse.json({ totals, month: now.getMonth() + 1, year: now.getFullYear() });
}


