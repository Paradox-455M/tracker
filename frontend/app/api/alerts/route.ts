import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const unread = searchParams.get("unread") === "1";
  let query = supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
  if (unread) query = query.eq("is_read", false);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ alerts: data });
}


