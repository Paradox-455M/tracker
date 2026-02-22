export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("gmail_tokens, gmail_connected_at, gmail_last_synced_at")
    .eq("auth_user_id", user.id)
    .single();

  return NextResponse.json({
    connected: !!profile?.gmail_tokens,
    connectedAt: (profile?.gmail_connected_at as string | null) ?? null,
    lastSyncedAt: (profile?.gmail_last_synced_at as string | null) ?? null,
  });
}
