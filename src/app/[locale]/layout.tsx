// app/[locale]/layout.tsx
// Server component that reads the locale from params and wraps all locale-scoped
// routes (public + admin) with the i18next provider, so any component calling
// useTranslation() works regardless of which route group it renders in
// (Constitution Article IX — i18n is a functional requirement, not admin-only).
//
// The admin layout already provides its own I18nextProvider with a locale-specific
// instance, so the inner provider wins for admin routes. Public routes get this one.

import { ReactNode } from "react";
import { I18nProviderClient } from "./i18n-provider";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  return <I18nProviderClient locale={locale}>{children}</I18nProviderClient>;
}
