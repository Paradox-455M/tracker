import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";
import RouteTransition from "@/components/RouteTransition";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-10%,#0ea5b6_0%,transparent_60%),radial-gradient(900px_500px_at_10%_-10%,#6EDC00_0%,transparent_60%),#0E0E0E] text-white grid md:grid-cols-[240px_1fr]">
      <AppSidebar />
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <RouteTransition>
            <div className="rounded-2xl glass p-6 shadow-card">
              {children}
            </div>
          </RouteTransition>
        </div>
      </main>
    </div>
  );
}


