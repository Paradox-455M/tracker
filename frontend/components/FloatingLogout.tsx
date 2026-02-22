"use client";
import Button from "@/components/ui/Button";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function FloatingLogout() {
  const supabase = createBrowserSupabase();

  async function onLogout() {
    try {
      await supabase.auth.signOut();
      // Hard redirect to login to ensure fresh state
      window.location.href = "/login";
    } catch {
      // no-op
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={onLogout} variant="secondary" className="rounded-full shadow-lg">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}


