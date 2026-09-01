// lib/graphql-schema/resolvers/project.ts
// Reference implementation of the requireRole() pattern (Constitution Article V) — Post and
// Testimonial resolvers (not scaffolded in this download, see tasks.md T030-T031) follow this
// exact shape, reusing requireRole() rather than reimplementing the check.

import { requireRole, type GraphQLContext } from "../auth-guard";
import {
  getPublicProjects,
  getPublicProjectBySlug,
  getProjectsForUser,
  resolveLocalizedField,
} from "@/lib/content/service";
import { projectInputSchema } from "@/lib/validation/project";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { deduplicateSlug } from "@/lib/slug";

/** Validate mutation input against the shared Article V schema. */
function parseProjectInput(input: unknown) {
  try {
    return projectInputSchema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new GraphQLError("Invalid project input", {
        extensions: { code: "BAD_USER_INPUT", details: err.flatten().fieldErrors },
      });
    }
    throw err;
  }
}

export const projectResolvers = {
  Query: {
    // Public path (FR-001): status arg is intentionally ignored for unauthenticated callers.
    projects: async (_: unknown, args: { status?: string }, ctx: GraphQLContext) => {
      if (!ctx.session) return getPublicProjects();
      return getProjectsForUser(ctx.session.user.id, ctx.session.user.role, args.status as any);
    },
    project: async (_: unknown, args: { slug: string }, ctx: GraphQLContext) => {
      if (!ctx.session) return getPublicProjectBySlug(args.slug);
      return prisma.project.findUnique({ where: { slug: args.slug }, include: { tags: true } });
    },
  },

  Project: {
    title: (
      parent: { titleEn: string | null; titleAr: string | null },
      args: { locale: "EN" | "AR" },
    ) => resolveLocalizedField(parent.titleEn, parent.titleAr, args.locale ?? "EN"),
    description: (
      parent: { descriptionEn: string | null; descriptionAr: string | null },
      args: { locale: "EN" | "AR" },
    ) => resolveLocalizedField(parent.descriptionEn, parent.descriptionAr, args.locale ?? "EN"),
  },

  Mutation: {
    createProject: requireRole(["ADMIN", "EDITOR"], async (_, args: { input: any }, ctx) => {
      const parsed = parseProjectInput(args.input);
      const slug = await deduplicateSlug(
        parsed.slug,
        (s) => prisma.project.findUnique({ where: { slug: s } }).then(Boolean),
        async (base) => {
          const rows = await prisma.$queryRaw<{ max_suffix: bigint | null }[]>`
            SELECT MAX(CAST(regexp_replace(slug, ${`^${base}-`}, '') AS BIGINT)) AS max_suffix
            FROM "Project"
            WHERE slug LIKE ${base + "-%"}
              AND slug ~ ${`^${base}-\\d+$`}
          `;
          return Number(rows[0]?.max_suffix ?? 0);
        },
      );
      return prisma.project.create({
        data: { ...parsed, slug, authorId: ctx.session!.user.id, status: "DRAFT" },
        include: { tags: true },
      });
    }),

    updateProject: requireRole(
      ["ADMIN", "EDITOR"],
      async (_, args: { id: string; input: any }, ctx) => {
        const existing = await prisma.project.findUniqueOrThrow({ where: { id: args.id } });
        if (ctx.session!.user.role !== "ADMIN" && existing.authorId !== ctx.session!.user.id) {
          throw new GraphQLError("FORBIDDEN", { extensions: { code: "FORBIDDEN" } });
        }
        const parsed = parseProjectInput(args.input);
        let slug = parsed.slug;
        if (slug !== existing.slug) {
          slug = await deduplicateSlug(
            slug,
            async (s) => {
              const found = await prisma.project.findUnique({ where: { slug: s } });
              return found !== null && found.id !== args.id;
            },
            async (base) => {
              const rows = await prisma.$queryRaw<{ max_suffix: bigint | null }[]>`
              SELECT MAX(CAST(regexp_replace(slug, ${`^${base}-`}, '') AS BIGINT)) AS max_suffix
              FROM "Project"
              WHERE slug LIKE ${base + "-%"}
                AND slug ~ ${`^${base}-\\d+$`}
                AND id != ${args.id}
            `;
              return Number(rows[0]?.max_suffix ?? 0);
            },
          );
        }
        return prisma.project.update({
          where: { id: args.id },
          data: { ...parsed, slug },
          include: { tags: true },
        });
      },
    ),

    // FR-007: Editors may delete only their own UNPUBLISHED drafts; Admins may delete anything.
    deleteProject: requireRole(["ADMIN", "EDITOR"], async (_, args: { id: string }, ctx) => {
      const existing = await prisma.project.findUniqueOrThrow({ where: { id: args.id } });
      const isAdmin = ctx.session!.user.role === "ADMIN";
      const isOwnUnpublishedDraft =
        existing.authorId === ctx.session!.user.id && existing.status === "DRAFT";
      if (!isAdmin && !isOwnUnpublishedDraft) {
        throw new GraphQLError("FORBIDDEN", { extensions: { code: "FORBIDDEN" } });
      }
      await prisma.project.delete({ where: { id: args.id } });
      return true;
    }),

    // FR-008: publish is Admin-only, no exceptions.
    publishProject: requireRole(["ADMIN"], async (_, args: { id: string }) => {
      return prisma.project.update({
        where: { id: args.id },
        data: { status: "PUBLISHED" },
        include: { tags: true },
      });
    }),
  },
};
