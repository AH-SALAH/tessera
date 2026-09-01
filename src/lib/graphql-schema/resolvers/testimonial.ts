// lib/graphql-schema/resolvers/testimonial.ts
import { requireRole, type GraphQLContext } from "../auth-guard";
import { prisma } from "@/lib/prisma";
import { GraphQLError } from "graphql";

export const testimonialResolvers = {
  Query: {
    testimonials: async (_: unknown, args: { status?: string }, ctx: GraphQLContext) => {
      if (!ctx.session) {
        return prisma.testimonial.findMany({ where: { status: "PUBLISHED" } });
      }
      if (ctx.session.user.role === "ADMIN") {
        return prisma.testimonial.findMany({
          where: args.status ? { status: args.status as any } : undefined,
        });
      }
      return prisma.testimonial.findMany({
        where: {
          status: "PUBLISHED",
          ...(args.status ? { status: args.status as any } : {}),
        },
      });
    },
    testimonial: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.session) {
        return prisma.testimonial.findFirst({ where: { id: args.id, status: "PUBLISHED" } });
      }
      return prisma.testimonial.findUnique({ where: { id: args.id } });
    },
  },

  Testimonial: {
    quote: (
      parent: { quoteEn: string | null; quoteAr: string | null },
      args: { locale: "EN" | "AR" },
    ) => (args.locale === "AR" ? (parent.quoteAr ?? parent.quoteEn ?? "") : (parent.quoteEn ?? "")),
  },

  Mutation: {
    createTestimonial: requireRole(
      ["ADMIN", "EDITOR"],
      async (_: unknown, args: { input: any }) => {
        return prisma.testimonial.create({
          data: { ...args.input, status: "DRAFT" },
        });
      },
    ),

    updateTestimonial: requireRole(
      ["ADMIN", "EDITOR"],
      async (_: unknown, args: { id: string; input: any }) => {
        return prisma.testimonial.update({ where: { id: args.id }, data: args.input });
      },
    ),

    deleteTestimonial: requireRole(
      ["ADMIN", "EDITOR"],
      async (_: unknown, args: { id: string }, ctx) => {
        const existing = await prisma.testimonial.findUniqueOrThrow({ where: { id: args.id } });
        const isAdmin = ctx.session!.user.role === "ADMIN";
        if (!isAdmin) {
          throw new GraphQLError("FORBIDDEN", { extensions: { code: "FORBIDDEN" } });
        }
        await prisma.testimonial.delete({ where: { id: args.id } });
        return true;
      },
    ),
  },
};
