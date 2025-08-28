"use client";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function Header() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);
  const Item = ({ href, label }: { href: string; label: string }) => (
    <a
      href={href}
      className={clsx(
        "px-3 py-2 text-sm rounded-md hover:opacity-90",
        pathname === href ? "text-white" : "text-gray-300"
      )}
    >
      {label}
    </a>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-black/40">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-black text-xl tracking-tight">
          fintrack
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          <Item href="#features" label="Features" />
          <Item href="#blog" label="Blog" />
          <Item href="#faq" label="FAQ" />
        </nav>
        <div className="flex items-center gap-3">
          <NotificationBell userId={userId} />
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-lime-400/40 bg-lime-400/10 text-lime-300 px-4 py-2 text-sm hover:bg-lime-400/20"
          >
            Start now
          </Link>
        </div>
      </div>
    </header>
  );
}


