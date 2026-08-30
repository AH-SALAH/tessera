# Tessera Design System Export

## Files Created

### 1. `styles/tessera-design-system.css`

**Standalone CSS** — No build step required. Import directly in any HTML file.

Contains:

- CSS custom properties (light + dark themes)
- Typography tokens (Fraunces, Public Sans, IBM Plex Mono)
- Component classes (CatalogCard, StatusBadge, Admin Sidebar, Forms, Buttons)
- Utility classes (spacing, flex, grid, colors)
- Focus states (WCAG 2.1 AA, Moss accent, 2px)
- Scrollbar styling (subtle, catalog-appropriate)

Usage:

```html
<link rel="stylesheet" href="styles/tessera-design-system.css" />
```

### 2. `styles/stitch-screens-export.html`

**HTML reference** — Visual guide for all 16 Stitch screens.

Screens included:

- Admin Dashboard (screen 1)
- Projects Management (screen 2)
- Secure Login (screen 3)
- Posts Management (screen 4)
- Media Archive (screen 5)
- Schema Configuration (screen 6)
- GraphQL Schema Inspector (screen 7)
- Create New Project (screen 8)
- Project Editor (screen 9)
- Users Management (screen 10)
- Public Home (screen 11)
- Project Detail (screen 12)
- Post Detail (screen 13)
- Public Schema View (screen 14)

### 3. `app/globals.css` (FIXED)

**Tailwind CSS 4 compatibility** — Renamed from `.scss` to `.css`, updated syntax.

Changes:

- Renamed `globals.scss` → `globals.css` (Tailwind CSS 4 recommends plain CSS)
- Replaced `@tailwind base/components/utilities` with `@import "tailwindcss"`
- Added `@theme` directive for Tailwind v4 CSS-based configuration
- Moved dark theme overrides to `[data-theme="dark"]` selector
- Removed `@config` directive (not needed with `@theme` block)

### 4. `app/[locale]/(admin)/layout.tsx` (FIXED)

**Nested HTML issue** — Removed duplicate `<html>/<body>` tags.

Before: Created nested `<html>` and `<body>` inside root layout's elements.
After: Uses `<div class="admin-layout">` wrapper only.

## Design Tokens Reference

| Token               | Light     | Dark      | Use                        |
| ------------------- | --------- | --------- | -------------------------- |
| `--color-chalk`     | `#F1F0EC` | `#1B1F23` | Base background            |
| `--color-surface`   | `#FFFFFF` | `#24292E` | Cards, panels              |
| `--color-graphite`  | `#22262B` | `#F1F0EC` | Primary text               |
| `--color-muted`     | `#6B6F73` | `#9A9EA2` | Secondary text             |
| `--color-moss`      | `#3B5D50` | `#5C8B79` | Primary accent (published) |
| `--color-ochre`     | `#C98A3C` | `#D9A05B` | Secondary accent (draft)   |
| `--color-clay-line` | `#D8D5CC` | `#33383D` | Hairline borders           |

## Typography

- **Display/Headings**: Fraunces (serif)
- **Body/UI**: Public Sans (humanist sans)
- **Metadata/Code**: IBM Plex Mono (monospace)

## Shape

- **Border radius**: 4px (sharp, print/card metaphor)
- **Depth**: No shadows — tonal layering via chalk/surface contrast
- **Borders**: 1px clay-line (warm gray, not stark black)

## Implementation Notes

1. **Tailwind CSS 4**: Uses `@theme` directive, not JS config file
2. **Ant Design**: Reskinned via `ConfigProvider` theme tokens (see `lib/theme/antd-theme.ts`)
3. **Dark mode**: `data-theme="dark"` attribute on `<html>` element
4. **Fonts**: Loaded via `next/font/google` in root layout
