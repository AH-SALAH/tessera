// lib/theme/antd-theme.ts
// Maps Tessera's single design-token source (styles/tokens.scss) onto Ant Design's
// ConfigProvider theme API, so the admin console never ships Ant Design's default theme
// (Constitution Article X). Read tokens from CSS custom properties at runtime so light/dark
// switching (next-themes) is reflected without a separate AntD-specific theme object per mode.

import type { ThemeConfig } from "antd";

function cssVar(
  name: string,
  fallbackLight: string,
  fallbackDark: string,
  mode: "light" | "dark",
): string {
  if (typeof window === "undefined") return mode === "dark" ? fallbackDark : fallbackLight;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || (mode === "dark" ? fallbackDark : fallbackLight);
}

// Fallback values mirror styles/tokens.scss, used only for SSR before
// hydration reads the real CSS custom properties — never a second source of truth for the
// actual values, just a safe default paint.
export function buildAntdThemeConfig(mode: "light" | "dark"): ThemeConfig {
  return {
    token: {
      colorPrimary: cssVar("--color-moss", "#3B5D50", "#62A08A", mode),
      colorWarning: cssVar("--color-ochre", "#8E6530", "#D9A05B", mode),
      colorBgBase: cssVar("--color-chalk", "#F1F0EC", "#1B1F23", mode),
      colorBgContainer: cssVar("--color-surface", "#FFFFFF", "#24292E", mode),
      colorText: cssVar("--color-graphite", "#22262B", "#F1F0EC", mode),
      colorTextSecondary: cssVar("--color-muted", "#686C70", "#9A9EA2", mode),
      colorBorder: cssVar("--color-clay-line", "#D8D5CC", "#33383D", mode),
      borderRadius: 4,
      fontFamily: cssVar(
        "--font-body",
        "Public Sans, system-ui, sans-serif",
        "Public Sans, system-ui, sans-serif",
        mode,
      ),
    },
    components: {
      Tag: {
        colorWarning: cssVar("--color-ochre", "#8E6530", "#D9A05B", mode),
        colorWarningBg: cssVar("--color-ochre-bg", "#FFF5E6", "#3D2E14", mode),
      },
      Typography: {
        fontFamily: cssVar(
          "--font-body",
          "Public Sans, system-ui, sans-serif",
          "Public Sans, system-ui, sans-serif",
          mode,
        ),
      },
    },
  };
}
