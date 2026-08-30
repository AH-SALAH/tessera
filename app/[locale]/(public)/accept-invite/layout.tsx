// app/[locale]/(public)/accept-invite/layout.tsx
// Server-side guard: redirect authenticated users to dashboard.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/site-url";
import { ReactNode } from "react";

export default async function AcceptInviteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const headersList = await headers();
  const session = await getServerSession(new Request(getSiteUrl(), { headers: headersList }));

  if (session) {
    redirect(`/${resolvedParams.locale}/dashboard`);
  }

  return <>{children}</>;
}
