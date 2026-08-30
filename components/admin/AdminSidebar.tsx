// components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  IconProjects,
  IconUsers,
  IconDatabase,
  IconLogs,
  IconDashboard,
} from "@/components/ui/icons";

interface AdminSidebarProps {
  locale: string;
  open?: boolean;
  onClose?: () => void;
}

function SidebarContent({ locale }: { locale: string }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { href: "/projects", label: t("nav.projects"), icon: IconProjects },
    { href: "/users", label: t("nav.users"), icon: IconUsers },
  ];

  const BOTTOM_ITEMS = [
    { href: "/schema", label: t("nav.database"), icon: IconDatabase },
    { href: "/logs", label: t("nav.logs"), icon: IconLogs },
  ].filter(() => false); // hidden for MVP

  return (
    <>
      {/* Logo Section */}
      <div className="px-6 py-4 border-b border-clay-line mb-4">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/assets/logo.png"
            alt="Tessera"
            width={120}
            height={39}
            priority
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Dashboard Link */}
      <div className="px-4 mb-6">
        <Link
          href={`/${locale}/dashboard`}
          className={`w-full py-2 rounded flex items-center justify-center gap-2 transition-opacity ${
            pathname === `/${locale}/dashboard`
              ? "bg-moss text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-low"
          } font-data-label text-data-label`}
        >
          <IconDashboard className="text-sm" /> {t("nav.dashboard")}
        </Link>
      </div>

      {/* Main Nav */}
      <ul className="flex flex-col flex-grow">
        {NAV_ITEMS.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive =
            pathname === fullHref || (item.href !== "/dashboard" && pathname.startsWith(fullHref));

          return (
            <li
              key={item.href}
              className={`${
                isActive
                  ? "bg-surface text-primary border-y border-s border-clay-line -me-[1px] relative z-10"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              } transition-all duration-150 flex items-center px-6 py-4 gap-3 cursor-pointer`}
            >
              <Link href={fullHref} className="flex items-center gap-3 w-full">
                <item.icon />
                <span className="font-data-label text-data-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Bottom Nav */}
      <div className="mt-auto border-t border-clay-line border-none pt-2 pb-4">
        <ul className="flex flex-col">
          {BOTTOM_ITEMS.map((item) => {
            const fullHref = `/${locale}${item.href}`;
            const isActive = pathname.startsWith(fullHref);

            return (
              <li
                key={item.href}
                className={`${
                  isActive
                    ? "bg-surface text-primary border-y border-s border-clay-line -me-[1px] relative z-10"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                } transition-all duration-150 flex items-center px-6 py-4 gap-3 cursor-pointer`}
              >
                <Link href={fullHref} className="flex items-center gap-3 w-full">
                  <item.icon />
                  <span className="font-data-label text-data-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export function AdminSidebar({ locale, open, onClose }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <nav className="hidden md:flex flex-col h-screen fixed start-0 top-0 bg-chalk border-e border-clay-line z-20 w-64">
        <SidebarContent locale={locale} />
      </nav>

      {/* Mobile drawer — always mounted for exit animation */}
      <div className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-graphite/40 transition-opacity duration-300 ease-in-out ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
        {/* Drawer */}
        <nav
          className={`absolute start-0 top-0 h-full w-64 bg-chalk border-e border-clay-line flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent locale={locale} />
        </nav>
      </div>
    </>
  );
}
