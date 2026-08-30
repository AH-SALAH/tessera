/// <reference types="vitest/globals" />
import { buildAntdThemeConfig } from "./antd-theme";

describe("buildAntdThemeConfig", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    delete (global as any).window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("returns ThemeConfig with light mode tokens from CSS vars", () => {
    global.window = {
      document: {
        documentElement: {
          getPropertyValue: (name: string) => {
            const vars: Record<string, string> = {
              "--color-moss": "#3B5D50",
              "--color-ochre": "#C98A3C",
              "--color-chalk": "#F1F0EC",
              "--color-surface": "#FFFFFF",
              "--color-graphite": "#22262B",
              "--color-muted": "#686C70",
              "--color-clay-line": "#D8D5CC",
              "--font-body": "Public Sans, system-ui, sans-serif",
            };
            return vars[name] || "";
          },
        },
      },
    } as any;

    const config = buildAntdThemeConfig("light");
    const token = config.token!;

    expect(token.colorPrimary).toBe("#3B5D50");
    expect(token.colorWarning).toBe("#C98A3C");
    expect(token.colorBgBase).toBe("#F1F0EC");
    expect(token.colorBgContainer).toBe("#FFFFFF");
    expect(token.colorText).toBe("#22262B");
    expect(token.colorTextSecondary).toBe("#686C70");
    expect(token.colorBorder).toBe("#D8D5CC");
    expect(token.borderRadius).toBe(4);
    expect(token.fontFamily).toBe("Public Sans, system-ui, sans-serif");
    expect(config.components?.Typography?.fontFamily).toBe("Public Sans, system-ui, sans-serif");
  });

  it("returns ThemeConfig with dark mode tokens from CSS vars", () => {
    global.window = {
      document: {
        documentElement: {
          getPropertyValue: (name: string) => {
            const vars: Record<string, string> = {
              "--color-moss": "#4E7D6E",
              "--color-ochre": "#D9A05B",
              "--color-chalk": "#1B1F23",
              "--color-surface": "#24292E",
              "--color-graphite": "#F1F0EC",
              "--color-muted": "#9A9EA2",
              "--color-clay-line": "#33383D",
              "--font-body": "Public Sans, system-ui, sans-serif",
            };
            return vars[name] || "";
          },
        },
      },
    } as any;

    const config = buildAntdThemeConfig("dark");
    const token = config.token!;

    expect(token.colorPrimary).toBe("#4E7D6E");
    expect(token.colorWarning).toBe("#D9A05B");
    expect(token.colorBgBase).toBe("#1B1F23");
    expect(token.colorBgContainer).toBe("#24292E");
    expect(token.colorText).toBe("#F1F0EC");
    expect(token.colorTextSecondary).toBe("#9A9EA2");
    expect(token.colorBorder).toBe("#33383D");
  });

  it("falls back to hardcoded light values when CSS vars missing (SSR)", () => {
    global.window = undefined as any;

    const config = buildAntdThemeConfig("light");
    const token = config.token!;

    expect(token.colorPrimary).toBe("#3B5D50");
    expect(token.colorBgBase).toBe("#F1F0EC");
    expect(token.colorText).toBe("#22262B");
  });

  it("falls back to hardcoded dark values when CSS vars missing (SSR)", () => {
    global.window = undefined as any;

    const config = buildAntdThemeConfig("dark");
    const token = config.token!;

    expect(token.colorPrimary).toBe("#4E7D6E");
    expect(token.colorBgBase).toBe("#1B1F23");
    expect(token.colorText).toBe("#F1F0EC");
  });
});
