import { test, expect, signInAs, waitForHydration } from "./helpers/auth";

test.describe("Admin Flow", () => {
  let adminToken = "";
  let editorToken = "";

  test.beforeAll(async ({ request }) => {
    adminToken = await signInAs(request, "admin");
    editorToken = await signInAs(request, "editor1");
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

  test("admin can publish editor's draft", async ({ page, request }) => {
    const uniqueTitle = `Editor Draft for Admin ${Date.now()}`;
    const uniqueSlug = `editor-draft-for-admin-${Date.now()}`;

    // Editor creates a draft via API
    const createResponse = await request.post("/api/graphql", {
      headers: { Cookie: `better-auth.session_token=${editorToken}` },
      data: {
        query: `mutation { createProject(input: { slug: "${uniqueSlug}", titleEn: "${uniqueTitle}", descriptionEn: "Test project description" }) { id } }`,
      },
    });
    const createBody = await createResponse.json();
    if (createBody.errors) console.error("Editor create error:", JSON.stringify(createBody.errors));
    const editorProjectId = createBody.data?.createProject?.id;
    expect(editorProjectId).toBeDefined();

    // Admin list only shows the admin's own projects (authorId filter),
    // so navigate straight to the editor's project edit page by id.
    await page.goto(`/en/projects/${editorProjectId}`);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);
    await expect(page.locator("h1")).toContainText("Edit Project");

    // Publish button is enabled for admins.
    const publishButton = page.locator('button:has-text("Publish Changes")').last();
    await expect(publishButton).toBeEnabled();
    await publishButton.click();

    // Verify via public API that the project is now PUBLISHED.
    let published: any;
    for (let i = 0; i < 10 && !published; i++) {
      await page.waitForTimeout(500);
      const publicResponse = await request.post("/api/graphql", {
        data: { query: `query { projects { id status title { value } } }` },
      });
      const publicBody = await publicResponse.json();
      if (!publicBody.data?.projects) continue;
      published = publicBody.data.projects.find((p: any) => p.title.value === uniqueTitle);
    }
    expect(published).toBeDefined();
    expect(published.status).toBe("PUBLISHED");
  });

  test("admin can invite a new user with a role", async ({ page, request }) => {
    await page.goto("/en/users");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Users");
    await waitForHydration(page);

    // Open invite modal
    await page.locator('button:has-text("+ Add new")').click();
    const dialog = page.locator(".ant-modal:has-text('Invite User')");
    await expect(dialog).toBeVisible();

    const newUserEmail = `test-admin-invite-${Date.now()}@example.com`;
    await dialog
      .locator('input[id="email"], input[placeholder*="example"]')
      .first()
      .fill(newUserEmail);

    // antd Select renders its dropdown in a body-level portal, so look for
    // the options outside the modal subtree.
    await dialog.locator(".ant-select").click();
    await page
      .locator(
        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item[title="EDITOR"]',
      )
      .click();

    await dialog.locator("button.ant-btn-primary").click();
    await expect(page.locator("text=Invitation sent")).toBeVisible({ timeout: 10000 });

    // Verify via GraphQL pendingInvitations query (inviteUser creates an Invitation, not a User)
    const inviteResponse = await request.post("/api/graphql", {
      headers: { Cookie: `better-auth.session_token=${adminToken}` },
      data: { query: `query { pendingInvitations { email role } }` },
    });
    const inviteBody = await inviteResponse.json();
    const newInvite = inviteBody.data?.pendingInvitations?.find((u: any) => u.email === newUserEmail);
    expect(newInvite).toBeDefined();
    expect(newInvite.role).toBe("EDITOR");
  });

  test("admin can delete a published project", async ({ page, request }) => {
    const uniqueTitle = `Admin Delete Test ${Date.now()}`;
    const uniqueSlug = `admin-delete-test-${Date.now()}`;

    // Admin creates and publishes its own project via API
    const createResponse = await request.post("/api/graphql", {
      headers: { Cookie: `better-auth.session_token=${adminToken}` },
      data: {
        query: `mutation { createProject(input: { slug: "${uniqueSlug}", titleEn: "${uniqueTitle}", descriptionEn: "Test project description" }) { id } }`,
      },
    });
    const createBody = await createResponse.json();
    if (createBody.errors) console.error("Admin create error:", JSON.stringify(createBody.errors));
    const projectId = createBody.data?.createProject?.id;
    expect(projectId).toBeDefined();

    const publishResponse = await request.post("/api/graphql", {
      headers: { Cookie: `better-auth.session_token=${adminToken}` },
      data: { query: `mutation { publishProject(id: "${projectId}") { id status } }` },
    });
    const publishBody = await publishResponse.json();
    if (publishBody.errors) console.error("Admin publish error:", JSON.stringify(publishBody.errors));
    expect(publishBody.data?.publishProject?.status).toBe("PUBLISHED");

    // Delete it through the UI (admin sees own projects in list)
    await page.goto("/en/projects");
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);
    const card = page.locator("article", { hasText: uniqueTitle });
    await expect(card).toBeVisible({ timeout: 10000 });
    
    // 1. Fallback Rule: Catch native window.confirm boxes if it's not a true HTML modal
    page.once('dialog', async dialog => {
      console.log(`Intercepted Native Dialog: [${dialog.type()}] "${dialog.message()}"`);
      await dialog.accept(); // Simulates clicking "OK"
    });
    await page.screenshot({ path: 'debug-before-click.png' });
    // 2. Perform the click action
    const deleteButton = card.locator('button[aria-label^="Delete"]').first();
    await deleteButton.click();

    try {
      // const modal = page.locator('.ant-modal, .ant-modal-content, .ant-modal-root').first();
      const modal = page.getByRole('dialog').first();
      // Wait for attached state first to avoid animation race conditions
      await modal.waitFor({ state: 'attached', timeout: 5000 });
      const confirmButton = modal.locator('button').filter({ hasText: /Delete|OK|Yes|Confirm/i }).last();
      await expect(confirmButton).toBeVisible({ timeout: 10000 });
      await confirmButton.click();
      await modal.waitFor({ state: 'hidden', timeout: 5000 });
    } catch (error) {
      console.error('Modal failed to appear by role. Dumping page body for inspection:');
      throw error; // Re-throw the original error to fail the test properly
    }

    // Published projects are public — verify it is gone from the public query.
    const verifyResponse = await request.post("/api/graphql", {
      data: { query: `query { projects { id title { value } } }` },
    });
    const verifyBody = await verifyResponse.json();
    const deletedProject = verifyBody.data.projects.find((p: any) => p.title.value === uniqueTitle);
    expect(deletedProject).toBeUndefined();
  });

  test("admin can see all users and their roles", async ({ page }) => {
    await page.goto("/en/users");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Users");
    await waitForHydration(page);

    await expect(page.locator("text=ADMIN").first()).toBeVisible();
    await expect(page.locator("text=EDITOR").first()).toBeVisible();
  });
});
