// lighthouserc.mjs
// Lighthouse CI config (T061). Reads the site URL from NEXT_PUBLIC_APP_URL
// (set in CI env or .env.local) — same env var that lib/site-url.ts reads
// in TypeScript code. Server start/stop is managed by LHCI itself via
// startServerCommand + startServerReadyPattern, so the CI workflow just runs
// `npx lhci autorun` with no manual sleep/&.

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** @type {import('@lhci/cli').LHCI} */
const config = {
  ci: {
    collect: {
      url: [`${baseURL}/en`, `${baseURL}/ar`],
      numberOfRuns: 1,
      startServerCommand: "NODE_ENV=production npm run start",
      startServerReadyPattern: "Ready in",
      settings: {
        chromeFlags: "--no-sandbox --headless",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};

export default config;
