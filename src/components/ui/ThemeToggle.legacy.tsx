// components/ui/ThemeToggle.tsx
"use client";

import { useTheme } from "@/lib/providers";
import { useCallback } from "react";
import { IconSun, IconMoon } from "@/components/ui/icons";

type Theme = "light" | "dark" | "system";

const CYCLE: Theme[] = ["light", "dark", "system"];

function nextTheme(current: Theme | undefined): Theme {
  const idx = CYCLE.indexOf(current ?? "system");
  return CYCLE[(idx + 1) % CYCLE.length];
}

function labelFor(theme: Theme): string {
  switch (theme) {
    case "light":
      return "Light";
    case "dark":
      return "Dark";
    case "system":
      return "System";
  }
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggle = useCallback(() => {
    const next = nextTheme(theme as Theme | undefined);
    setTheme(next);
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {});
  }, [theme, setTheme]);

  const active = (theme as Theme) ?? "system";

  return (
    <button
      onClick={toggle}
      className="p-2 rounded hover:bg-chalk text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
      aria-label={`Theme: ${labelFor(active)}. Click to switch.`}
      title={labelFor(active)}
      suppressHydrationWarning
    >
      {resolvedTheme === "dark" ? (
        <IconMoon className="text-sm" />
      ) : (
        <IconSun className="text-sm" />
      )}
    </button>
  );
}
