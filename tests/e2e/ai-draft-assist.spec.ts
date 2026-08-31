import { test, expect, signInAs, waitForHydration } from "./helpers/auth";

// T047 — AI Draft Assist e2e (FR-010, FR-011).
// The flag's value comes from the SERVER environment the app under test was started with:
//   flag-on run:  FEATURE_AI_DRAFT_ASSIST=true  npm run test:e2e -- ai-draft-assist
//   flag-off run: FEATURE_AI_DRAFT_ASSIST=false npm run test:e2e -- ai-draft-assist
// (dev default is on per Clarification #1). The generation HTTP round-trip to OpenRouter is
// mocked at the GraphQL layer so the spec verifies the UI contract — generated draft lands in
// the form and stays editable BEFORE save — deterministically, without a real provider call.

const FLAG_ON = process.env.FEATURE_AI_DRAFT_ASSIST !== "false";

const MOCK_DESCRIPTION = "AI-assisted description written for review.";
const MOCK_SEO = "AI-assisted SEO one-liner.";
const MOCK_BULLETS = "- Fast GraphQL API\n- Bilingual support";

/** Intercept the streaming SSE endpoint; everything else passes through. */
async function mockStreamDraft(page: any) {
  await page.route("**/api/ai/stream-draft", async (route: any) => {
    // Simulate SSE streaming: send tokens one by one
    const chunks = MOCK_DESCRIPTION.split(/(?<=\s)/); // split on word boundaries
    let sseBody = "";
    for (const chunk of chunks) {
      sseBody += `data: ${JSON.stringify({ text: chunk })}\n\n`;
    }
    // Append SEO with the marker the parser expects
    sseBody += `data: ${JSON.stringify({ text: "\n\nSEO: " + MOCK_SEO })}\n\n`;
    sseBody += "data: [DONE]\n\n";

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: sseBody,
    });
  });
}

test.describe("AI Draft Assist (flag on)", () => {
  test.skip(!FLAG_ON, "run with FEATURE_AI_DRAFT_ASSIST=true (dev default)");

  let editorToken = "";

  test.beforeAll(async ({ request }) => {
    editorToken = await signInAs(request, "editor1");
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
    await mockStreamDraft(page);
  });

  test("generated draft lands in the form and is editable before save", async ({ page }) => {
    await page.goto("/en/projects/new");
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    const generateButton = page.locator('button:has-text("Generate draft with AI")');
    await expect(generateButton).toBeVisible();

    // Clicking opens the AI Draft Assist modal
    await generateButton.click();

    // Modal should appear
    const modal = page.locator(".ant-modal");
    await expect(modal).toBeVisible();

    // Enter bullet points in the left sidebar textarea
    const bulletsTextArea = modal.locator("textarea").first();
    await expect(bulletsTextArea).toBeVisible();
    await bulletsTextArea.fill(MOCK_BULLETS);

    // Click Generate draft with AI button
    const generateDraftButton = modal.locator('button:has-text("Generate draft with AI")');
    await expect(generateDraftButton).toBeVisible();
    await generateDraftButton.click();

    // Wait for streaming to finish — the output textarea appears after streaming completes.
    const enTextArea = modal.locator('textarea[name="ai-description"]');
    await expect(enTextArea).toBeVisible({ timeout: 15000 });
    await expect(enTextArea).toContainText(MOCK_DESCRIPTION, { timeout: 10000 });

    // Human-in-the-loop guarantee (FR-011): the AI text must be editable in the modal
    await enTextArea.fill(`${MOCK_DESCRIPTION} — human edit.`);
    await expect(enTextArea).toHaveValue(`${MOCK_DESCRIPTION} — human edit.`);

    // Apply to form
    const applyButton = modal.locator('button:has-text("Apply to Field")');
    await applyButton.click();

    // Modal should close and form fields should be populated
    await expect(modal).not.toBeVisible();
    const descriptionBox = page.locator('textarea[name="descriptionEn"]');
    await expect(descriptionBox).toHaveValue(`${MOCK_DESCRIPTION} — human edit.`);
  });
});

test.describe("AI Draft Assist (flag off)", () => {
  test.skip(FLAG_ON, "run with FEATURE_AI_DRAFT_ASSIST=false");

  let editorToken = "";

  test.beforeAll(async ({ request }) => {
    editorToken = await signInAs(request, "editor1");
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

  // FR-010: when off, the control is fully ABSENT — not disabled.
  test("draft-assist control does not render at all", async ({ page }) => {
    await page.goto("/en/projects/new");
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    await expect(page.locator('button:has-text("Generate draft with AI")')).toHaveCount(0);
    // Rest of the form still usable.
    await expect(page.locator('input[name="slug"]')).toBeVisible();
  });
});
