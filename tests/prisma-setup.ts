import fs from "fs";
import path from "path";

// Vitest does not reliably surface Next.js env files inside fork workers
// (@next/env works under tsx but not here) — parse .env.local directly.
const envLocal = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*"?"?([^"\n]*)"?"?\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prismaInstance = new PrismaClient({ adapter });

declare global {
  var prisma: typeof prismaInstance | undefined;
}
globalThis.prisma = prismaInstance;

export { prismaInstance as prisma };
