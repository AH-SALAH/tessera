// app/[locale]/(admin)/projects/page.tsx
// Admin projects list — server component for initial data, client for interactivity.

import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { ProjectsListClient } from "./ProjectsListClient";
import Link from "next/link";
import { IconPlus } from "@/components/ui/icons";

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const headersList = await headers();
  const session = await getServerSession(new Request(getSiteUrl(), { headers: headersList }));
  if (!session) redirect(`/${resolvedParams.locale}/sign-in`);

  const projects = await prisma.project.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { tags: true },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-graphite">Projects</h1>
        <Link
          href={`/${resolvedParams.locale}/projects/new`}
          className="!bg-moss !text-on-primary font-data-label text-data-label px-4 py-1.5 rounded-base hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <IconPlus className="text-sm" /> Add new
        </Link>
      </div>
      <Suspense fallback={<div className="text-muted">Loading…</div>}>
        <ProjectsListClient
          initialProjects={projects}
          userRole={session.user.role}
          locale={resolvedParams.locale}
        />
      </Suspense>
    </div>
  );
}
