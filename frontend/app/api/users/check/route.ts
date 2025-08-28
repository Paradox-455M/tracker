import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { email } = parse.data;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name, avatar_url")
    .eq("email", email)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exists: !!data, user: data ?? null });
}
