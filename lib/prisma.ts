// lib/prisma.ts
// Single Prisma Client instance (Constitution Article V) — every module imports from here,
// never instantiates its own `new PrismaClient()`. Standard Next.js dev-hot-reload guard
// prevents exhausting Neon's free-tier connection limit across fast-refresh cycles.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  adapter?: PrismaPg;
};

const adapter =
  globalForPrisma.adapter ?? new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.adapter = adapter;
}
