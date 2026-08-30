// lib/content/service.ts
// Single source for content read/write logic (Constitution Article V). The public path
// (getPublicProjects) and the authenticated admin path (getProjects) are deliberately
// SEPARATE functions — Constitution Article VI: the public path is never "the same resolver
// with a trust-the-client shortcut," it force-filters at the query level.

import { prisma } from "@/lib/prisma";
import type { ContentStatus, Role } from "@prisma/client";

type Locale = "EN" | "AR";

export interface ResolvedField {
  value: string;
  locale: Locale;
  localeFallback: boolean;
}

/** FR-005: falls back to the available locale rather than returning null/empty. */
export function resolveLocalizedField(
  en: string | null,
  ar: string | null,
  requested: Locale,
): ResolvedField {
  const primary = requested === "EN" ? en : ar;
  if (primary) return { value: primary, locale: requested, localeFallback: false };

  const fallback = requested === "EN" ? ar : en;
  if (fallback) {
    return { value: fallback, locale: requested === "EN" ? "AR" : "EN", localeFallback: true };
  }

  return { value: "", locale: requested, localeFallback: false };
}

/** FR-001: public callers can never retrieve non-PUBLISHED content, whatever they request. */
export async function getPublicProjects() {
  return prisma.project.findMany({ where: { status: "PUBLISHED" }, include: { tags: true } });
}

export async function getPublicProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { tags: true },
  });
}

/** Authenticated admin path — status filter here reflects what the caller is actually allowed to see. */
export async function getProjectsForUser(userId: string, role: Role, status?: ContentStatus) {
  if (role === "ADMIN") {
    return prisma.project.findMany({
      where: status ? { status } : undefined,
      include: { tags: true },
    });
  }
  // Editors see their own content across all statuses, and everyone's PUBLISHED content.
  return prisma.project.findMany({
    where: {
      OR: [{ authorId: userId }, { status: "PUBLISHED" }],
      ...(status ? { status } : {}),
    },
    include: { tags: true },
  });
}
