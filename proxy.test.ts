/// <reference types="vitest/globals" />
import { proxy } from "./proxy";
import { NextRequest } from "next/server";

function makeRequest(
  url: string,
  opts?: { cookies?: Record<string, string>; headers?: Record<string, string> },
): NextRequest {
  const req = new NextRequest(new URL(url, "http://localhost:3000"), {
    headers: opts?.headers,
  });
  if (opts?.cookies) {
    for (const [name, value] of Object.entries(opts.cookies)) {
      req.cookies.set(name, value);
    }
  }
  return req;
}

describe("proxy — locale detection", () => {
  it("uses NEXT_LOCALE cookie when valid", () => {
    const res = proxy(makeRequest("http://localhost:3000/", { cookies: { NEXT_LOCALE: "ar" } }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/ar");
  });

  it("falls back to Accept-Language when cookie invalid", () => {
    const res = proxy(
      makeRequest("http://localhost:3000/", {
        cookies: { NEXT_LOCALE: "fr" },
        headers: { "accept-language": "ar-SA,ar;q=0.9" },
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/ar");
  });

  it("defaults to en when no cookie and Accept-Language not Arabic", () => {
    const res = proxy(makeRequest("http://localhost:3000/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/en");
  });

  it("does not redirect locale-prefixed paths", () => {
    const res = proxy(makeRequest("http://localhost:3000/en/projects"));
    expect(res.status).toBe(200);
  });

  it("skips API routes", () => {
    const res = proxy(makeRequest("http://localhost:3000/api/graphql"));
    expect(res.status).toBe(200);
  });

  it("skips _next routes", () => {
    const res = proxy(makeRequest("http://localhost:3000/_next/static/chunk.js"));
    expect(res.status).toBe(200);
  });
});

describe("proxy — admin route guard", () => {
  it("redirects to sign-in when no session on admin route", () => {
    const res = proxy(makeRequest("http://localhost:3000/en/admin/projects"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/sign-in");
  });

  it("passes through when session exists on admin route", () => {
    const res = proxy(
      makeRequest("http://localhost:3000/en/admin/projects", {
        cookies: { "better-auth.session_token": "tok_abc123" },
      }),
    );
    expect(res.status).toBe(200);
  });

  it("redirects regardless of locale prefix on admin route", () => {
    const res = proxy(makeRequest("http://localhost:3000/ar/admin/posts"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/sign-in");
  });

  it("uses resolved locale in sign-in redirect", () => {
    const res = proxy(
      makeRequest("http://localhost:3000/en/admin/posts", {
        cookies: { NEXT_LOCALE: "ar" },
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/ar/sign-in");
  });
});

describe("proxy — authenticated user on sign-in page", () => {
  it("redirects to dashboard when session exists on English sign-in page", () => {
    const res = proxy(
      makeRequest("http://localhost:3000/en/sign-in", {
        cookies: { "better-auth.session_token": "tok_abc123" },
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/en/dashboard");
  });

  it("redirects to Arabic dashboard when session exists on Arabic sign-in page", () => {
    const res = proxy(
      makeRequest("http://localhost:3000/ar/sign-in", {
        cookies: { "better-auth.session_token": "tok_abc123" },
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/ar/dashboard");
  });

  it("does not redirect sign-in page when no session", () => {
    const res = proxy(makeRequest("http://localhost:3000/en/sign-in"));
    expect(res.status).toBe(200);
  });

  it("does not redirect sign-in with trailing slash", () => {
    const res = proxy(
      makeRequest("http://localhost:3000/en/sign-in/", {
        cookies: { "better-auth.session_token": "tok_abc123" },
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/en/dashboard");
  });
});
