import assert from "node:assert/strict";
import test from "node:test";
import { formatAttribution } from "../src/agent-attribution.ts";

test("formats historical assistant attribution", () => {
  const result = formatAttribution([
    { info: { role: "user", id: "u1" } },
    {
      info: {
        role: "assistant",
        id: "a1",
        agent: "build",
        providerID: "anthropic",
        modelID: "claude-opus-4-8",
        variant: "high",
      },
    },
  ]);

  assert.equal(
    result,
    '1. a1: agent="build", model="anthropic/claude-opus-4-8 (high)"',
  );
});

test("handles sessions with no assistant messages", () => {
  assert.equal(
    formatAttribution([{ info: { role: "user", id: "u1" } }]),
    "No assistant messages found in this session.",
  );
});

test("assistant without agent, provider, or model uses unknown agent and unknown model fallback", () => {
  const result = formatAttribution([
    { info: { role: "assistant", id: "a1" } },
  ]);

  assert.equal(
    result,
    '1. a1: agent="unknown agent", model="unknown model"',
  );
});
