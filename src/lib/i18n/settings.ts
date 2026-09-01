// lib/i18n/settings.ts
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function dir(locale: string): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
