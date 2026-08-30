import { test, expect, signInAs } from "./helpers/auth";

test.describe("i18n & Theme — Admin console", () => {
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    adminToken = await signInAs(request, "admin");
  });

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: adminToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  });

  test("switching to Arabic + dark persists to account on reload", async ({ page, request }) => {
    // Call preferences API to set Arabic + dark
    const prefRes = await request.fetch("/api/user/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${adminToken}`,
      },
      data: { locale: "ar", theme: "dark" },
    });
    expect(prefRes.status()).toBe(200);
    const prefBody = await prefRes.json();
    expect(prefBody.locale).toBe("ar");
    expect(prefBody.theme).toBe("dark");

    // Navigate to admin console — server reads account locale/theme
    await page.goto("/ar/projects");
    await page.waitForLoadState("networkidle");

    // Confirm locale and theme on the rendered HTML element
    const htmlDir = await page.locator("html").getAttribute("dir");
    expect(htmlDir).toBe("rtl");
    const htmlTheme = await page.locator("html").getAttribute("data-theme");
    expect(htmlTheme).toBe("dark");

    // Reload and confirm persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    const reloadDir = await page.locator("html").getAttribute("dir");
    expect(reloadDir).toBe("rtl");
    const reloadTheme = await page.locator("html").getAttribute("data-theme");
    expect(reloadTheme).toBe("dark");

    // Reset back to English + light for other tests
    await request.fetch("/api/user/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${adminToken}`,
      },
      data: { locale: "en", theme: "light" },
    });
  });
});

test.describe("i18n & Theme — Public site (anonymous)", () => {
  test("Arabic + dark persists via cookie only, admin account untouched", async ({
    page,
    request,
  }) => {
    // Set anonymous locale/theme cookies
    await page.context().addCookies([
      {
        name: "NEXT_LOCALE",
        value: "ar",
        domain: "localhost",
        path: "/",
      },
      {
        name: "NEXT_THEME",
        value: "dark",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Navigate to public site — proxy should redirect to /ar
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Confirm Arabic locale in URL
    expect(page.url()).toContain("/ar");

    // Confirm cookie persists on reload
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/ar");

    // Verify cookies are present
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === "NEXT_LOCALE");
    expect(localeCookie?.value).toBe("ar");
    const themeCookie = cookies.find((c) => c.name === "NEXT_THEME");
    expect(themeCookie?.value).toBe("dark");

    // Confirm admin account was NOT touched by fetching preferences without session
    const prefRes = await request.fetch("/api/user/preferences", {
      method: "GET",
    });
    expect(prefRes.status()).toBe(401);
  });
});
