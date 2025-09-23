import { createClient } from "@/lib/supabase/server";
import { headers, cookies } from "next/headers";

export default async function InsightsCard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Build absolute URL and forward cookies so the API recognizes the user
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("host") || "localhost:3000";
  const base = `${proto}://${host}`;
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${base}/api/insights/weekly`, { cache: "no-store", headers: { cookie: cookieHeader } });
  
  const data = await res.json();
  const text = String(data.text || "No insights yet").replace(/\$/g, "₹").replace(/\$(?=\d)/g, "₹");

  return (
    <div className="text-sm whitespace-pre-wrap leading-6 text-gray-200" >
      {text}
    </div>
  );
}


