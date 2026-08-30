# Agent Context — Tessera

This repository uses [spec-kit](https://github.com/github/spec-kit) for spec-driven
development. Before writing or modifying any code:

1. Read `.specify/memory/constitution.md` — the non-negotiable rules for this project.
2. Read `DESIGN.md` — the single authoritative visual specification.
3. Read the active feature's `spec.md`, `plan.md`, and `tasks.md` under
   `.specify/specs/001-tessera-mvp/`.
4. Work through `tasks.md` in order, top to bottom. Each task states its exact file path,
   exact acceptance check, and whether it's a test-writing task (write it, confirm it fails)
   or an implementation task (make the preceding test pass). Do not skip ahead or implement
   before the corresponding test exists — Constitution Article II is non-negotiable.
5. Never introduce a color, font, spacing value, feature flag, or translation string that
   doesn't already exist in `styles/tokens.scss`, `lib/feature-flags.ts`, or
   `locales/*/common.json` respectively (Constitution Article V/X) — add it to the single
   source first, then reference it.

If you are Claude Code specifically: this repo was scaffolded with the standard `.specify/`
structure (`specify init` output). Run `specify check` to confirm your local toolchain, and
use the slash commands (`/speckit.plan`, `/speckit.tasks`, `/speckit.implement`, etc.) or the
skills-based equivalent under `.claude/skills/` if you've run `specify init --integration
claude --integration-options="--skills"` locally — this scaffold ships the underlying
`.specify/` files either way; the agent-specific command wiring is generated locally by the
`specify` CLI itself and isn't duplicated in this download.

<!-- update-agent-context.sh appends per-feature Technical Context summaries below this line -->
