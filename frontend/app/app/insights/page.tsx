import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";
const WeeklySummary = dynamic(() => import("@/components/WeeklySummary"));
import ClientSummaryTrigger from "./ClientSummaryTrigger";
import SummaryOverlay from "./SummaryOverlay";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Insights</h1>
        {/* Smart Summary trigger in page top-right */}
        <form action="/api/ai/chat" method="POST" className="hidden" />
        <div className="flex items-center gap-2">
          <ClientSummaryTrigger />
          <Link href="/app/ai-advisor" className="px-3 py-1.5 rounded-full bg-[var(--primary)] text-black text-sm">
            Open AI Advisor
          </Link>
        </div>
      </div>
      <SummaryOverlay />
      <div className="mt-4">
        <Suspense fallback={<div className="rounded-2xl glass p-4 h-[5vh] shadow-card animate-pulse" />}> 
          <WeeklySummary />
        </Suspense>
      </div>
    </div>
  );
}


