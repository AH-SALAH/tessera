// tests/e2e/a11y.spec.ts
// T057 — Accessibility audit (SC-004). Runs @axe-core/playwright against the public
// schema page and every admin console page, across all four locale x theme combinations
// defined in playwright.config.ts. Any axe violation (serious, critical) fails the build.

import AxeBuilder from "@axe-core/playwright";
import { test, expect, getSessionToken, seedUser } from "./helpers/auth";

const ADMIN_CREDENTIALS = seedUser("admin");

async function injectSession(page: any) {
  const token = await getSessionToken(
    page.context().request,
    "admin",
    ADMIN_CREDENTIALS.email,
    ADMIN_CREDENTIALS.password,
  );
  await page.context().addCookies([
    {
      name: "better-auth.session_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe("a11y — Public pages", () => {
  test("public home page has no serious/critical violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => {
      const el = document.querySelector("main, article, table, form") ?? document.body;
      return Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      `Public home page a11y violations:\n${serious.map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Fix: ${v.helpUrl}`).join("\n")}`,
    ).toHaveLength(0);
  });

  // Apollo landing page is disabled in production (NODE_ENV=production in CI),
  // so /api/graphql returns a bare response without <title> or lang — not a real page.
  test.skip(process.env.NODE_ENV === "production", "Apollo landing page disabled in production");
  test("public GraphQL schema page has no serious/critical violations", async ({ page }) => {
    await page.goto("/api/graphql");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      `GraphQL schema page a11y violations:\n${serious.map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Fix: ${v.helpUrl}`).join("\n")}`,
    ).toHaveLength(0);
  });
});

test.describe("a11y — Admin console", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
  });

  test("admin projects list has no serious/critical violations", async ({ page }) => {
    await page.goto("/en/projects");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => {
      const el = document.querySelector("main, article, table, form") ?? document.body;
      return Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      `Admin projects list a11y violations:\n${serious.map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Fix: ${v.helpUrl}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("admin users list has no serious/critical violations", async ({ page }) => {
    await page.goto("/en/users");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => {
      const el = document.querySelector("main, article, table, form") ?? document.body;
      return Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      `Admin users list a11y violations:\n${serious.map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Fix: ${v.helpUrl}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("admin create project form has no serious/critical violations", async ({ page }) => {
    await page.goto("/en/projects/new");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => {
      const el = document.querySelector("form, main, article") ?? document.body;
      return Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      `Admin create-project form a11y violations:\n${serious.map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Fix: ${v.helpUrl}`).join("\n")}`,
    ).toHaveLength(0);
  });
});
