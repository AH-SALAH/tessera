// components/ui/ThemeSelect.tsx
"use client";

import { useTheme } from "@/lib/providers";
import { useTranslation } from "react-i18next";
import { Dropdown } from "antd";
import { IconSun, IconMoon, IconDeviceDesktop } from "@/components/ui/icons";
import { useSyncExternalStore } from "react";

// Hydration-safe: returns false during SSR, true after hydration.
// Uses useSyncExternalStore (React 18+) — no useEffect needed.
const useIsMounted = () =>
  useSyncExternalStore(() => () => {}, () => true, () => false);

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  // Defer reading the real theme until after hydration to avoid SSR/client mismatch.
  const mounted = useIsMounted();
  const current = mounted ? ((theme as "light" | "dark" | "system") ?? "system") : "system";

  const THEMES = [
    { value: "light", label: t("theme.light"), icon: <IconSun className="text-sm" /> },
    { value: "dark", label: t("theme.dark"), icon: <IconMoon className="text-sm" /> },
    { value: "system", label: t("theme.system"), icon: <IconDeviceDesktop className="text-sm" /> },
  ] as const;

  const handleClick = ({ key }: { key: string }) => {
    setTheme(key as "light" | "dark" | "system");
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: key }),
    }).catch(() => {});
  };

  const menuItems = THEMES.map((t) => ({
    key: t.value,
    label: t.label,
    icon: t.icon,
  }));

  // Icon reflects the selection (light/dark/system), stable across SSR for no mismatch
  const displayIcon = THEMES.find((t) => t.value === current)?.icon ?? (
    <IconSun className="text-sm" />
  );

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: handleClick,
        selectedKeys: [current],
      }}
      rootClassName="tessera-dropdown"
      trigger={["click"]}
      placement="bottomRight"
    >
      <button
        className="flex items-center gap-1.5 p-2 rounded hover:bg-chalk text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        aria-label={t("theme.ariaLabel", { theme: current })}
        suppressHydrationWarning
      >
        {displayIcon}
        <span className="hidden md:inline text-sm font-medium capitalize">{current}</span>
      </button>
    </Dropdown>
  );
}
