import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeIdentityPlugin } from "../src/plugin.ts";

test("system transform keeps captured agent across repeated reads for the same turn", async () => {
  const hooks = await RuntimeIdentityPlugin({
    client: {
      session: {
        async messages() {
          return { data: [] };
        },
      },
    },
  } as never);

  const messagesTransform = hooks["experimental.chat.messages.transform"];
  const systemTransform = hooks["experimental.chat.system.transform"];
  assert.ok(messagesTransform);
  assert.ok(systemTransform);

  await messagesTransform({} as never, {
    messages: [
      {
        info: {
          role: "user",
          sessionID: "s1",
          agent: "orchestrator",
          variant: "high",
        },
      },
    ],
  } as never);

  const first = { system: ["base"] };
  const second = { system: ["base"] };
  const input = {
    sessionID: "s1",
    model: { providerID: "openai", id: "gpt-5.5", name: "GPT 5.5" },
  };

  await systemTransform(input as never, first);
  await systemTransform(input as never, second);

  assert.match(first.system[0] ?? "", /active agent: "orchestrator"/);
  assert.match(second.system[0] ?? "", /active agent: "orchestrator"/);
  assert.match(second.system[0] ?? "", /active model variant: "high"/);
});
