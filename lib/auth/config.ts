// lib/auth/config.ts
// Single Better Auth instance (Constitution Article V). Prisma adapter, email/password +
// GitHub OAuth (developer/collaborator audience — no public self-signup exists at all, see
// FR-009; new accounts are created only via the Admin-only inviteUser mutation).

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail, sendVerificationEmail } from "./email";

const BETTER_AUTH_SECRET_DEFAULT = "better-auth-secret-12345678901234567890";
const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  console.error("[auth] ⚠ BETTER_AUTH_SECRET is not set — Better Auth will reject sign-in requests.");
} else if (secret === BETTER_AUTH_SECRET_DEFAULT) {
  console.error(
    "[auth] ⚠ BETTER_AUTH_SECRET equals the built-in default — " +
      "Better Auth will reject sign-in requests. Set a unique random value in GitHub Actions secrets.",
  );
} else {
  console.log(`[auth] BETTER_AUTH_SECRET loaded (${secret.length} chars)`);
}

export const auth = betterAuth({
  secret: secret ?? "",
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
