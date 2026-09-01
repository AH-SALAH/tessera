// app/[locale]/i18n-provider.tsx
// Client component that initializes i18next with the correct locale and wraps
// children in I18nextProvider. Separated from the server layout so the async
// params are resolved on the server, and only the provider runs on the client.
// Also sets dir/lang on <html> for RTL support (Constitution Article IX).

"use client";

import { I18nextProvider } from "react-i18next";
import { initI18next } from "@/lib/i18n/config";
import { dir } from "@/lib/i18n/settings";
import { ReactNode, useEffect } from "react";

interface I18nProviderClientProps {
  children: ReactNode;
  locale: string;
}

export function I18nProviderClient({ children, locale }: I18nProviderClientProps) {
  const i18nInstance = initI18next(locale);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", locale);
    root.setAttribute("dir", dir(locale));
  }, [locale]);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}
