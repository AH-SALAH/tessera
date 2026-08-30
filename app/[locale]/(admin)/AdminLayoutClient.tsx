// app/[locale]/(admin)/AdminLayoutClient.tsx
"use client";

import { App, ConfigProvider } from "antd";
import { useTheme, useThemeEffect } from "@/lib/providers";
import { buildAntdThemeConfig } from "@/lib/theme/antd-theme";
import { initI18next } from "@/lib/i18n/config";
import { I18nextProvider } from "react-i18next";
import { ReactNode, useMemo } from "react";
import { AdminFlagsProvider } from "./admin-flags";

interface AdminLayoutClientProps {
  children: ReactNode;
  locale: string;
  aiDraftAssistEnabled: boolean;
  initialTheme?: "light" | "dark";
}

function ThemedApp({ children, mode }: { children: ReactNode; mode: "light" | "dark" }) {
  const theme = useMemo(() => buildAntdThemeConfig(mode), [mode]);
  return (
    <ConfigProvider theme={theme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}

export function AdminLayoutClient({
  children,
  locale,
  aiDraftAssistEnabled,
  initialTheme,
}: AdminLayoutClientProps) {
  const themeApi = useTheme();
  const { resolvedTheme } = themeApi;
  const mode = (resolvedTheme === "dark" ? "dark" : "light") as "light" | "dark";

  // Sync DB theme preference to next-themes when it differs from cookie state.
  // This ensures the user's saved preference is applied on first navigation.
  useThemeEffect((_theme, resolved) => {
    if (initialTheme && initialTheme !== resolved) {
      themeApi.setTheme(initialTheme);
    }
  }, [initialTheme]);

  const i18nInstance = useMemo(() => initI18next(locale), [locale]);

  return (
    <I18nextProvider i18n={i18nInstance}>
      <AdminFlagsProvider flags={{ aiDraftAssistEnabled }}>
        <ThemedApp mode={mode}>{children}</ThemedApp>
      </AdminFlagsProvider>
    </I18nextProvider>
  );
}
