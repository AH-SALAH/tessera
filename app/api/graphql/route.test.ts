/// <reference types="vitest/globals" />

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/auth/email", () => ({
  sendResetPasswordEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
  sendInviteEmail: vi.fn(),
}));

vi.mock("@/lib/site-url", () => ({
  getSiteUrl: vi.fn().mockReturnValue("http://localhost:3000"),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "./route";

describe("GraphQL Route", () => {
  const createRequest = (body: object, ip = "127.0.0.1") => {
    const request = new NextRequest(new URL("http://localhost:3000/api/graphql"), {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
      },
    });
    return request;
  };

  it("introspection query succeeds unauthenticated", async () => {
    const request = createRequest({
      query: `
        query IntrospectionQuery {
          __schema {
            types {
              name
            }
          }
        }
      `,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.__schema.types).toBeDefined();
    expect(Array.isArray(body.data.__schema.types)).toBe(true);
  });

  it("public projects query works unauthenticated", async () => {
    const request = createRequest({
      query: `
        query {
          projects {
            id
            status
          }
        }
      `,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.projects).toBeDefined();
  });

  it("rate limits requests from same IP", async () => {
    const ip = "192.168.1.100";
    const query = `
      query {
        projects {
          id
        }
      }
    `;

    // Default limit is 20 req/min - make 21 requests
    for (let i = 0; i < 21; i++) {
      const request = createRequest({ query }, ip);
      const response = await POST(request);
      if (i < 20) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
      }
    }
  }, 30000);
});
