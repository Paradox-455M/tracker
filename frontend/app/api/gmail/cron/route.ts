export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAndSyncEmailsForUser } from "@/lib/gmail/service";

// This endpoint is intended to be called by an external scheduler (e.g., cron, Vercel cron)
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    // Vercel cron sends:  Authorization: Bearer <CRON_SECRET>
    // Manual callers can also send:  x-cron-secret: <CRON_SECRET>
    const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const legacyHeader = req.headers.get("x-cron-secret");
    if (bearerToken !== cronSecret && legacyHeader !== cronSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  const { data: users, error } = await admin
    .from("users")
    .select("auth_user_id")
    .not("gmail_tokens", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let total = 0;
  for (const u of users || []) {
    const res = await fetchAndSyncEmailsForUser(u.auth_user_id as string);
    total += res.synced;
  }

  return NextResponse.json({ success: true, synced: total });
}


