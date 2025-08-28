import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-10%,#6ee7b7_0%,transparent_60%),radial-gradient(900px_500px_at_10%_-10%,#6366f1_0%,transparent_60%),#0a0a0a] text-white grid md:grid-cols-[240px_1fr]">
      <AppSidebar />
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-card">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}


