/// <reference types="vitest/globals" />
// T042 — OpenRouter draft-assist client tests (FR-011, same mock pattern as PulseFeed).
// Asserts: prompt carries the requested locale and tone; any non-200/cap response maps to a
// typed { available: false } result instead of throwing.

import { generateDraftAssist } from "./client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function okResponse(text: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: text } }],
    }),
  };
}

describe("generateDraftAssist", () => {
  it("sends the locale instruction in the prompt for AR", async () => {
    fetchMock.mockResolvedValue(okResponse("وصف المشروع\nملخص SEO"));
    await generateDraftAssist(["fast", "GraphQL"], "AR");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.messages[0].content).toContain("Arabic");
    expect(init.headers.Authorization).toContain("Bearer");
  });

  it("sends the English instruction in the prompt for EN", async () => {
    fetchMock.mockResolvedValue(okResponse("A project description.\nAn SEO summary."));
    await generateDraftAssist(["fast", "GraphQL"], "EN");

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.messages[0].content).toContain("English");
    expect(body.messages[0].content).toContain("- fast");
    expect(body.messages[0].content).toContain("- GraphQL");
  });

  it("includes tone instruction in the prompt (default: curatorial)", async () => {
    fetchMock.mockResolvedValue(okResponse("Description.\nSEO."));
    await generateDraftAssist(["test"], "EN");

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.messages[0].content).toContain("museum curator");
  });

  it("includes academic tone instruction when tone is academic", async () => {
    fetchMock.mockResolvedValue(okResponse("Description.\nSEO."));
    await generateDraftAssist(["test"], "EN", "academic");

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.messages[0].content).toContain("formal academic");
  });

  it("includes exhibition tone instruction when tone is exhibition", async () => {
    fetchMock.mockResolvedValue(okResponse("Description.\nSEO."));
    await generateDraftAssist(["test"], "EN", "exhibition");

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.messages[0].content).toContain("general museum-going audience");
  });

  it("maps a non-200 response to a typed unavailable result, no throw", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });
    const result = await generateDraftAssist(["b"], "EN");

    expect(result.available).toBe(false);
    expect(result.description).toBeUndefined();
    expect(result.resetsAt).toBeTruthy();
  });

  it("maps a rate-limit/cap response (402) the same way", async () => {
    // OpenRouter signals free-tier exhaustion with 402 Payment Required.
    fetchMock.mockResolvedValue({ ok: false, status: 402 });
    const result = await generateDraftAssist(["b"], "AR");

    expect(result.available).toBe(false);
    expect(result.resetsAt).toBeTruthy();
  });

  it("maps a network failure to a typed unavailable result, no throw", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await generateDraftAssist(["b"], "EN");

    expect(result.available).toBe(false);
    expect(result.resetsAt).toBeTruthy();
  });

  it("parses description and seoSummary from a successful completion", async () => {
    fetchMock.mockResolvedValue(
      okResponse("First sentence. Second sentence.\nSEO one-liner here."),
    );
    const result = await generateDraftAssist(["bullets"], "EN");

    expect(result.available).toBe(true);
    expect(result.description).toContain("First sentence");
    expect(result.seoSummary).toBe("SEO one-liner here.");
  });
});
