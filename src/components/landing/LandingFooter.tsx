"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

const FOOTER_LINKS = [
  { href: "#", key: "landing.footer.terms" },
  { href: "#", key: "landing.footer.privacy" },
  { href: "https://twitter.com", label: "Twitter" },
  { href: "https://github.com", label: "GitHub" },
];

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="relative z-50 border-t border-clay-line bg-chalk">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-3 px-8 py-12 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-display text-[24px] leading-[32px] font-bold text-moss">
            Tessera
          </span>
        </div>
        <div className="flex gap-6 font-mono text-xs font-medium tracking-[0.05em]">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.key ?? link.label}
              href={link.href}
              className="text-muted transition-all duration-200 hover:text-graphite"
            >
              {link.key ? t(link.key) : link.label}
            </Link>
          ))}
        </div>
        <div className="font-body text-sm text-muted">
          &copy; {new Date().getFullYear()} {t("landing.footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
