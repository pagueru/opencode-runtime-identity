import { tool, type Plugin } from "@opencode-ai/plugin";
import { formatAttribution } from "./agent-attribution.ts";
import {
  buildRuntimeIdentityInstruction,
  injectIntoPrimarySystem,
} from "./identity-format.ts";
import { RuntimeIdentityStore } from "./runtime-identity-store.ts";
import type { RuntimeMessage, RuntimeModel } from "./runtime-types.ts";

interface SessionMessagesResponse {
  data?: RuntimeMessage[];
}

export const RuntimeIdentityPlugin: Plugin = async ({ client }) => {
  const store = new RuntimeIdentityStore();

  return {
    "experimental.chat.messages.transform": async (_input, output) => {
      store.captureFromMessages(output.messages as RuntimeMessage[]);
    },

    "experimental.chat.system.transform": async (input, output) => {
      const snapshot = store.get(input.sessionID);
      const instruction = buildRuntimeIdentityInstruction({
        ...(snapshot?.agent ? { agent: snapshot.agent } : {}),
        ...(snapshot?.variant ? { variant: snapshot.variant } : {}),
        model: input.model as RuntimeModel,
      });

      if (instruction) injectIntoPrimarySystem(output.system, instruction);
    },

    tool: {
      agent_attribution: tool({
        description:
          "List the agent, provider/model, and variant that produced each assistant message in the current session. Use only when attribution history is needed.",
        args: {},
        async execute(_args, context) {
          try {
            const response = (await client.session.messages({
              path: { id: context.sessionID },
            })) as SessionMessagesResponse;

            return formatAttribution(response.data ?? []);
          } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return `Unable to read session attribution: ${reason}`;
          }
        },
      }),
    },
  };
};
