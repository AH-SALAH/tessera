/// <reference types="vitest/globals" />
// T040 — feature-flag module tests (FR-010, Constitution Article V/VII).
// isEnabled("AI_DRAFT_ASSIST") reads process.env.FEATURE_AI_DRAFT_ASSIST in development
// and the FeatureFlag Prisma table in production, from this ONE implementation.

vi.mock("@/lib/prisma", () => ({
  prisma: {
    featureFlag: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { isEnabled, getFlagRegistry } from "@/lib/feature-flags";

const mockedFindUnique = vi.mocked(prisma.featureFlag.findUnique);

afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env.FEATURE_AI_DRAFT_ASSIST;
  vi.clearAllMocks();
});

describe("isEnabled (development path)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  it("returns true when FEATURE_AI_DRAFT_ASSIST=true", async () => {
    process.env.FEATURE_AI_DRAFT_ASSIST = "true";
    await expect(isEnabled("AI_DRAFT_ASSIST")).resolves.toBe(true);
    // Env path must never touch the DB.
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("returns false when FEATURE_AI_DRAFT_ASSIST=false", async () => {
    process.env.FEATURE_AI_DRAFT_ASSIST = "false";
    await expect(isEnabled("AI_DRAFT_ASSIST")).resolves.toBe(false);
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("falls back to defaultDev (true per Clarification #1) when env var unset", async () => {
    delete process.env.FEATURE_AI_DRAFT_ASSIST;
    await expect(isEnabled("AI_DRAFT_ASSIST")).resolves.toBe(true);
  });
});

describe("isEnabled (production path)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  it("env var overrides DB in production", async () => {
    process.env.FEATURE_AI_DRAFT_ASSIST = "true";
    await expect(isEnabled("AI_DRAFT_ASSIST")).resolves.toBe(true);
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("env var false overrides DB in production", async () => {
    process.env.FEATURE_AI_DRAFT_ASSIST = "false";
    mockedFindUnique.mockResolvedValue({ enabled: true } as never);
    await expect(isEnabled("AI_DRAFT_ASSIST")).resolves.toBe(false);
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("reads the FeatureFlag table when env var unset", async () => {
    delete process.env.FEATURE_AI_DRAFT_ASSIST;
    mockedFindUnique.mockResolvedValue({ enabled: true } as never);
    await expect(isEnabled("AI_DRAFT_ASSIST")).resolves.toBe(true);
    expect(mockedFindUnique).toHaveBeenCalledWith({ where: { key: "AI_DRAFT_ASSIST" } });
  });

  it("returns the row's disabled state", async () => {
    delete process.env.FEATURE_AI_DRAFT_ASSIST;
    mockedFindUnique.mockResolvedValue({ enabled: false } as never);
    await expect(isEnabled("AI_DRAFT_ASSIST")).resolves.toBe(false);
  });

  it("falls back to defaultProd (false per Article VII) when no row exists", async () => {
    delete process.env.FEATURE_AI_DRAFT_ASSIST;
    mockedFindUnique.mockResolvedValue(null as never);
    await expect(isEnabled("AI_DRAFT_ASSIST")).resolves.toBe(false);
  });
});

describe("Constitution Article V — single source of truth", () => {
  it("no file outside lib/feature-flags.ts reads FEATURE_AI_DRAFT_ASSIST directly", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const roots = ["lib", "app", "components"].map((dir) => path.join(process.cwd(), dir));
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
          const content = fs.readFileSync(full, "utf8");
          if (content.includes("FEATURE_AI_DRAFT_ASSIST")) {
            offenders.push(path.relative(process.cwd(), full));
          }
        }
      }
    }

    roots.forEach((root) => fs.existsSync(root) && walk(root));

    const allowed = new Set([path.join("lib", "feature-flags.ts")]);
    expect(
      offenders.filter((f) => !allowed.has(f)),
      `FEATURE_AI_DRAFT_ASSIST must only be read by lib/feature-flags.ts, found in: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("registry documents graduation criteria for every flag (Article VII)", () => {
    const registry = getFlagRegistry();
    for (const [, config] of Object.entries(registry)) {
      expect(config.graduationCriteria.length).toBeGreaterThan(0);
    }
  });
});
