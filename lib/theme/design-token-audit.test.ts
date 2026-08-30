// lib/theme/design-token-audit.test.ts
// T059 — Design-token audit (Constitution Article X). Greps components/ and app/ for raw
// hex color values or Ant Design default token names outside the single allowed sources
// (styles/tokens.scss and lib/theme/antd-theme.ts). Zero matches expected.
// Confirm it fails first if any exist.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Directories to audit
const AUDIT_DIRS = ["components", "app"];

// Files exempt from the audit (single sources of truth)
const EXEMPT_PATHS = ["lib/theme/antd-theme.ts", "styles/tokens.scss"];

// Hex color pattern: matches #RGB, #RRGGBB, #RRGGBBAA — but NOT CSS custom property
// references like var(--color-chalk) or Tailwind utility classes like bg-chalk.
// Anchored to lines where a raw hex appears as a literal color value.
const HEX_PATTERN = /(?:^|[\s:=,(])#[0-9a-fA-F]{3,8}\b/;

// Ant Design default token names that should never appear as inline values or hardcoded
// references in component files — the single source is lib/theme/antd-theme.ts.
const ANTD_TOKEN_NAMES = [
  "colorPrimary",
  "colorBgBase",
  "colorBgContainer",
  "colorBgLayout",
  "colorBgElevated",
  "colorText",
  "colorTextSecondary",
  "colorTextTertiary",
  "colorTextQuaternary",
  "colorBorder",
  "colorBorderSecondary",
  "colorError",
  "colorSuccess",
  "colorWarning",
  "colorInfo",
  "borderRadius",
  "fontFamily",
  "fontSize",
  "fontSizeSM",
  "fontSizeLG",
  "fontSizeXL",
  "lineHeight",
  "lineHeightLG",
  "lineHeightSM",
  "margin",
  "marginSM",
  "marginLG",
  "padding",
  "paddingSM",
  "paddingLG",
  "paddingXS",
];

function walkDir(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkDir(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function getAllSourceFiles(dirs: string[]): string[] {
  const files: string[] = [];
  for (const dir of dirs) {
    walkDir(dir, files);
  }
  // Normalize paths for comparison and make EXEMPT_PATHS work with both formats
  return files.filter((f) => {
    const normalized = f.replace(/\\/g, "/");
    return !EXEMPT_PATHS.some((e) => normalized.endsWith(e) || normalized.includes(e));
  });
}

function auditFile(filePath: string): {
  file: string;
  hexMatches: string[];
  antdTokenMatches: string[];
} {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  const hexMatches: string[] = [];
  const antdTokenMatches: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip lines that are comments or CSS custom property references
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

    // Check for raw hex — exclude CSS var() references and Tailwind class names
    if (HEX_PATTERN.test(line) && !/var\(--/.test(line)) {
      hexMatches.push(`  L${lineNum}: ${trimmed}`);
    }

    // Check for Ant Design token names used as literal strings or object keys
    // outside of the exempted theme file
    for (const token of ANTD_TOKEN_NAMES) {
      // Match as object key: { colorPrimary: ... } or token.colorPrimary
      // But NOT inside var(--...) or CSS class strings like "color-primary"
      const tokenPattern = new RegExp(`\\b${token}\\b`);
      if (tokenPattern.test(line)) {
        // Exclude: CSS variable references, Tailwind classes, string values that just mention the name
        if (
          !/var\(--/.test(line) &&
          !/className/.test(line) &&
          !/["'].*color-primary.*["']/.test(line) &&
          !trimmed.startsWith("//") &&
          !trimmed.startsWith("*")
        ) {
          antdTokenMatches.push(`  L${lineNum}: ${trimmed}`);
        }
      }
    }
  }

  return { file: filePath, hexMatches, antdTokenMatches };
}

describe("Design-token audit (Article X)", () => {
  it("should have zero raw hex color values in components/ and app/ (outside allowed sources)", () => {
    const files = getAllSourceFiles(AUDIT_DIRS);
    const violations: string[] = [];

    for (const file of files) {
      const result = auditFile(file);
      if (result.hexMatches.length > 0) {
        violations.push(`${result.file}:\n${result.hexMatches.join("\n")}`);
      }
    }

    expect(
      violations,
      `Raw hex color values found outside allowed sources (styles/tokens.scss, lib/theme/antd-theme.ts).\n` +
        `All color values must reference CSS custom properties or Tailwind tokens.\n\n` +
        `Violations:\n${violations.join("\n\n")}`,
    ).toHaveLength(0);
  });

  it("should have zero Ant Design default token names hardcoded in components/ and app/ (outside antd-theme.ts)", () => {
    const files = getAllSourceFiles(AUDIT_DIRS);
    const violations: string[] = [];

    for (const file of files) {
      const result = auditFile(file);
      if (result.antdTokenMatches.length > 0) {
        violations.push(`${result.file}:\n${result.antdTokenMatches.join("\n")}`);
      }
    }

    expect(
      violations,
      `Ant Design default token names found hardcoded outside lib/theme/antd-theme.ts.\n` +
        `All theme values must flow through the ConfigProvider theme prop.\n\n` +
        `Violations:\n${violations.join("\n\n")}`,
    ).toHaveLength(0);
  });

  it("should have zero inline style color values in components/ and app/", () => {
    const files = getAllSourceFiles(AUDIT_DIRS);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

        // Match style={{ ... }} with color/background-color/etc containing raw values
        if (/style\s*=\s*\{/.test(line)) {
          // Check for color, backgroundColor, borderColor with non-variable values
          if (
            /(?:color|background|border)\s*:\s*["']?(?!var\(--)(?!inherit)(?!transparent)(?!currentColor)[a-zA-Z]/i.test(
              line,
            )
          ) {
            violations.push(`  L${i + 1} in ${file}: ${trimmed}`);
          }
        }
      }
    }

    expect(
      violations,
      `Inline style color values found. Use CSS custom properties or Tailwind classes instead.\n\n` +
        `Violations:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
