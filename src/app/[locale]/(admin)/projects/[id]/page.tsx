// app/[locale]/(admin)/projects/[id]/page.tsx
// Admin edit project page

import { getServerSession } from "@/lib/auth/session";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { EditProjectClient } from "./EditProjectClient";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const resolvedParams = await params;
  const headersList = await headers();
  const session = await getServerSession(new Request(getSiteUrl(), { headers: headersList }));
  if (!session) redirect(`/${resolvedParams.locale}/sign-in`);

  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!project) notFound();

  // Authorization: Editors can only edit their own projects
  if (session.user.role !== "ADMIN" && project.authorId !== session.user.id) {
    notFound();
  }

  return (
    <EditProjectClient
      project={project}
      userRole={session.user.role}
      locale={resolvedParams.locale}
    />
  );
}
