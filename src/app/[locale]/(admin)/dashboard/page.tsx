// app/[locale]/(admin)/dashboard/page.tsx
// Admin dashboard — server component for stats, client for interactivity.

import { getServerSession } from "@/lib/auth/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const headersList = await headers();
  const session = await getServerSession(new Request(getSiteUrl(), { headers: headersList }));
  if (!session) redirect(`/${resolvedParams.locale}/sign-in`);

  const [stats, recentProjects] = await Promise.all([
    prisma.$queryRaw<
      {
        total_projects: bigint;
        total_users: bigint;
        published_projects: bigint;
        draft_projects: bigint;
      }[]
    >`
      SELECT
        (SELECT COUNT(*) FROM "Project") AS total_projects,
        (SELECT COUNT(*) FROM "user") AS total_users,
        (SELECT COUNT(*) FROM "Project" WHERE status = 'PUBLISHED') AS published_projects,
        (SELECT COUNT(*) FROM "Project" WHERE status = 'DRAFT') AS draft_projects
    `,
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        slug: true,
        titleEn: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  const stat = stats[0];
  const totalProjects = Number(stat.total_projects);
  const totalUsers = Number(stat.total_users);
  const publishedProjects = Number(stat.published_projects);
  const draftProjects = Number(stat.draft_projects);

  return (
    <DashboardClient
      stats={{
        totalProjects,
        totalUsers,
        publishedProjects,
        draftProjects,
      }}
      recentProjects={recentProjects}
      locale={resolvedParams.locale}
    />
  );
}
