// prisma/seed.ts
// FR-009: there is no public self-signup path, so the very first Admin account must be
// seeded directly. Every subsequent account is created via the inviteUser mutation.
//
// After `prisma db push --force-reset`, Account rows are wiped but User rows may persist.
// This script handles that: deletes users without Account rows and re-seeds them with passwords.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../lib/auth/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "admin123";

async function main() {
  const accounts = [
    { email: "admin@tessera.local", name: "Tessera Admin", role: "ADMIN" as const },
    { email: "editor@test.com", name: "Tessera Editor 1", role: "EDITOR" as const },
    { email: "editor2@test.com", name: "Tessera Editor 2", role: "EDITOR" as const },
  ];

  for (const account of accounts) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
      include: { accounts: true },
    });

    if (existing && existing.accounts.length > 0) {
      console.log(`✓ ${account.email} — already has password account`);
      continue;
    }

    if (existing && existing.accounts.length === 0) {
      // User exists but has no Account row (e.g. after force-reset).
      // Delete the user so signUpEmail can recreate both User + Account.
      console.log(`⟳ ${account.email} — user exists but no password, re-seeding...`);
      await prisma.user.delete({ where: { id: existing.id } });
    }

    // signUpEmail creates both User row and Account row (with hashed password)
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: account.email,
          password: SEED_PASSWORD,
          name: account.name,
        },
      });

      // Set role to ADMIN if needed (signUpEmail defaults to EDITOR)
      if (account.role === "ADMIN" && result?.user?.id) {
        await prisma.user.update({
          where: { id: result.user.id },
          data: { role: "ADMIN" },
        });
      }

      console.log(`✓ Seeded ${account.role}: ${account.email} (password: ${SEED_PASSWORD})`);
    } catch (e: any) {
      console.error(`✗ Failed to seed ${account.email}:`, e.message ?? e);
    }
  }

  // Clean up stale test users (from e2e tests) that have no Account rows
  const orphanUsers = await prisma.user.findMany({
    where: {
      email: { contains: "delete-test" },
    },
    include: { accounts: true },
  });
  for (const orphan of orphanUsers) {
    if (orphan.accounts.length === 0) {
      await prisma.user.delete({ where: { id: orphan.id } });
      console.log(`🗑 Cleaned up orphan: ${orphan.email}`);
    }
  }

  console.log("\n── Login credentials ──");
  console.log(`Admin:    admin@tessera.local / ${SEED_PASSWORD}`);
  console.log(`Editor 1: editor@test.com / ${SEED_PASSWORD}`);
  console.log(`Editor 2: editor2@test.com / ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
