// app/[locale]/(admin)/projects/new/page.tsx
// Admin create project page

import { getServerSession } from "@/lib/auth/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/site-url";
import { CreateProjectClient } from "./CreateProjectClient";

export default async function CreateProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const headersList = await headers();
  const session = await getServerSession(new Request(getSiteUrl(), { headers: headersList }));
  if (!session) redirect(`/${resolvedParams.locale}/sign-in`);

  return <CreateProjectClient userRole={session.user.role} locale={resolvedParams.locale} />;
}
