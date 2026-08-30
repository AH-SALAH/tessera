/// <reference types="vitest/globals" />
// T044 — generateDraftAssist resolver tests (FR-010, FR-011).
// Contract: the flag is checked BEFORE requireRole() even runs (T045) — feature-off means
// a distinct typed FEATURE_DISABLED rejection for anyone, not a generic auth error.
// When on: allowed for EDITOR/ADMIN, rejected unauthenticated.

vi.mock("@/lib/feature-flags", () => ({
  isEnabled: vi.fn(),
}));

vi.mock("@/lib/ai-draft-assist/client", () => ({
  generateDraftAssist: vi.fn(),
}));

import { isEnabled } from "@/lib/feature-flags";
import { generateDraftAssist } from "@/lib/ai-draft-assist/client";
import { aiResolvers } from "./ai";

const mockedIsEnabled = vi.mocked(isEnabled);
const mockedClient = vi.mocked(generateDraftAssist);

const ARGS = { bullets: ["fast", "bilingual"], locale: "EN" as const, tone: "curatorial" as const };

const ctxAs = (role: "ADMIN" | "EDITOR") => ({ session: { user: { id: "u1", role } } });
const ctxAnon = { session: null };

afterEach(() => {
  vi.clearAllMocks();
});

describe("generateDraftAssist", () => {
  it("rejects with typed FEATURE_DISABLED when flag is off — even unauthenticated", async () => {
    // Proves the flag is evaluated BEFORE requireRole(): an anonymous caller must see
    // FEATURE_DISABLED (the feature is absent), not UNAUTHENTICATED.
    mockedIsEnabled.mockResolvedValue(false);

    await expect(
      aiResolvers.Mutation.generateDraftAssist(null, ARGS, ctxAnon),
    ).rejects.toMatchObject({ extensions: { code: "FEATURE_DISABLED" } });
    expect(mockedClient).not.toHaveBeenCalled();
  });

  it("rejects with typed FEATURE_DISABLED when flag is off — even for ADMIN", async () => {
    mockedIsEnabled.mockResolvedValue(false);

    await expect(
      aiResolvers.Mutation.generateDraftAssist(null, ARGS, ctxAs("ADMIN")),
    ).rejects.toMatchObject({ extensions: { code: "FEATURE_DISABLED" } });
    expect(mockedClient).not.toHaveBeenCalled();
  });

  it("allows EDITOR when flag is on and calls the client module with tone", async () => {
    mockedIsEnabled.mockResolvedValue(true);
    mockedClient.mockResolvedValue({ available: true, description: "d", seoSummary: "s" });

    await expect(
      aiResolvers.Mutation.generateDraftAssist(null, ARGS, ctxAs("EDITOR")),
    ).resolves.toEqual({ available: true, description: "d", seoSummary: "s" });
    expect(mockedClient).toHaveBeenCalledWith(ARGS.bullets, ARGS.locale, ARGS.tone);
  });

  it("allows ADMIN when flag is on", async () => {
    mockedIsEnabled.mockResolvedValue(true);
    mockedClient.mockResolvedValue({ available: false, resetsAt: "2026-01-01T00:00:00Z" });

    await expect(
      aiResolvers.Mutation.generateDraftAssist(null, ARGS, ctxAs("ADMIN")),
    ).resolves.toMatchObject({ available: false });
  });

  it("rejects UNAUTHENTICATED when flag is on but no session exists", async () => {
    mockedIsEnabled.mockResolvedValue(true);

    await expect(
      aiResolvers.Mutation.generateDraftAssist(null, ARGS, ctxAnon),
    ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    expect(mockedClient).not.toHaveBeenCalled();
  });
});
