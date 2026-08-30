// lib/auth/session.ts
// Single implementation of "derive the current session from the request" (Constitution
// Article V/VI) — every API route and GraphQL context builder calls this, never re-parses
// the session cookie independently.

import type { NextRequest } from "next/server";
import { auth } from "./config";
import type { Role } from "@prisma/client";

export interface ServerSession {
  user: { id: string; email: string; role: Role; theme: string };
}

export async function getServerSession(
  request: Request | NextRequest,
): Promise<ServerSession | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      role: (session.user as unknown as { role: Role }).role,
      theme: (session.user as unknown as { theme: string }).theme ?? "system",
    },
  };
}
