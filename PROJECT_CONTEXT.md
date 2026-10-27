# Project Context — OpenCode Runtime Identity

## Purpose

This document is the handoff for the next coding agent. Read it before changing the plugin.

The project merges the intent of two upstream plugins:

1. `gotgenes/opencode-agent-identity`: informs the model which OpenCode agent is active and provides historical attribution.
2. `ramarivera/opencode-model-announcer`: informs the model which provider/model is active.

The merged project is not a line-by-line concatenation. It keeps the stronger session-isolation and attribution ideas from the first project, while replacing the second project's per-turn provider lookup and synthetic user-message injection with the model object already supplied by OpenCode's system-transform hook.

## Upstream behavior

| Upstream | Runtime approach | Kept or changed here |
| -------- | ---------------- | -------------------- |
| `gotgenes/opencode-agent-identity` | Captures `info.agent` from the latest user message in `experimental.chat.messages.transform`, stores it by `sessionID`, injects via `experimental.chat.system.transform`, and exposes attribution as a tool. | Kept: session bridge and tool. Changed: injection combined into one instruction. |
| `ramarivera/opencode-model-announcer` | Reads provider/model from the latest user message, calls `client.provider.list()` for display names, then prepends a synthetic user-message part marked `CURRENT_MODEL_ANNOUNCEMENT`. | Replaces provider lookup and synthetic user-message injection with `input.model` from `experimental.chat.system.transform`. |

## Current architecture

```text
experimental.chat.messages.transform
└── find latest user message
    ├── capture info.agent
    ├── capture model.variant (or info.variant fallback)
    └── store by sessionID

experimental.chat.system.transform
├── receive sessionID and active model from OpenCode
├── read captured agent/variant for that session
├── build one runtime identity instruction
└── append it to output.system[0]

agent_attribution tool
└── load current session messages on demand
    └── list agent + provider/model + variant for assistant messages
```

## Important decisions

### 1. One system instruction, not two injection mechanisms

Do not reintroduce both a system-prompt instruction and a synthetic user-message part. A single source of truth is easier for the model to interpret and avoids duplicated context.

### 2. Append to `output.system[0]`

Do not call `output.system.push(identity)` unless OpenCode's backend behavior has been revalidated. Some providers treat multiple system messages differently or reject them. The helper `injectIntoPrimarySystem` deliberately appends to the first block.

### 3. Use `input.model` from `experimental.chat.system.transform`

Do not call `client.provider.list()` every turn merely to resolve the current model. OpenCode already passes the runtime model to the system hook. This removes an async lookup, avoids cache complexity, and prevents disagreement between the selected model and a provider catalog lookup.

### 4. Keep short-lived state per session

The message hook has agent/variant context; the system hook has the authoritative model. `RuntimeIdentityStore` bridges the two hooks using `sessionID`. Reads are non-destructive so retries, replays, or repeated system transforms for the same logical turn keep the captured agent. TTL and entry cap remove abandoned session state.

### 5. Keep historical attribution on demand

Do not inject attribution tags into every previous message. The `agent_attribution` tool exists so the model can inspect authorship only when needed, without recurring prompt cost or identity confusion.

### 6. Treat hook data as untrusted text

Agent/model labels are normalized to one line and length-limited. Keep this protection if the instruction wording changes.

## File map

- `src/index.ts` — package entry point; exports only the OpenCode plugin.
- `src/plugin.ts` — hook registration and attribution tool wiring.
- `src/runtime-identity-store.ts` — session-scoped transient state.
- `src/identity-format.ts` — label sanitation, identity formatting, and system-block injection.
- `src/agent-attribution.ts` — formatting for historical assistant attribution.
- `src/runtime-types.ts` — narrow structural types that reduce coupling to SDK type churn.
- `test/` — dependency-light tests runnable with Node's native test runner.
- `THIRD_PARTY_NOTICES.md` — upstream acknowledgements and MIT license notices.

## Expected runtime identity

Given:

```text
agent = build
providerID = anthropic
model.id = claude-opus-4-8
model.name = Claude Opus 4.8
variant = high
```

The instruction should contain:

```text
[OPENCODE_RUNTIME_IDENTITY] Runtime identity — active agent: "build"; active model: "Claude Opus 4.8 (anthropic/claude-opus-4-8)"; active model variant: "high".
```

The wording after the facts may evolve, but the marker must stay stable unless migration logic is added.

## Validation checklist

Before committing a change:

```bash
npm install
npm run validate
```

At minimum, preserve tests for:

- last-user-message selection;
- session isolation;
- one-time state consumption;
- friendly model name plus canonical provider/model ID;
- identifier fallback when no friendly name exists;
- variant propagation;
- insertion into the first system block;
- duplicate prevention;
- historical attribution formatting;
- missing assistant history.

Add integration tests against the latest OpenCode package whenever hook types or execution order change.

## Known risks and open work

1. **Experimental API risk:** `experimental.chat.messages.transform` and `experimental.chat.system.transform` can change without normal semver guarantees.
2. **Ordering risk:** this design assumes the message transform can capture state before the system transform consumes it for the same request. Verify this against OpenCode whenever upgrading.
3. **SDK shape drift:** OpenCode has historically exposed some fields at runtime before the generated SDK types included them. Keep structural types narrow and update only with evidence from current runtime/source.
4. **Multiple plugin ordering:** another plugin may rewrite the primary system block after this plugin runs. Test with the user's actual plugin list if identity disappears.
5. **Package publication:** package name availability and npm metadata have not been finalized. Replace repository/homepage fields before publishing.
6. **Lock file:** no lock file is committed in this handoff. Generate one using the package manager selected for the repository.

## Suggested next steps

1. Install dependencies and run the full validation command in a network-enabled environment.
2. Test inside the user's current OpenCode version with at least two agents, two providers, and two simultaneous sessions.
3. Confirm the exact configuration entry for the user's preferred installation mode (npm package versus local plugin).
4. Add a small integration fixture that records the transformed system block.
5. Decide whether the package should be published, kept as a local plugin, or proposed upstream to one of the original projects.

## Non-goals

- Changing agent selection or model routing.
- Showing identity in the TUI.
- Persisting identity outside the current process.
- Calling external provider APIs.
- Injecting full attribution history on every turn.

## Attribution and licensing

The implementation was independently reorganized around the combined behavior, while drawing architectural inspiration from both MIT-licensed upstream projects. Keep `THIRD_PARTY_NOTICES.md` when redistributing the package.
