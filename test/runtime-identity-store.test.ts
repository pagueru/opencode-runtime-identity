import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeIdentityStore } from "../src/runtime-identity-store.ts";

test("captures the last user message and keeps state for repeated reads", () => {
  const store = new RuntimeIdentityStore();
  store.captureFromMessages([
    { info: { role: "user", sessionID: "s1", agent: "plan" } },
    { info: { role: "assistant", sessionID: "s1", agent: "plan" } },
    {
      info: {
        role: "user",
        sessionID: "s1",
        agent: "build",
        model: { variant: "high" },
      },
    },
  ]);

  assert.deepEqual(store.get("s1"), { agent: "build", variant: "high" });
  assert.deepEqual(store.get("s1"), { agent: "build", variant: "high" });
  assert.equal(store.size(), 1);
});

test("keeps concurrent sessions isolated", () => {
  const store = new RuntimeIdentityStore();
  store.captureFromMessages([{ info: { role: "user", sessionID: "alpha", agent: "build" } }]);
  store.captureFromMessages([{ info: { role: "user", sessionID: "beta", agent: "review" } }]);

  assert.deepEqual(store.get("beta"), { agent: "review" });
  assert.deepEqual(store.get("alpha"), { agent: "build" });
});

test("user message without agent or variant clears previous state for that session", () => {
  const store = new RuntimeIdentityStore();
  store.captureFromMessages([{ info: { role: "user", sessionID: "s1", agent: "build", variant: "high" } }]);

  assert.deepEqual(store.get("s1"), { agent: "build", variant: "high" });

  // Define estado novamente e limpa com uma mensagem vazia
  store.captureFromMessages([{ info: { role: "user", sessionID: "s1", agent: "build", variant: "high" } }]);
  store.captureFromMessages([{ info: { role: "user", sessionID: "s1" } }]);

  assert.equal(store.get("s1"), undefined);
  assert.equal(store.size(), 0);
});

test("expires stale session state after ttl", () => {
  let now = 1_000;
  const store = new RuntimeIdentityStore({ ttlMs: 100, now: () => now });

  store.captureFromMessages([{ info: { role: "user", sessionID: "s1", agent: "build" } }]);
  assert.deepEqual(store.get("s1"), { agent: "build" });

  now = 1_101;
  assert.equal(store.get("s1"), undefined);
  assert.equal(store.size(), 0);
});

test("evicts oldest session when max entry count is exceeded", () => {
  const store = new RuntimeIdentityStore({ maxEntries: 2 });

  store.captureFromMessages([{ info: { role: "user", sessionID: "s1", agent: "first" } }]);
  store.captureFromMessages([{ info: { role: "user", sessionID: "s2", agent: "second" } }]);
  store.captureFromMessages([{ info: { role: "user", sessionID: "s3", agent: "third" } }]);

  assert.equal(store.get("s1"), undefined);
  assert.deepEqual(store.get("s2"), { agent: "second" });
  assert.deepEqual(store.get("s3"), { agent: "third" });
  assert.equal(store.size(), 2);
});
