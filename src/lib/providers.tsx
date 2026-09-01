"use client";

import { createThemes } from "@teispace/next-themes";
import { createContext, useContext, useMemo } from "react";

if (typeof window === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

const themeConfig = {
  themes: ["light", "dark"] as const,
  defaultTheme: "system",
  attribute: "data-theme",
  storage: "hybrid",
  storageKey: "theme",
  disableTransitionOnChange: "*" as const,
  enableSystem: true,
  themeColor: { light: "#fafafa", dark: "#1a1a2e" },
} as const;

type ThemeAPI = ReturnType<typeof createThemes<typeof themeConfig.themes>>;

const ThemeContext = createContext<ThemeAPI | null>(null);

export function ThemeFactory({ children }: { children: React.ReactNode }) {
  const api = useMemo(() => createThemes(themeConfig), []);
  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}

function useThemeAPI() {
  const api = useContext(ThemeContext);
  if (!api) throw new Error("Theme hooks must be used within ThemeFactory");
  return api;
}

function ThemeProviderWrapper({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const { ThemeProvider } = useThemeAPI();
  return <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>;
}

export function Providers({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  return (
    <ThemeFactory>
      <ThemeProviderWrapper initialTheme={initialTheme}>{children}</ThemeProviderWrapper>
    </ThemeFactory>
  );
}

export const useTheme = () => useThemeAPI().useTheme();
export const useThemeValue = <T,>(map: Record<string, T> & { default?: T }) =>
  useThemeAPI().useThemeValue(map);
export const useThemeEffect = (
  effect: (theme: string, resolvedTheme: string) => void | (() => void),
  deps?: React.DependencyList,
) => useThemeAPI().useThemeEffect(effect, deps);
export const ThemedImage = ({ ...props }: React.ComponentProps<ThemeAPI["ThemedImage"]>) => {
  const { ThemedImage: Comp } = useThemeAPI();
  return <Comp {...props} />;
};
export const ThemedIcon = ({ ...props }: React.ComponentProps<ThemeAPI["ThemedIcon"]>) => {
  const { ThemedIcon: Comp } = useThemeAPI();
  return <Comp {...props} />;
};
export const ScopedTheme = ({ ...props }: React.ComponentProps<ThemeAPI["ScopedTheme"]>) => {
  const { ScopedTheme: Comp } = useThemeAPI();
  return <Comp {...props} />;
};
