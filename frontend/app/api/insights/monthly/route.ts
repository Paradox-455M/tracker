import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Returns monthly aggregation: current month and previous month
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ym = searchParams.get("ym"); // optional yyyy-mm

  const now = new Date();
  const [y, m] = ym ? ym.split("-").map((v) => Number(v)) : [now.getFullYear(), now.getMonth() + 1];

  const startThis = new Date(Date.UTC(y, (m - 1), 1));
  const endThis = new Date(Date.UTC(y, m, 1)); // first day of next month
  const startPrev = new Date(Date.UTC(y, (m - 2), 1));
  const endPrev = startThis;

  const { data: current } = await supabase
    .from("expenses")
    .select("category, final_category, amount, tx_date")
    .eq("user_id", user.id)
    .gte("tx_date", startThis.toISOString())
    .lt("tx_date", endThis.toISOString());

  const { data: previous } = await supabase
    .from("expenses")
    .select("category, final_category, amount, tx_date")
    .eq("user_id", user.id)
    .gte("tx_date", startPrev.toISOString())
    .lt("tx_date", endPrev.toISOString());

  const sum = (rows?: Array<{ category?: string | null; final_category?: string | null; amount: number | string }> | null) => {
    const tot: Record<string, number> = {};
    (rows || []).forEach((r) => {
      const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
      const key = (r.category || r.final_category || "Other") as string;
      tot[key] = (tot[key] || 0) + (isNaN(amt) ? 0 : amt);
    });
    return tot;
  };

  const summary = { current: sum(current), previous: sum(previous) };

  return NextResponse.json({ summary }, { headers: { "Cache-Control": "private, max-age=900" } });
}


