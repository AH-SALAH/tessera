// components/admin/TopNav.tsx
"use client";

// import Link from "next/link";
import { usePathname } from "next/navigation";
// import { IconChevronRight } from "@/components/ui/icons";
import { useTranslation } from "react-i18next";
import { UserMenu } from "./UserMenu";
import { ThemeSelect } from "@/components/ui/ThemeSelect";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

interface TopNavProps {
  locale: string;
  user: {
    email: string;
    role: string;
  };
  onMenuToggle?: () => void;
}

// function buildBreadcrumbs(pathname: string, locale: string) {
//   const segments = pathname.replace(`/${locale}`, "").split("/").filter(Boolean);
//   const crumbs: Array<{ label: string; href: string }> = [];
//   let href = `/${locale}`;
//   for (const seg of segments) {
//     href += `/${seg}`;
//     crumbs.push({ label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "), href });
//   }
//   return crumbs;
// }

export function TopNav({ locale, user, onMenuToggle }: TopNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  // const crumbs = buildBreadcrumbs(pathname, locale);

  return (
    <header className="bg-chalk docked top-0 border-b border-clay-line flex justify-between items-center w-full px-8 h-16 z-30 sticky">
      <div className="flex items-center gap-2 text-sm font-data-label text-on-surface-variant">
        {/* Mobile hamburger */}
        {onMenuToggle && (
          <button
            className="md:hidden p-1 -ms-2 text-on-surface-variant hover:text-primary cursor-pointer"
            onClick={onMenuToggle}
            aria-label={t("aria.toggleMenu")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </svg>
          </button>
        )}
        {/* <Link href={`/${locale}/dashboard`} className="hover:text-primary transition-colors">
          Tessera
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <IconChevronRight className="text-xs" />
            {i === crumbs.length - 1 ? (
              <span className="font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-primary hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))} */}
      </div>

      <div className="flex items-center gap-4">
        {/* Language toggle */}
        <LanguageToggle />
        {/* Theme select */}
        <ThemeSelect />
        {/* Account */}
        <div className="flex items-center gap-3 text-on-surface-variant">
          <UserMenu user={user} locale={locale} />
        </div>
      </div>
    </header>
  );
}
