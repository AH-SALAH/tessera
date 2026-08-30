// app/[locale]/(admin)/AdminLayoutClient.tsx
"use client";

import { App, ConfigProvider } from "antd";
import { useTheme } from "@/lib/providers";
import { buildAntdThemeConfig } from "@/lib/theme/antd-theme";
import { initI18next } from "@/lib/i18n/config";
import { I18nextProvider } from "react-i18next";
import { ReactNode, useMemo } from "react";
import { AdminFlagsProvider } from "./admin-flags";

interface AdminLayoutClientProps {
  children: ReactNode;
  locale: string;
  aiDraftAssistEnabled: boolean;
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
}: AdminLayoutClientProps) {
  const { resolvedTheme } = useTheme();
  const mode = (resolvedTheme === "dark" ? "dark" : "light") as "light" | "dark";

  const i18nInstance = useMemo(() => initI18next(locale), [locale]);

  return (
    <I18nextProvider i18n={i18nInstance}>
      <AdminFlagsProvider flags={{ aiDraftAssistEnabled }}>
        <ThemedApp mode={mode}>{children}</ThemedApp>
      </AdminFlagsProvider>
    </I18nextProvider>
  );
}
