import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AIChatAssistant from "@/components/AIChatAssistant";

export default async function AIAdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Advisor</h1>
      </div>
      <div className="mt-4">
        <AIChatAssistant />
      </div>
    </div>
  );
}


