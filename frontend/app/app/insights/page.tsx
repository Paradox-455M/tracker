import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
import { Suspense } from "react";
const WeeklySummary = dynamic(() => import("@/components/WeeklySummary"));
const AIChatAssistant = dynamic(() => import("@/components/AIChatAssistant"));
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
        <ClientSummaryTrigger />
      </div>
      <SummaryOverlay />
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <Suspense fallback={<div className="rounded-2xl glass p-4 h-80 shadow-card animate-pulse" />}> 
          <WeeklySummary />
        </Suspense>
        <Suspense fallback={<div className="rounded-2xl glass p-4 h-80 shadow-card animate-pulse" />}> 
          <AIChatAssistant />
        </Suspense>
      </div>
    </div>
  );
}


