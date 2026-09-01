// app/[locale]/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth/session";
import { isEnabled } from "@/lib/feature-flags";
import { getSiteUrl } from "@/lib/site-url";
import { AdminLayoutClient } from "./AdminLayoutClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReactNode } from "react";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const headersList = await headers();
  const session = await getServerSession(new Request(getSiteUrl(), { headers: headersList }));
  if (!session) redirect(`/${resolvedParams.locale}/sign-in`);

  // T046: fetched ONCE here at layout level, passed down via context — never re-checked
  // per-component (FR-010).
  const aiDraftAssistEnabled = await isEnabled("AI_DRAFT_ASSIST");

  return (
    <AdminShell
      locale={resolvedParams.locale}
      user={{ email: session.user.email, role: session.user.role }}
    >
      <AdminLayoutClient
        locale={resolvedParams.locale}
        aiDraftAssistEnabled={aiDraftAssistEnabled}
      >
        {children}
      </AdminLayoutClient>
    </AdminShell>
  );
}
