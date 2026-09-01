// components/ui/LanguageToggle.tsx
"use client";

import { useTranslation } from "react-i18next";
import { useRouter, usePathname } from "next/navigation";
import { Dropdown } from "antd";
import { IconGlobe } from "@/components/ui/icons";
import { locales, type Locale } from "@/lib/i18n/settings";

const LANGUAGES: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "EN" },
  ar: { label: "العربية", flag: "AR" },
};

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const current = (i18n.language?.slice(0, 2) || "en") as Locale;

  const switchLanguage = (locale: Locale) => {
    if (locale === current) return;

    // Replace locale segment in URL
    const segments = pathname.split("/");
    segments[1] = locale;
    const newPath = segments.join("/");

    // Persist preference
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    }).catch(() => {});

    router.push(newPath);
  };

  const menuItems = locales.map((lng) => ({
    key: lng,
    label: (
      <span className="flex items-center gap-2">
        <span className="text-xs font-mono opacity-60">{LANGUAGES[lng].flag}</span>
        {LANGUAGES[lng].label}
      </span>
    ),
  }));

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: ({ key }) => switchLanguage(key as Locale),
        selectedKeys: [current],
      }}
      rootClassName="tessera-dropdown"
      trigger={["click"]}
      placement="bottomRight"
    >
      <button
        className="flex items-center gap-1.5 p-2 rounded hover:bg-chalk text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        aria-label={t("aria.currentLanguage", { language: LANGUAGES[current].label })}
      >
        <IconGlobe className="text-sm" />
        <span className="hidden md:inline text-sm font-medium">{LANGUAGES[current].flag}</span>
      </button>
    </Dropdown>
  );
}
