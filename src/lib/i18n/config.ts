// lib/i18n/config.ts
// Single i18next instance (Constitution Article V). Locale JSON resources are the only
// source of UI strings — see locales/{en,ar}/common.json.

import i18next, { type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { locales, defaultLocale } from "./settings";

const instances = new Map<string, i18n>();

export function initI18next(locale: string) {
  let instance = instances.get(locale);
  if (!instance) {
    instance = i18next.createInstance();

    instance
      .use(initReactI18next)
      .use(
        resourcesToBackend(
          (language: string, namespace: string) =>
            import(`../../locales/${language}/${namespace}.json`),
        ),
      )
      .init({
        lng: locale,
        fallbackLng: defaultLocale,
        supportedLngs: locales,
        ns: ["common"],
        defaultNS: "common",
        interpolation: { escapeValue: false },
      });

    instances.set(locale, instance);
  }

  return instance;
}
