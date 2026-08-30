// app/[locale]/(admin)/users/page.tsx
// Admin users list — server component

import { getServerSession } from "@/lib/auth/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { UsersListClient } from "./UsersListClient";

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const headersList = await headers();
  const session = await getServerSession(new Request(getSiteUrl(), { headers: headersList }));
  if (!session) redirect(`/${resolvedParams.locale}/sign-in`);

  // Only admins can access users page
  if (session.user.role !== "ADMIN") {
    redirect(`/${resolvedParams.locale}/projects`);
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      locale: true,
      theme: true,
      createdAt: true,
    },
  });

  // Serialize Prisma Date objects to ISO strings so the client component
  // always receives strings (matching the GraphQL Invitation type).
  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-graphite">Users</h1>
      </div>
      <UsersListClient initialUsers={serializedUsers} locale={resolvedParams.locale} />
    </div>
  );
}
