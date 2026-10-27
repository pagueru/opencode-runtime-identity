# Agent Instructions

Read `PROJECT_CONTEXT.md` before editing this repository.

## Required workflow

1. Preserve the single-system-instruction architecture unless current OpenCode source proves it is no longer appropriate.
2. Validate hook signatures and execution order before upgrading OpenCode dependencies.
3. Run `npm run validate` after changes.
4. Add or update tests for every behavior change.
5. Keep `THIRD_PARTY_NOTICES.md` when redistributing or publishing.

Do not add per-turn provider catalog calls or synthetic user-message identity parts without documenting a concrete compatibility reason.
