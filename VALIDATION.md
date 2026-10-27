# Validation Record

Validation performed on 2026-06-10:

- 9/9 dependency-light unit tests passed.
- TypeScript `--noEmit` validation passed.
- Production build completed and generated `dist/`.
- A runtime smoke test passed for both identity injection and `agent_attribution`.

## Validation limitation

The environment used to prepare this handoff could not download npm packages. Type checking and the smoke test therefore used a temporary, minimal local declaration/runtime stub matching only the OpenCode plugin surface consumed by this project. Those temporary files are not included in the ZIP.

The next agent must run the following in a network-enabled environment before treating the package as release-ready:

```bash
npm install
npm run validate
```

Then test the plugin inside the exact OpenCode version and plugin stack used by Raphael.
