"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { isModuleRoute } from "@/lib/module-ui";
import "./module-ui.css";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const modulePage = isModuleRoute(usePathname());

  return (
    <div className="flex h-dvh min-w-0 bg-background overflow-hidden font-sans text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-dvh min-w-0 overflow-hidden relative z-0">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main data-module-ui={modulePage ? "true" : undefined} className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
