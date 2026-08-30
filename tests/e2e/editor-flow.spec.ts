import { test, expect, signInAs, waitForHydration } from "./helpers/auth";

function editorEmail(n: 1 | 2) {
  return n === 1 ? "editor@test.com" : "editor2@test.com";
}
const EDITOR_PASSWORD = "testpassword123";

test.describe("Editor Flow", () => {
  let editorToken = "";
  let editor2Token = "";

  test.beforeAll(async ({ request }) => {
    editorToken = await signInAs(request, "editor1");
    editor2Token = await signInAs(request, "editor2");
  });

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: editorToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  });

  /** Navigate, wait for client hydration, fill + submit the create form. */
  async function createDraft(page: any, slug: string, titleEn: string) {
    await page.goto("/en/projects/new");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Create Project");
    // Submit only prevents native submission once React handlers are attached.
    await waitForHydration(page);
    await page.fill('input[name="slug"]', slug);
    await page.fill('input[name="titleEn"]', titleEn);
    await page.fill('textarea[name="descriptionEn"]', `Description for ${titleEn}`);
    // Submit button only prevents native submission once React has hydrated.
    // There are two submit buttons (mobile + desktop); pick the first visible one.
    const submit = page.locator('button[type="submit"]:visible').first();
    await expect(submit).toBeEnabled();
    await Promise.all([
      page.waitForURL(/\/en\/projects\/(?!new)[A-Za-z0-9]+$/, { timeout: 15000 }),
      submit.click(),
    ]);
  }

  test("editor can create a draft project", async ({ page }) => {
    const uniqueSlug = `editor-test-${Date.now()}`;
    const uniqueTitle = `Editor Test Project ${Date.now()}`;
    await createDraft(page, uniqueSlug, uniqueTitle);

    await page.goto("/en/projects");
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("DRAFT").first()).toBeVisible();
  });

  test("editor cannot publish their own draft", async ({ page }) => {
    const uniqueSlug = `editor-no-publish-${Date.now()}`;
    await createDraft(page, uniqueSlug, "No Publish Test");

    const publishButton = page.locator('button:has-text("Publish")').first();
    await expect(publishButton).toBeDisabled();
    await publishButton.hover();
    await expect(page.locator('[role="tooltip"]')).toContainText("Only an Admin can publish");
  });

  test("editor cannot delete another editor's draft", async ({ page, request }) => {
    const uniqueSlug = `editor2-project-${Date.now()}`;
    const createResponse = await request.post("/api/graphql", {
      headers: { Cookie: `better-auth.session_token=${editor2Token}` },
      data: {
        query: `mutation { createProject(input: { slug: "${uniqueSlug}", titleEn: "Editor2 Project", descriptionEn: "Test description" }) { id } }`,
      },
    });
    const createBody = await createResponse.json();
    const otherProjectId = createBody.data?.createProject?.id;
    expect(otherProjectId).toBeDefined();

    const deleteResponse = await request.post("/api/graphql", {
      headers: { Cookie: `better-auth.session_token=${editorToken}` },
      data: { query: `mutation { deleteProject(id: "${otherProjectId}") }` },
    });
    const deleteBody = await deleteResponse.json();
    expect(deleteBody.errors).toBeDefined();
    expect(deleteBody.errors[0].extensions.code).toBe("FORBIDDEN");
  });

  test("editor's draft is absent from public query", async ({ page, request }) => {
    const uniqueSlug = `editor-draft-${Date.now()}`;
    const uniqueTitle = `Draft Not Public ${Date.now()}`;
    await createDraft(page, uniqueSlug, uniqueTitle);

    const publicResponse = await request.post("/api/graphql", {
      data: {
        query: `query { projects { id status title { value } } }`,
      },
    });
    const publicBody = await publicResponse.json();
    if (!publicBody.data?.projects) {
      console.error("public query failed:", JSON.stringify(publicBody));
    }
    expect(publicBody.data?.projects).toBeDefined();
    const draftProject = publicBody.data.projects.find((p: any) => p.title.value === uniqueTitle);
    expect(draftProject).toBeUndefined();
  });

  test("editor can delete their own unpublished draft", async ({ page }) => {
    const uniqueSlug = `editor-delete-${Date.now()}`;
    const uniqueTitle = `Delete Own Draft ${Date.now()}`;
    await createDraft(page, uniqueSlug, uniqueTitle);

    await page.goto("/en/projects");
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);
    const card = page.locator("article", { hasText: uniqueTitle });
    await expect(card).toBeVisible({ timeout: 10000 });
    // Scope to this card's own Delete — other rows belong to other authors.
    await card.locator('button[aria-label*="Delete"]').first().click();
    await expect(card).not.toBeVisible({ timeout: 5000 });
  });
});
