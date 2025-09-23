"use client";
import { useEffect, useRef } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function useRealtimeAlerts(userId: string | null, onNewAlert: (alert: any) => void) {
  const callbackRef = useRef(onNewAlert);

  // Keep latest callback without changing subscription
  useEffect(() => {
    callbackRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` },
        (payload) => {
          callbackRef.current?.((payload as any).new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Only re-subscribe when userId changes.
  }, [userId]);
}


