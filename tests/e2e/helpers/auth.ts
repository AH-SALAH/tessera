import { test as base, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const AUTH_DIR = path.join(process.cwd(), ".auth");

// Filesystem-backed session-token cache: survives worker-process restarts,
// keeps total sign-ins per run at one per user (avoids rate limiting).
export async function getSessionToken(
  request: any,
  user: string,
  email: string,
  password: string,
): Promise<string> {
  const file = path.join(AUTH_DIR, `${user}.token`);
  try {
    const cached = fs.readFileSync(file, "utf8").trim();
    if (cached) return cached;
  } catch {
    // no cached token yet
  }
  const response = await request.post("/api/auth/sign-in/email", {
    data: { email, password },
    // Better Auth returns 403 MISSING_OR_NULL_ORIGIN when a request carries
    // session cookies without an Origin header — declare it explicitly.
    headers: { Origin: "http://localhost:3000" },
  });
  expect(response.status(), `sign-in failed for ${user}`).toBe(200);
  const setCookie = response.headers()["set-cookie"] ?? "";
  const token = setCookie.split("better-auth.session_token=")[1]?.split(";")[0] ?? "";
  expect(token, `no session token in Set-Cookie for ${user}`).toBeTruthy();
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(file, token);
  return token;
}

export function seedUser(kind: "admin" | "editor1" | "editor2") {
  const map = {
    admin: "admin@tessera.local",
    editor1: "editor@test.com",
    editor2: "editor2@test.com",
  } as const;
  return { email: map[kind], password: process.env.SEED_PASSWORD ?? "admin123" };
}

export async function signInAs(request: any, kind: "admin" | "editor1" | "editor2") {
  const { email, password } = seedUser(kind);
  return getSessionToken(request, kind, email, password);
}

/** Wait until React has hydrated the page (networkidle alone is insufficient). */
export async function waitForHydration(page: any) {
  await page.waitForFunction(() => {
    const el = document.querySelector("form, article, table, main") ?? document.body;
    return Object.keys(el).some((k) => k.startsWith("__reactFiber"));
  });
}

export const test = base;
export { expect };
