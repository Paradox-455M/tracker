export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { exchangeCodeForTokens } from "@/lib/gmail/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  // User denied permission or Google returned an error
  if (oauthError || !code) {
    const reason = oauthError === "access_denied" ? "cancelled" : "error";
    return NextResponse.redirect(new URL(`/app?gmail=${reason}`, origin));
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("[gmail/callback] Token exchange failed:", err);
    return NextResponse.redirect(new URL("/app?gmail=error", origin));
  }

  const response = NextResponse.redirect(new URL("/app?gmail=connected", origin));

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: { domain?: string; path?: string; expires?: Date; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: true | false | "lax" | "strict" | "none" | undefined }) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: { domain?: string; path?: string }) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const { error: updateErr } = await supabase
    .from("users")
    .update({ gmail_tokens: tokens, gmail_connected_at: new Date().toISOString() })
    .eq("auth_user_id", user.id);

  if (updateErr) {
    console.error("[gmail/callback] Failed to save tokens:", updateErr.message);
    return NextResponse.redirect(new URL("/app?gmail=error", origin));
  }

  return response;
}
