import type { Config } from "tailwindcss";

// Tailwind reads its color/font/radius values from the CSS custom properties defined once in
// styles/tokens.scss (Constitution Article V — one source of truth). Never add a raw hex or
// font name here directly; add it to tokens.scss first.

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chalk: "var(--color-chalk)",
        surface: "var(--color-surface)",
        graphite: "var(--color-graphite)",
        muted: "var(--color-muted)",
        moss: "var(--color-moss)",
        ochre: "var(--color-ochre)",
        "clay-line": "var(--color-clay-line)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        base: "var(--radius-base)",
      },
    },
  },
  plugins: [],
};

export default config;
