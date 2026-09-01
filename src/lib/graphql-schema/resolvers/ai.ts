// lib/graphql-schema/resolvers/ai.ts
import { GraphQLError } from "graphql";
import { requireRole, type GraphQLContext } from "../auth-guard";
import { isEnabled } from "@/lib/feature-flags";
import { generateDraftAssist, type DraftTone } from "@/lib/ai-draft-assist/client";

export const aiResolvers = {
  Mutation: {
    // Flag is checked BEFORE requireRole() runs (T045) — feature-off means the feature is
    // absent for everyone (FR-010), so every caller gets the typed FEATURE_DISABLED
    // rejection rather than an auth error; requireRole() only gates the enabled path.
    async generateDraftAssist(
      _: unknown,
      args: { bullets: string[]; locale: "EN" | "AR"; tone?: DraftTone },
      ctx: GraphQLContext,
    ) {
      const enabled = await isEnabled("AI_DRAFT_ASSIST");
      if (!enabled) {
        throw new GraphQLError("FEATURE_DISABLED", {
          extensions: { code: "FEATURE_DISABLED" },
        });
      }
      const tone = args.tone as DraftTone | undefined;
      return requireRole(["ADMIN", "EDITOR"], () =>
        generateDraftAssist(args.bullets, args.locale, tone),
      )(_, args, ctx);
    },
  },
};
