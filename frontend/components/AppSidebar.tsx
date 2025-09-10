"use client";
import SidebarNav from "./SidebarNav";

export default function AppSidebar() {
  return (
    <aside className="h-full p-4 border-r border-white/10 bg-white/5">
      <div className="font-black text-xl mb-6">fintrack</div>
      <SidebarNav />
    </aside>
  );
}
