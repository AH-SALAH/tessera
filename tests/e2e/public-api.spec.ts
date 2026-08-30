import { test, expect } from "@playwright/test";

test.describe("Public API", () => {
  test("introspection query succeeds", async ({ request }) => {
    const response = await request.post("/api/graphql", {
      headers: { "Content-Type": "application/json" },
      data: {
        query: `
          query IntrospectionQuery {
            __schema {
              types {
                name
              }
            }
          }
        `,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.__schema.types).toBeDefined();
  });

  test("public projects query returns only PUBLISHED", async ({ request }) => {
    const response = await request.post("/api/graphql", {
      headers: { "Content-Type": "application/json" },
      data: {
        query: `
          query {
            projects {
              id
              status
            }
          }
        `,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.projects).toBeDefined();
    // Public endpoint returns only PUBLISHED (status arg ignored for unauthenticated callers)
    body.data.projects.forEach((p: any) => {
      expect(p.status).toBe("PUBLISHED");
    });
  });
});
