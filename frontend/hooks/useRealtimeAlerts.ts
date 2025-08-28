"use client";
import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function useRealtimeAlerts(userId: string | null, onNewAlert: (alert: any) => void) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` },
        (payload) => {
          onNewAlert((payload as any).new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNewAlert]);
}


