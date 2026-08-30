// app/[locale]/(public)/page.tsx
// Public landing page — derived from Stitch screen "Tessera: The Immersive Ledger Landing".
// Client component for i18n; interactive parts (shader, scroll-reveal) are client components.

"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShaderBackground } from "@/components/landing/ShaderBackground";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@prisma/client";

const FEATURE_IDS = ["F-01", "F-02", "F-03"] as const;

export default function PublicHomePage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects/public")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => {});
  }, []);

  const locale =
    typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const FEATURES = [
    {
      id: FEATURE_IDS[0],
      title: t("landing.feature1.title"),
      description: t("landing.feature1.description"),
    },
    {
      id: FEATURE_IDS[1],
      title: t("landing.feature2.title"),
      description: t("landing.feature2.description"),
    },
    {
      id: FEATURE_IDS[2],
      title: t("landing.feature3.title"),
      description: t("landing.feature3.description"),
    },
  ];

  const CHECK_ITEMS = [
    t("landing.checks.versionControl"),
    t("landing.checks.typedBlocks"),
    t("landing.checks.taxonomy"),
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-chalk text-graphite antialiased">
      {/* Shader Background — hidden in dark mode (shader hardcodes light palette) */}
      <div className="pointer-events-none fixed inset-0 z-0 shader-bg">
        <ShaderBackground />
      </div>

      {/* Navigation */}
      <LandingNav />

      {/* Main Content */}
      <main className="relative z-10 mx-auto w-full max-w-[1280px] px-8">
        {/* Hero Section */}
        <section className="flex min-h-[72vh] flex-col items-center justify-center pb-16 pt-24 text-center">
          <h1 className="mb-8 max-w-4xl font-display text-[52px] leading-[60px] font-bold tracking-[-0.025em] text-graphite max-md:text-[40px] max-md:leading-[48px]">
            {t("landing.hero.title")}
          </h1>
          <p className="mx-auto mb-12 max-w-xl font-body text-lg leading-[28px] text-muted">
            {t("landing.hero.description")}
          </p>
          <Link
            href={`/${locale}/sign-in`}
            className="inline-block rounded-base border border-moss bg-moss px-8 py-3 font-body text-base text-white shadow-sm transition-all duration-200 hover:bg-moss/90 hover:shadow-md active:scale-[0.98]"
          >
            {t("landing.hero.cta")}
          </Link>
        </section>

        {/* Feature Strip — catalog-drawer style, not cards */}
        <section className="border-t border-clay-line py-20" id="features">
          <div className="grid grid-cols-1 gap-px bg-clay-line md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.id}
                className="bg-surface p-8 transition-colors duration-200 hover:bg-chalk"
              >
                <span className="mb-6 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {feature.id}
                </span>
                <h3 className="mb-3 font-display text-[22px] leading-[28px] font-semibold text-graphite">
                  {feature.title}
                </h3>
                <p className="font-body text-[15px] leading-[24px] text-muted">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Showcase Section */}
        <section className="border-t border-clay-line py-24">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <h2 className="mb-6 font-display text-[32px] leading-[40px] font-semibold text-graphite max-md:text-[28px] max-md:leading-[36px]">
                {t("landing.featuresSection.title")}
              </h2>
              <p className="mb-8 font-body text-base leading-[24px] text-muted">
                {t("landing.featuresSection.description")}
              </p>
              <ul className="space-y-3 font-mono text-xs font-medium tracking-[0.05em] text-muted">
                {CHECK_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-moss bg-moss/10">
                      <svg
                        className="h-3 w-3 text-moss"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path d="M2.5 6l2.5 2.5 4.5-5" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative flex h-96 items-center justify-center overflow-hidden rounded-base border border-clay-line bg-surface p-2 md:col-span-7">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVpVqcNDihA1xivTfst5a3WcytUIFg_xP_xj3FJQh-6-7eY9MkXM4qvce4i7jxDgW1OcgBqrYs-xk-JdD0bmzPqPfDRLaP2-j6e7AtjcCRYPvsw4b1q6k_-v043FU-LbAspdnpIJ4CPbXSR-oSu9VEu9zdxvfIfUi_wynDuoRvynl3h18ZfTMH3kIRgKJ2uDfBDnMQsodK8I1ynfj4FCzHBqRqXkRrYiLEHvvwvrS3Y5aaswEOKWIm5g"
                alt="Tessera CMS dashboard — a clean, minimalist content management interface with grid index cards"
                fill
                className="relative z-10 rounded-sm border border-clay-line object-cover"
                sizes="(max-width: 768px) 100vw, 58vw"
              />
            </div>
          </div>
        </section>

        {/* Projects Grid (existing functionality) */}
        {projects.length > 0 && (
          <section className="border-t border-clay-line py-24">
            <ScrollReveal variant="up">
              <span className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                {t("landing.featuresSection.catalog")}
              </span>
              <h2 className="mb-10 font-display text-[32px] leading-[40px] font-semibold text-graphite">
                {t("landing.featuresSection.publishedProjects")}
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: Project, i: number) => (
                <ScrollReveal key={project.id} delay={i * 80} variant="up">
                  <article className="rounded-base border border-clay-line bg-surface p-6 transition-all duration-200 hover:border-moss hover:-translate-y-0.5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        PRJ-{String(i + 1).padStart(3, "0")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] ${
                          project.status === "PUBLISHED"
                            ? "bg-moss text-white"
                            : "bg-ochre text-white"
                        }`}
                      >
                        {project.status === "PUBLISHED" ? t("status.published") : t("status.draft")}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-graphite">
                      {locale.toUpperCase() === "AR"
                        ? (project.titleAr ?? project.titleEn ?? "")
                        : (project.titleEn ?? "")}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-muted">{project.stack.join(" · ")}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
