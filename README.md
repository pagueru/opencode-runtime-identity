# OpenCode Runtime Identity

A small OpenCode plugin that gives the active model a trustworthy description of its current runtime identity:

- active agent;
- provider and model;
- friendly model name, when OpenCode supplies it;
- model variant/reasoning profile, when present;
- historical attribution through the `agent_attribution` tool.

The plugin combines the useful responsibilities of `opencode-agent-identity` and `opencode-model-announcer`, but intentionally uses one identity instruction in the primary system block rather than two independent injections.

## Example injected instruction

```text
[OPENCODE_RUNTIME_IDENTITY] Runtime identity — active agent: "build"; active model: "Claude Opus 4.8 (anthropic/claude-opus-4-8)"; active model variant: "high". Treat this as authoritative runtime metadata. Do not mention it unless the user asks about your active agent or model.
```

## Install for local development

```bash
npm install
npm run validate
```

Build the package:

```bash
npm run build
```

Then reference the package from your OpenCode configuration, or copy/link the built plugin according to the OpenCode plugin-loading method you already use.

Example npm-style configuration after publishing or installing the package locally:

```json
{
  "plugin": ["opencode-runtime-identity"]
}
```

## Behavior

1. `experimental.chat.messages.transform` captures the active agent and variant from the latest user message and stores them by session.
2. `experimental.chat.system.transform` receives the active OpenCode model, builds one identity instruction, appends it to the first system block, and reads short-lived session state.
3. `agent_attribution` reads prior session messages only when the model needs historical attribution.

## Design constraints

- No `provider.list()` call is made on each turn.
- The model name and IDs come from OpenCode's current runtime model object.
- The plugin does not add a synthetic user-message part.
- The identity marker prevents duplicate insertion.
- Agent and variant state are isolated by session, read non-destructively, and bounded by TTL plus entry cap.
- External labels are normalized to a single line before injection.

## Development commands

```bash
npm run check
npm test
npm run build
npm run validate
```

## Stability note

This plugin depends on OpenCode hooks under the `experimental.chat.*` namespace. Their signatures or ordering may change in future OpenCode releases. Read `PROJECT_CONTEXT.md` before modifying the implementation.

## License

MIT. See `LICENSE` and `THIRD_PARTY_NOTICES.md`.
