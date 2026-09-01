"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { TopNav } from "./TopNav";

interface AdminShellProps {
  locale: string;
  user: { email: string; role: string };
  children: React.ReactNode;
}

export function AdminShell({ locale, user, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar locale={locale} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-grow md:ms-64 flex flex-col min-h-screen">
        <TopNav locale={locale} user={user} onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-grow">{children}</main>
      </div>
    </div>
  );
}
