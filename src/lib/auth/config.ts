// lib/auth/config.ts
// Single Better Auth instance (Constitution Article V). Prisma adapter, email/password +
// GitHub OAuth (developer/collaborator audience — no public self-signup exists at all, see
// FR-009; new accounts are created only via the Admin-only inviteUser mutation).

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail, sendVerificationEmail } from "./email";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      await sendResetPasswordEmail({ user, url, token });
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      await sendVerificationEmail({ user, url, token });
    },
    sendOnSignUp: false, // Not needed — accounts created via inviteUser mutation
    autoSignInAfterVerification: false,
    expiresIn: 3600, // 1 hour
  },
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        socialProviders: {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        },
      }
    : {}),
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "EDITOR" },
      locale: { type: "string", defaultValue: "en" },
      theme: { type: "string", defaultValue: "system" },
    },
  },
  // No signUp hook enabling self-serve registration is wired here on purpose — accounts are
  // created exclusively via the inviteUser GraphQL mutation (Admin-only), per FR-009.
});
