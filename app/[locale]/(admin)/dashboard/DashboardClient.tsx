// app/[locale]/(admin)/dashboard/DashboardClient.tsx
"use client";

import Link from "next/link";
import { IconArrowRight, IconEdit } from "@/components/ui/icons";
import { useTranslation } from "react-i18next";

interface Stats {
  totalProjects: number;
  totalUsers: number;
  publishedProjects: number;
  draftProjects: number;
}

interface RecentProject {
  id: string;
  slug: string;
  titleEn: string | null;
  status: string;
  updatedAt: Date;
}

interface DashboardClientProps {
  stats: Stats;
  recentProjects: RecentProject[];
  locale: string;
}

export function DashboardClient({ stats, recentProjects, locale }: DashboardClientProps) {
  const { t } = useTranslation();

  return (
    <main className="p-8 flex-grow overflow-y-auto">
      <div className="max-w-[1280px] mx-auto">
        {/* Statistics Dashboard */}
        <section className="mb-8">
          <h2 className="font-headline-md text-headline-md text-primary mb-4 pb-2 border-b border-clay-line">
            {t("dashboard.stats")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              accession="STAT-01"
              value={stats.totalProjects}
              label={t("dashboard.totalProjects")}
              color="primary"
            />
            <StatCard
              accession="STAT-02"
              value={stats.publishedProjects}
              label={t("dashboard.published")}
              color="primary"
            />
            <StatCard
              accession="STAT-03"
              value={stats.totalUsers}
              label={t("dashboard.totalUsers")}
              color="primary"
            />
            <StatCard
              accession="STAT-04"
              value={stats.draftProjects}
              label={t("dashboard.draftsPending")}
              color="ochre"
            />
          </div>
        </section>

        {/* Recent Projects Grid */}
        <section>
          <div className="flex justify-between items-end mb-4 border-b border-clay-line pb-2">
            <h2 className="font-headline-md text-headline-md text-primary">
              {t("dashboard.recentProjects")}
            </h2>
            <Link
              href={`/${locale}/projects`}
              className="font-data-label text-data-label !text-on-surface-variant cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
            >
              {t("dashboard.viewAll")} <IconArrowRight className="text-sm" />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-muted text-sm py-8 text-center">{t("dashboard.noProjects")}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  accession={`PRJ-${String(index + 1).padStart(3, "0")}`}
                  title={project.titleEn || t("content.untitled")}
                  status={project.status}
                  updatedAt={project.updatedAt}
                  href={`/${locale}/projects/${project.id}`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  accession,
  value,
  label,
  color,
}: {
  accession: string;
  value: number;
  label: string;
  color: "primary" | "ochre";
}) {
  return (
    <div className="bg-surface-card border border-clay-line p-6 rounded flex flex-col items-start gap-2 h-full">
      <span className="font-accession-number text-accession-number text-on-surface-variant">
        {accession}
      </span>
      <div
        className={`font-headline-lg text-headline-lg ${color === "ochre" ? "text-ochre-draft" : "text-primary"}`}
      >
        {value}
      </div>
      <span className="font-data-label text-data-label text-on-surface uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function ProjectCard({
  accession,
  title,
  status,
  updatedAt,
  href,
}: {
  accession: string;
  title: string;
  status: string;
  updatedAt: Date;
  href: string;
}) {
  const { t } = useTranslation();
  const isPublished = status === "PUBLISHED";

  return (
    <Link
      href={href}
      className="bg-surface-card border border-clay-line rounded p-6 flex flex-col h-full hover:border-moss transition-colors group cursor-pointer relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="font-accession-number text-accession-number text-on-surface-variant group-hover:text-primary transition-colors">
          {accession}
        </span>
        <span
          className={`font-data-label text-[10px] px-2 py-0.5 rounded-xl uppercase tracking-wider ${
            isPublished ? "bg-moss text-on-primary" : "bg-ochre text-on-primary"
          }`}
        >
          {isPublished ? t("status.published") : t("status.draft")}
        </span>
      </div>

      <h3 className="font-headline-md text-headline-md text-primary mb-2 line-clamp-2">{title}</h3>

      <div className="mt-auto pt-4 border-t border-clay-line flex justify-between items-center w-full">
        <span className="font-accession-number text-accession-number text-on-surface-variant">
          {t("dashboard.lastUpdated")} {new Date(updatedAt).toLocaleDateString()}
        </span>
        <IconEdit className="text-on-surface-variant group-hover:text-primary transition-colors text-sm" />
      </div>
    </Link>
  );
}
