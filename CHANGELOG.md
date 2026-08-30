# Changelog

All notable changes to Tessera will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Tessera is under active development. This changelog tracks the evolution from a working
mini CMS into a full-featured headless content platform.

---

## [Unreleased]

### Added

- GraphQL API with introspection, rate limiting (20 req/min), and depth limiting (8 levels)
- Admin console with session-gated dashboard
- Content CRUD for projects, posts, and testimonials
- User management with invite-based onboarding (Admin, Editor, Viewer roles)
- Bilingual support (English/Arabic) with RTL-aware layouts
- Dual themes (light/dark) persisted per user
- AI draft assist via OpenRouter (feature-flagged, dev-only)
- Public content catalog with locale-aware rendering
- Custom GraphQL landing page (no CDN dependency)
- Content Security Policy with Apollo Sandbox support
- Prisma ORM with PostgreSQL (Neon)
- Better Auth with email/password and GitHub OAuth
- Vitest unit/integration tests
- Playwright e2e tests (4 locale×theme combinations)
- axe-core accessibility testing
- Design token audit (no raw hex or Ant Design defaults)
- Storybook component gallery
- GitHub Actions CI (typecheck, lint, test, e2e, Lighthouse, schema-diff)

### Known Limitations

- No rich text editor (plain text fields only)
- No media/image uploads
- No content scheduling or draft workflows
- No multi-tenant organization support
- No webhooks or integrations
- No REST API (GraphQL only)
- No content versioning or audit log
- No plugin system for custom content types

---

## Roadmap

Features planned for upcoming releases as Tessera evolves from mini CMS to full platform:

### Phase 1 — Content Polish

- [ ] Rich text editor for content fields
- [ ] Media/image uploads with CDN storage
- [ ] Content scheduling (publish at date/time)
- [ ] Draft workflows (draft → review → published)

### Phase 2 — Platform Features

- [ ] Multi-tenant organization support
- [ ] Webhook integrations (Zapier, Slack, etc.)
- [ ] REST API alongside GraphQL
- [ ] Content versioning and audit log

### Phase 3 — Extensibility

- [ ] Plugin system for custom content types
- [ ] Custom fields and schemas
- [ ] API rate limiting per tenant
- [ ] Role-based content permissions (per content type)

---

_This changelog will be updated as features ship. Each release will include a version number,
date, and categorized list of changes (Added, Changed, Deprecated, Removed, Fixed, Security)._
