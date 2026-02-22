export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAndSyncEmailsForUser } from "@/lib/gmail/service";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await fetchAndSyncEmailsForUser(user.id);

  if (!result.synced && result.logs.some((l) => l.includes("No gmail_tokens"))) {
    return NextResponse.json({ error: "Gmail not connected", synced: 0, skipped: 0 }, { status: 422 });
  }

  return NextResponse.json({ success: true, ...result });
}


