"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";

type AlertRow = { id: string; message: string; level: "warning" | "alert"; created_at: string };

export default function NotificationBell({ userId }: { userId?: string }) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [open, setOpen] = useState(false);

  async function loadAlerts() {
    const res = await fetch("/api/alerts?unread=1", { cache: "no-store" });
    const data = await res.json();
    setAlerts(data.alerts || []);
  }

  useEffect(() => { loadAlerts(); }, []);

  useRealtimeAlerts(userId || null, (a: AlertRow) => {
    setAlerts((prev) => [a, ...prev]);
  });

  async function markRead(id: string) {
    await fetch(`/api/alerts/${id}/mark-read`, { method: "PATCH" });
    loadAlerts();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative">
        <Bell className="h-6 w-6" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
            {alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-black shadow-lg rounded-lg border z-50">
          <div className="p-2 font-semibold border-b">Notifications</div>
          <div className="max-h-64 overflow-y-auto">
            {alerts.length === 0 && (
              <div className="p-3 text-sm text-gray-500">No new alerts</div>
            )}
            {alerts.map((a) => (
              <button
                key={a.id}
                onClick={() => markRead(a.id)}
                className={`w-full text-left p-3 text-sm hover:bg-gray-100 ${a.level === "alert" ? "text-red-600" : "text-yellow-700"}`}
              >
                <div>{a.message}</div>
                <div className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
          {alerts.length > 0 && (
            <button
              onClick={async () => { await fetch("/api/alerts/mark-all-read", { method: "PATCH" }); loadAlerts(); }}
              className="w-full p-2 text-sm border-t hover:bg-gray-50"
            >
              Mark all as read
            </button>
          )}
        </div>
      )}
    </div>
  );
}


