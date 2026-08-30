// lib/graphql-schema/resolvers/user.ts
import { requireRole, type GraphQLContext } from "../auth-guard";
import { prisma } from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { sendInviteEmail } from "@/lib/auth/email";
import crypto from "crypto";

const INVITE_EXPIRY_DAYS = 7;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Serialize a Prisma Date (or already-ISO string) to ISO-8601. */
function toISO(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
}

export const userResolvers = {
  // Ensure every DateTime field is an ISO-8601 string.
  User: {
    createdAt: (parent: { createdAt: unknown }) => toISO(parent.createdAt),
  },
  Invitation: {
    createdAt: (parent: { createdAt: unknown }) => toISO(parent.createdAt),
    expiresAt: (parent: { expiresAt: unknown }) => toISO(parent.expiresAt),
    acceptedAt: (parent: { acceptedAt: unknown }) =>
      parent.acceptedAt != null ? toISO(parent.acceptedAt) : null,
  },

  Query: {
    users: requireRole(["ADMIN"], async () => {
      return prisma.user.findMany({
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
    }),

    pendingInvitations: requireRole(["ADMIN"], async () => {
      return prisma.invitation.findMany({
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          acceptedAt: true,
          createdAt: true,
        },
      });
    }),
  },

  Mutation: {
    inviteUser: requireRole(
      ["ADMIN"],
      async (_: unknown, args: { email: string; role: "ADMIN" | "EDITOR" }) => {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: args.email } });
        if (existingUser) {
          throw new GraphQLError("USER_EXISTS", { extensions: { code: "USER_EXISTS" } });
        }

        // Check if there's already a pending invitation
        const existingInvite = await prisma.invitation.findFirst({
          where: { email: args.email, acceptedAt: null, expiresAt: { gt: new Date() } },
        });
        if (existingInvite) {
          throw new GraphQLError("INVITE_EXISTS", { extensions: { code: "INVITE_EXISTS" } });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

        const invitation = await prisma.invitation.create({
          data: {
            email: args.email,
            token: generateToken(),
            role: args.role,
            expiresAt,
          },
          select: {
            id: true,
            email: true,
            role: true,
            expiresAt: true,
            acceptedAt: true,
            createdAt: true,
          },
        });

        // Send invite email (non-blocking — admin can resend if it fails)
        try {
          await sendInviteEmail({ email: args.email, token: invitation.id });
        } catch {
          // Email failure doesn't block the invitation creation
        }

        return invitation;
      },
    ),

    resendInvite: requireRole(["ADMIN"], async (_: unknown, args: { invitationId: string }) => {
      const invitation = await prisma.invitation.findUnique({ where: { id: args.invitationId } });
      if (!invitation) {
        throw new GraphQLError("INVITE_NOT_FOUND", { extensions: { code: "INVITE_NOT_FOUND" } });
      }
      if (invitation.acceptedAt) {
        throw new GraphQLError("INVITE_ALREADY_ACCEPTED", {
          extensions: { code: "INVITE_ALREADY_ACCEPTED" },
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

      const updated = await prisma.invitation.update({
        where: { id: args.invitationId },
        data: { token: generateToken(), expiresAt },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          acceptedAt: true,
          createdAt: true,
        },
      });

      try {
        await sendInviteEmail({ email: updated.email, token: updated.id });
      } catch {
        // Non-blocking
      }

      return updated;
    }),

    acceptInvite: async (_: unknown, args: { token: string; name: string; password: string }) => {
      const invitation = await prisma.invitation.findUnique({ where: { token: args.token } });
      if (!invitation) {
        throw new GraphQLError("INVITE_NOT_FOUND", { extensions: { code: "INVITE_NOT_FOUND" } });
      }
      if (invitation.acceptedAt) {
        throw new GraphQLError("INVITE_NOT_FOUND", { extensions: { code: "INVITE_NOT_FOUND" } });
      }
      if (new Date(invitation.expiresAt) < new Date()) {
        throw new GraphQLError("INVITE_EXPIRED", { extensions: { code: "INVITE_EXPIRED" } });
      }

      // Check no user with this email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
      if (existingUser) {
        throw new GraphQLError("USER_EXISTS", { extensions: { code: "USER_EXISTS" } });
      }

      // Create user via Better Auth signUp to hash password properly
      const { auth } = await import("@/lib/auth/config");
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: invitation.email,
          password: args.password,
          name: args.name,
        },
      });

      if (!signUpResult) {
        throw new GraphQLError("SIGNUP_FAILED", { extensions: { code: "SIGNUP_FAILED" } });
      }

      // Update user role (Better Auth defaults to EDITOR, invitation may specify ADMIN)
      const user = await prisma.user.findUnique({ where: { email: invitation.email } });
      if (user && user.role !== invitation.role) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: invitation.role },
        });
      }

      // Mark invitation as accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return true;
    },

    updateUserRole: requireRole(
      ["ADMIN"],
      async (_: unknown, args: { id: string; role: "ADMIN" | "EDITOR" }) => {
        const user = await prisma.user.findUnique({ where: { id: args.id } });
        if (!user) {
          throw new GraphQLError("USER_NOT_FOUND", { extensions: { code: "USER_NOT_FOUND" } });
        }
        return prisma.user.update({
          where: { id: args.id },
          data: { role: args.role },
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
      },
    ),

    deleteUser: requireRole(
      ["ADMIN"],
      async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
        if (!ctx.session) {
          throw new GraphQLError("UNAUTHENTICATED", { extensions: { code: "UNAUTHENTICATED" } });
        }
        if (ctx.session.user.id === args.id) {
          throw new GraphQLError("CANNOT_DELETE_SELF", {
            extensions: { code: "CANNOT_DELETE_SELF" },
          });
        }
        const user = await prisma.user.findUnique({ where: { id: args.id } });
        if (!user) {
          throw new GraphQLError("USER_NOT_FOUND", { extensions: { code: "USER_NOT_FOUND" } });
        }
        await prisma.user.delete({ where: { id: args.id } });
        return true;
      },
    ),
  },
};
