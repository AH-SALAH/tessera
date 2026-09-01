// lib/site-url.ts
// Single source of truth for the site URL (Constitution Article V).
// Every file that needs the base URL imports this instead of hardcoding
// "http://localhost:3000". The env var is set in .env.local (dev) and
// in CI's workflow env block.

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
