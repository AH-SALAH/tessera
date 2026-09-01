// .storybook/preview.tsx
// Every story renders inside the same providers the real app uses, so Storybook is a true
// living record of the design system in both themes and both locales (Constitution Article
// X, DESIGN.md). Global toolbar items below let any story be viewed in all 4 combinations
// without per-story duplication (same pattern as PulseFeed's Storybook setup).

import type { Preview } from "@storybook/react";
import { ConfigProvider } from "antd";
import { buildAntdThemeConfig } from "../src/lib/theme/antd-theme";
import "../src/styles/tokens.scss";
import "../src/app/globals.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Theme",
      toolbar: { items: ["light", "dark"], dynamicTitle: true },
    },
    locale: {
      description: "Locale",
      toolbar: { items: ["en", "ar"], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light", locale: "en" },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light";
      const locale = context.globals.locale ?? "en";
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", locale);
      return (
        <ConfigProvider theme={buildAntdThemeConfig(theme)}>
          <Story />
        </ConfigProvider>
      );
    },
  ],
};

export default preview;
