// lib/graphql-schema/auth-guard.ts
// The ONE implementation of resolver-level authorization (Constitution Article V/VI).
// Every mutation resolver wraps itself in requireRole() rather than re-implementing a
// session/role check inline — see tasks.md T019/T020.

import { GraphQLError } from "graphql";
import type { Role } from "@prisma/client";

export interface GraphQLContext {
  session: { user: { id: string; role: Role } } | null;
}

export function requireRole<TArgs, TResult>(
  roles: Role[],
  resolver: (parent: unknown, args: TArgs, ctx: GraphQLContext) => Promise<TResult>,
) {
  return async (parent: unknown, args: TArgs, ctx: GraphQLContext): Promise<TResult> => {
    if (!ctx.session) {
      throw new GraphQLError("UNAUTHENTICATED", { extensions: { code: "UNAUTHENTICATED" } });
    }
    if (!roles.includes(ctx.session.user.role)) {
      throw new GraphQLError("FORBIDDEN", { extensions: { code: "FORBIDDEN" } });
    }
    return resolver(parent, args, ctx);
  };
}
