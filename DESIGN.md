# Tessera — Design System

### (formerly "DevGraph" — renamed, see §0)

## 0. Naming

**Tessera** replaces the working name "DevGraph." A tessera is the individual tile in a
mosaic — a small, structured piece that only shows its full meaning as part of the whole.
That's a precise description of what this product manages: individual pieces of content
(projects, posts, testimonials) that are independently structured (GraphQL schema = the
grid) but exist to compose a larger, coherent picture (a portfolio, a site). It's also short,
pronounceable, trademark-quiet in the dev-tool space, and doesn't collide with "graph,"
"CMS," or "content" the way most alternatives in this space do.

Tagline: **"Structured content, one piece at a time."**

## 1. Why this isn't the other two generic AI looks

PulseFeed already claimed the "oscilloscope / dark-terminal / dual-neon-accent" identity —
so Tessera needs its own visual territory, not a reskin. The three generic AI defaults to
actively avoid, per house standard:

- ❌ Warm cream + terracotta serif (the single most common "editorial AI" default)
- ❌ Near-black + one neon accent (already spoken for by PulseFeed anyway)
- ❌ Broadsheet hairline-rule newspaper layout

Tessera's actual reference point: **a natural-history specimen catalog / library index-card
system** — the physical object of a card catalog drawer, an accession card pinned to a
mounted specimen, a field-guide page. This gives content a sense of being _cataloged_, not
just _posted_ — which fits a platform whose entire job is structuring content into a schema.
It's tactile and specific rather than "generic editorial," and it has nothing in common with
PulseFeed's cold, live-data, oscilloscope register.

## 2. Design Tokens (single source of truth — `styles/tokens.scss`)

**Color — Light (default) theme**

| Token               | Hex       | Use                                                                                  |
| ------------------- | --------- | ------------------------------------------------------------------------------------ |
| `--color-chalk`     | `#F1F0EC` | Base background — a cool stone off-white, deliberately _not_ cream                   |
| `--color-surface`   | `#FFFFFF` | Cards, panels — pure white against the chalk base for a "card on a table" separation |
| `--color-graphite`  | `#22262B` | Primary text — near-black, warmed slightly, not pure `#000`                          |
| `--color-muted`     | `#686C70` | Secondary text, metadata, timestamps                                                 |
| `--color-moss`      | `#3B5D50` | Primary accent — published/confirmed state, primary actions                          |
| `--color-ochre`     | `#8E6530` | Secondary accent — draft/pending state, highlights                                   |
| `--color-clay-line` | `#D8D5CC` | Hairline borders, card edges — warm gray, not a stark black rule                     |

**Color — Dark theme** (a genuine second theme, not an inversion)

| Token               | Hex        | Use                                                                       |
| ------------------- | ---------- | ------------------------------------------------------------------------- |
| `--color-chalk`     | `#1B1F23`  | Base background — "reading room at night," not PulseFeed's blue-black Ink |
| `--color-surface`   | `#24292E`  | Cards, panels                                                             |
| `--color-graphite`  | `#F1F0EC`  | Primary text                                                              |
| `--color-muted`     | `#9A9E A2` | Secondary text                                                            |
| `--color-moss`      | `#4E7D6E`  | Primary accent, darkened for WCAG AA contrast with white text            |
| `--color-ochre`     | `#D9A05B`  | Secondary accent, lightened for dark-background contrast                  |
| `--color-clay-line` | `#33383D`  | Hairline borders                                                          |

Accent meaning is fixed across both themes (Constitution Article IX pattern, reused
deliberately as a cross-project convention): **Moss = confirmed/published/primary action.
Ochre = draft/pending/needs-attention.** Never swapped, never used decoratively.

**Typography**

- Display/headings: **Fraunces** — a contemporary editorial serif with real personality
  (ink-trap detailing, optical sizing) rather than a generic Playfair/Georgia default. Used
  for content titles and section headers only.
- Body/UI: **Public Sans** — humanist, open-source, government-designed (fittingly, given
  the government-sector case studies this platform will showcase), highly legible at small
  sizes for admin-console density.
- Metadata/schema/mono: **IBM Plex Mono** — used specifically for anything that is
  _structural_ rather than _content_: GraphQL field names, IDs, dates, status badges, the
  admin console's slug fields. This is the same "mono = data, not decoration" principle
  PulseFeed uses, applied here to schema/metadata instead of live numbers.

**Layout motif — the "catalog card"**
Every content item (project, post, testimonial) renders as a card with a small mono-font
"accession number" in the top-left corner (e.g. `PRJ-014`) — a deliberate, tactile reference
to a museum specimen tag or library card, not a generic dashboard tile. Admin list views use
a dense, card-catalog-drawer-style vertical list rather than a generic data table wherever
the content is browsable by a human (tables remain appropriate for genuinely tabular admin
data like the user/role list).

**Spacing & shape**

- Generous internal card padding, thin (`1px`) `--color-clay-line` borders — no drop shadows
  as the primary depth cue; depth comes from the chalk/surface contrast instead, keeping the
  system flat and print-like rather than glassy/SaaS-generic.
- Corner radius: a small, consistent `4px` — enough to soften, not enough to read as "rounded
  app UI." Sharper than PulseFeed's UI on purpose (print/card metaphor vs. glass/screen
  metaphor).

## 3. Component Vocabulary

- **Catalog Card** — the core content unit (see above): accession number, title (Fraunces),
  status badge (Moss/Ochre), metadata line (Plex Mono).
- **Status Badge** — small pill, Moss (published) or Ochre (draft), text label always present
  alongside color (never color-only, per accessibility baseline).
- **Drawer Nav** — the admin console's primary navigation reads as labeled catalog-drawer
  tabs (Projects / Posts / Testimonials / Users), not a generic sidebar icon list.
- **Schema Inspector** — the public GraphQL sandbox view is treated as a first-class,
  intentionally designed screen (mono-heavy, catalog-card-styled schema types), not the
  default unstyled Apollo Sandbox chrome.

## 4. Theming Implementation Notes

- `next-themes` (same library as PulseFeed, proven pattern) drives dark/light, OS-default +
  persisted override, no-flash-on-first-paint.
- Ant Design's admin-console instance is reskinned via its `ConfigProvider` `theme.token` API
  to consume these exact tokens (see `plan.md` §Technical Context for the rationale on using
  Ant Design at all) — Ant Design supplies interaction complexity (tables, forms, date
  pickers), Tessera's tokens supply 100% of the visual identity. No component ships with
  Ant Design's default blue theme visible anywhere.

## 5. Accessibility Baseline (unchanged bar from PulseFeed, restated so this file is self-contained)

WCAG 2.1 AA in both themes independently, both locales (English/Arabic) independently, never
color-only signal (every status badge carries a text label), visible focus states using the
Moss accent at 2px.
