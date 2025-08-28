import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
// No service role needed; we will write with the authenticated user session

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // build a redirect response we can attach cookies to
  const response = NextResponse.redirect(new URL("/app", new URL(request.url).origin));

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { domain?: string; path?: string; expires?: Date; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: true | false | "lax" | "strict" | "none" | undefined }) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: { domain?: string; path?: string }) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(new URL("/login?error=oauth", new URL(request.url).origin));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            auth_user_id: user.id,
            email: user.email,
            full_name: (user.user_metadata as Record<string, unknown> | null | undefined)?.full_name as string | null ?? null,
            avatar_url: (user.user_metadata as Record<string, unknown> | null | undefined)?.avatar_url as string | null ?? null,
          },
          { onConflict: "email" }
        );
      if (error) {
        console.error("User upsert error:", error.message);
      }
    }
  }
  return response;
}


