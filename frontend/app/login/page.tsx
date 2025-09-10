"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createBrowserSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

async function checkUser(email: string) {
  const res = await fetch("/api/users/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) return { exists: false };
  return res.json();
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/app");
    });
  }, [router]);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Checking account...");
    const result = await checkUser(email);
    const supabase = createBrowserSupabase();
    if (result?.exists) {
      setStatus("Account found. Sending magic link...");
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      alert("Check your email for the login link.");
    } else {
      setStatus("No account found. Creating account...");
      // For sign-up, we rely on Google OAuth or email magic link; to initiate, send OTP (will create auth user on click)
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      alert("Check your email to complete sign-up.");
    }
  }

  async function signInWithGoogle() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl glass p-6">
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p className="text-sm text-[var(--text-secondary)]">Sign in or create an account</p>
        <form onSubmit={signInWithEmail} className="space-y-3">
          <Input placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required />
          <Button className="w-full" type="submit">Continue with Email</Button>
        </form>
        <Button variant="outline" className="w-full" onClick={signInWithGoogle}>Continue with Google</Button>
        {status && <p className="text-xs text-[var(--text-muted)]">{status}</p>}
      </div>
    </div>
  );
}


