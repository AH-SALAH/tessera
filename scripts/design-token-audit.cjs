#!/usr/bin/env node
// scripts/design-token-audit.js
// Constitution Article X guard: catches raw hex values or Ant Design default tokens
// outside styles/tokens.scss and lib/theme/antd-theme.ts

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const ALLOWED_FILES = new Set([
  "src/styles/tokens.scss",
  "src/lib/theme/antd-theme.ts",
  ".storybook/preview.tsx",
]);

const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/g;
const ANTD_DEFAULT_TOKENS = [
  "colorPrimary",
  "colorSuccess",
  "colorWarning",
  "colorError",
  "colorInfo",
  "colorBgBase",
  "colorBgContainer",
  "colorText",
  "colorTextSecondary",
  "colorBorder",
  "borderRadius",
  "fontFamily",
];

function getFiles(dir, extensions) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next", ".git", "dist", "build"].includes(entry.name)) {
        files.push(...getFiles(fullPath, extensions));
      }
    } else if (extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function auditFile(filePath) {
  const relPath = filePath.replace(ROOT + "/", "");
  if (ALLOWED_FILES.has(relPath)) return { hex: [], antdTokens: [] };

  const content = fs.readFileSync(filePath, "utf-8");
  const hexMatches = content.match(HEX_REGEX) || [];
  const antdMatches = [];

  for (const token of ANTD_DEFAULT_TOKENS) {
    if (content.includes(token) && !content.includes("--color-") && !content.includes("--font-")) {
      antdMatches.push(token);
    }
  }

  return { hex: hexMatches, antdTokens: antdMatches };
}

function main() {
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".scss", ".css"];
  const files = getFiles(ROOT, extensions);

  let hasViolations = false;

  for (const file of files) {
    const relPath = file.replace(ROOT + "/", "");
    // Skip test files - they need to assert exact hex values
    if (
      relPath.endsWith(".test.ts") ||
      relPath.endsWith(".test.tsx") ||
      relPath.endsWith(".spec.ts") ||
      relPath.endsWith(".spec.tsx")
    ) {
      continue;
    }
    const { hex, antdTokens } = auditFile(file);

    if (hex.length > 0) {
      console.error(`\x1b[31m[HEX]\x1b[0m ${relPath}: ${hex.join(", ")}`);
      hasViolations = true;
    }
    if (antdTokens.length > 0) {
      console.error(`\x1b[31m[ANT-DEFAULT]\x1b[0m ${relPath}: ${antdTokens.join(", ")}`);
      hasViolations = true;
    }
  }

  if (hasViolations) {
    console.error("\n\x1b[31mDesign token audit FAILED\x1b[0m");
    console.error(
      "All colors/fonts/radius must come from styles/tokens.scss (Constitution Article X)",
    );
    process.exit(1);
  } else {
    console.log("\x1b[32mDesign token audit PASSED\x1b[0m");
  }
}

main();
