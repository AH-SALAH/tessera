# Contributing to Tessera

Thanks for your interest in contributing to Tessera — a lightweight, bilingual content management system with a GraphQL API.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** — we use [Neon](https://neon.tech) for hosted, or any local Postgres instance
- **pnpm** or **npm** — the project uses npm

### Setup

```bash
# 1. Clone the repo
git clone <repo-url> && cd tessera

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, GITHUB_CLIENT_ID/SECRET

# 4. Generate Prisma client + run migrations
npx prisma generate
npx prisma migrate dev

# 5. Seed the admin user
npx tsx prisma/seed.ts

# 6. Start the dev server
npm run dev
# → http://localhost:3000
```

The admin seed creates a user with email `admin@tessera.local` and password `admin123`.

---

## Development Workflow

### Test-First (Non-Negotiable)

Tessera follows **test-first development** (Constitution Article II). The workflow is:

1. **Write the test** — define what the feature should do
2. **Confirm it fails** — red phase
3. **Implement the feature** — green phase
4. **Refactor** — clean up while keeping tests green

This applies to every module: resolvers, services, components, utilities. A mutation without an authorization test is not considered implemented.

### Running Tests

| Command            | What it runs                                            |
| ------------------ | ------------------------------------------------------- |
| `npm run test`     | Vitest unit/integration tests                           |
| `npm run test:e2e` | Playwright e2e (requires `npm run start` in background) |

### Test Structure

- **Unit/integration tests** live next to their source files (`*.test.ts`)
- **E2E tests** live in `tests/e2e/` and cover 4 locale×theme combinations
- **Accessibility tests** use `@axe-core/playwright` — serious/critical violations fail the build

---

## Project Conventions

### Architecture

- **Library-first, feature-first** — every capability is an isolated, independently testable module before it's wired into a route or page (Constitution Article I)
- **No business logic in resolvers or components** — resolvers and components call into a module and render its result
- **Server-side authority** — all authorization decisions are made server-side in the resolver layer, never on the client (Constitution Article VI)

### Design Tokens

- All visual values (colors, fonts, spacing, radii) are defined in `styles/tokens.scss`
- Never hardcode a color, font, or spacing value in a component
- If you need a new token, add it to `tokens.scss` first, then reference it everywhere else

### Feature Flags

- Any feature beyond the always-on MVP core ships behind a flag in `lib/feature-flags.ts`
- Flags default to off in production until deliberately enabled
- Never scatter `process.env.FOO === "true"` checks — always use the centralized flag module

### Localization

- Translation strings live in `locales/{locale}/common.json`
- Never hardcode UI text in component code — always use the translation function
- Both English and Arabic must work correctly, including RTL layout

### Component Guidelines

- Check `components/ui/` before building anything new — reuse existing primitives
- New primitives must be generic enough to be reused, not hard-coded to one call site
- Admin console uses Ant Design components reskinned with project tokens
- Public site uses custom components

---

## Code Quality

### Before Submitting a PR

1. **Typecheck** — `npm run typecheck` (must pass)
2. **Lint** — `npm run lint` (must pass)
3. **Tests** — `npm run test` (must pass)
4. **E2E** — `npm run test:e2e` (if touching user-facing flows)

### What We Check in Review

- No raw hex colors or Ant Design defaults leaking into components
- No hardcoded UI strings (use translations)
- Authorization tests for every mutation
- Tokens traceable to `styles/tokens.scss` and `DESIGN.md`
- Feature flags for new user-visible features

---

## Commit Messages

Follow conventional commits:

```
feat: add content scheduling API
fix: resolve date serialization in invitation table
test: add authorization matrix for deleteUser mutation
refactor: extract rate limiter into shared module
docs: update README with mini CMS positioning
```

---

## Architecture Overview

```
app/
  [locale]/
    (public)/        — public routes (catalog, schema inspector)
    (admin)/         — session-gated admin console
  api/
    auth/[...all]/   — Better Auth handler
    graphql/         — Apollo Server (schema-first, rate-limited)
components/
  ui/                — shared primitives
  admin/             — admin-only components
lib/
  auth/              — session helpers, RBAC
  graphql-schema/    — typeDefs, resolvers, auth guard
  ai-draft-assist/   — OpenRouter integration (feature-flagged)
  theme/             — design tokens, Ant Design theme builder
  content/           — content service (localized field resolution)
```

---

## Key Files

| File                                | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `lib/graphql-schema/typeDefs.ts`    | GraphQL schema (single source of truth) |
| `lib/graphql-schema/resolvers/*.ts` | Business logic per domain               |
| `lib/graphql-schema/auth-guard.ts`  | `requireRole()` authorization wrapper   |
| `lib/feature-flags.ts`              | Centralized feature flags               |
| `styles/tokens.scss`                | All design tokens                       |
| `locales/en/common.json`            | English translations                    |
| `locales/ar/common.json`            | Arabic translations                     |
| `.specify/memory/constitution.md`   | Non-negotiable project rules            |

---

## Questions?

Open an issue or reach out to the maintainers. We're happy to help you get started.
