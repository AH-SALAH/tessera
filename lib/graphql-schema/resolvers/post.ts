// lib/graphql-schema/resolvers/post.ts
import { requireRole, type GraphQLContext } from "../auth-guard";
import { prisma } from "@/lib/prisma";
import { GraphQLError } from "graphql";

export const postResolvers = {
  Query: {
    posts: async (_: unknown, args: { status?: string }, ctx: GraphQLContext) => {
      if (!ctx.session) {
        return prisma.post.findMany({ where: { status: "PUBLISHED" } });
      }
      if (ctx.session.user.role === "ADMIN") {
        return prisma.post.findMany({
          where: args.status ? { status: args.status as any } : undefined,
        });
      }
      return prisma.post.findMany({
        where: {
          OR: [{ authorId: ctx.session.user.id }, { status: "PUBLISHED" }],
          ...(args.status ? { status: args.status as any } : {}),
        },
      });
    },
    post: async (_: unknown, args: { slug: string }, ctx: GraphQLContext) => {
      if (!ctx.session) {
        return prisma.post.findFirst({ where: { slug: args.slug, status: "PUBLISHED" } });
      }
      return prisma.post.findUnique({ where: { slug: args.slug } });
    },
  },

  Post: {
    title: (
      parent: { titleEn: string | null; titleAr: string | null },
      args: { locale: "EN" | "AR" },
    ) => (parent as any).titleEn || (parent as any).titleAr,
    body: (
      parent: { bodyEn: string | null; bodyAr: string | null },
      args: { locale: "EN" | "AR" },
    ) => (parent as any).bodyEn || (parent as any).bodyAr,
  },

  Mutation: {
    createPost: requireRole(["ADMIN", "EDITOR"], async (_: unknown, args: { input: any }, ctx) => {
      return prisma.post.create({
        data: { ...args.input, authorId: ctx.session!.user.id, status: "DRAFT" },
      });
    }),

    updatePost: requireRole(
      ["ADMIN", "EDITOR"],
      async (_: unknown, args: { id: string; input: any }, ctx) => {
        const existing = await prisma.post.findUniqueOrThrow({ where: { id: args.id } });
        if (ctx.session!.user.role !== "ADMIN" && existing.authorId !== ctx.session!.user.id) {
          throw new GraphQLError("FORBIDDEN", { extensions: { code: "FORBIDDEN" } });
        }
        return prisma.post.update({ where: { id: args.id }, data: args.input });
      },
    ),

    deletePost: requireRole(["ADMIN", "EDITOR"], async (_: unknown, args: { id: string }, ctx) => {
      const existing = await prisma.post.findUniqueOrThrow({ where: { id: args.id } });
      const isAdmin = ctx.session!.user.role === "ADMIN";
      const isOwnUnpublishedDraft =
        existing.authorId === ctx.session!.user.id && existing.status === "DRAFT";
      if (!isAdmin && !isOwnUnpublishedDraft) {
        throw new GraphQLError("FORBIDDEN", { extensions: { code: "FORBIDDEN" } });
      }
      await prisma.post.delete({ where: { id: args.id } });
      return true;
    }),
  },
};
