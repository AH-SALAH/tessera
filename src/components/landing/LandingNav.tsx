"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const NAV_LINKS = [{ href: "#features", key: "landing.features" }];

export function LandingNav() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 border-b border-clay-line bg-chalk/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-8 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Image
            src="/assets/logo.png"
            alt="Tessera"
            width={120}
            height={32}
            priority
            className="h-8 w-auto"
            style={{ height: "auto" }}
          />
          {/* <span className="font-display text-[24px] leading-[32px] font-bold text-moss">
            Tessera
          </span> */}
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-body text-base text-muted transition-colors duration-200 hover:text-moss"
            >
              {t(link.key)}
            </a>
          ))}
        </div>
        <Link
          href={`/${locale}/sign-in`}
          className="rounded-base bg-moss px-4 py-2 font-mono text-xs font-medium tracking-[0.05em] text-white transition-colors duration-200 hover:bg-moss/90"
        >
          {t("landing.getStarted")}
        </Link>
      </div>
    </nav>
  );
}
