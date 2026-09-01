// lib/feature-flags.ts
// SINGLE SOURCE OF TRUTH for feature flags (Constitution Article V, Article VII).
// No other file in this codebase should read process.env.FEATURE_* directly, and no other
// file should query the FeatureFlag table directly — always go through isEnabled().

import { prisma } from "@/lib/prisma";

export type FeatureFlagKey = "AI_DRAFT_ASSIST";

// Registry documents each flag's purpose, default-per-environment, and removal criteria —
// per Article VII, a flag is not "set and forget," it has a stated graduation condition.
const FLAG_REGISTRY: Record<
  FeatureFlagKey,
  { envVar: string; defaultDev: boolean; defaultProd: boolean; graduationCriteria: string }
> = {
  AI_DRAFT_ASSIST: {
    envVar: "FEATURE_AI_DRAFT_ASSIST",
    defaultDev: true,
    defaultProd: false,
    graduationCriteria:
      "Enable in production once OpenRouter free-tier cost/latency has been observed under " +
      "real authoring usage for at least one week. Remove the flag entirely (make it " +
      "always-on) once it has run enabled in production for 30 days with no rollback.",
  },
};

export async function isEnabled(key: FeatureFlagKey): Promise<boolean> {
  const config = FLAG_REGISTRY[key];

  // Env var always takes precedence (allows CI/ops override without DB changes).
  const envValue = process.env[config.envVar];
  if (envValue !== undefined) return envValue === "true";

  if (process.env.NODE_ENV !== "production") {
    return config.defaultDev;
  }

  // Production: DB-backed so ops can toggle without a redeploy.
  const row = await prisma.featureFlag.findUnique({ where: { key } });
  return row?.enabled ?? config.defaultProd;
}

export function getFlagRegistry() {
  return FLAG_REGISTRY;
}
