import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Insights</h1>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-64">
          Weekly summary
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-64">
          AI chat assistant
        </div>
      </div>
    </div>
  );
}


