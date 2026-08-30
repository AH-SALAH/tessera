import next from "eslint-config-next";

// eslint-config-next v16 ships its flat config as an array (export =), not a factory.
const eslintConfig = [
  ...next,
  {
    rules: {
      // Constitution Article V/X guard: catches raw hex values slipping into components
      // outside the token file. A real implementation should back this with a custom rule
      // or the design-token-audit script referenced in tasks.md T059 — this comment marks
      // the intent so it isn't lost during implementation.
    },
  },
];

export default eslintConfig;
