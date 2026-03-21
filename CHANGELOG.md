# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-21

### Added
- `capture` command — capture live API responses as JSON fixtures
- `capture --allow-error` — capture non-2xx responses (404, 500, etc.)
- `capture --env` — resolve URLs using environment config
- Config-level `auth` support (Bearer, API Key) — no need to pass tokens every time
- `types` command — generate JSDoc or TypeScript types from fixtures
- Deep recursive type generation — nested objects become named interfaces
- `list` command with `--json` output
- `diff` command — detect API drift (added/removed/changed fields)
- `diff --fail-on-drift` — CI-friendly exit code on drift
- `diff --json` — machine-readable JSON output
- `sync` command — re-capture all fixtures from original URLs
- `sync --dry-run` — preview what would change
- `import` command — generate fixtures from OpenAPI specs (JSON)
- `mock` command — generate mock data variants from existing fixtures
- `mock --vary` — control which fields get randomized
- `delete` command — remove fixtures and all associated generated files
- MSW handler generation (`--msw` flag on capture/import/mock)
- Programmatic API — all core functions exported for library usage
- OpenAPI `$ref` resolution with cycle detection
