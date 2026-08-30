import { test, expect } from "@playwright/test";

test.describe("Public API", () => {
  test("introspection query succeeds", async ({ request }) => {
    const response = await request.post("/api/graphql", {
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
      data: {
        query: `
          query {
            projects(status: DRAFT) {
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
    // All returned projects should have status PUBLISHED
    body.data.projects.forEach((p: any) => {
      expect(p.status).toBe("PUBLISHED");
    });
  });
});
