import { sanitizeLabel } from "./identity-format.ts";
import type { AttributionMessageInfo, RuntimeMessage } from "./runtime-types.ts";

function describeAssistantModel(info: AttributionMessageInfo): string {
  const providerID = sanitizeLabel(info.providerID ?? info.model?.providerID);
  const modelID = sanitizeLabel(info.modelID ?? info.model?.modelID);
  const variant = sanitizeLabel(info.variant ?? info.model?.variant);

  const base = providerID && modelID
    ? `${providerID}/${modelID}`
    : modelID ?? providerID ?? "unknown model";

  return variant ? `${base} (${variant})` : base;
}

export function formatAttribution(messages: RuntimeMessage[]): string {
  const assistantMessages = messages.filter(
    (message): message is RuntimeMessage & { info: AttributionMessageInfo } =>
      message.info.role === "assistant",
  );

  if (assistantMessages.length === 0) return "No assistant messages found in this session.";

  return assistantMessages
    .map((message, index) => {
      const agent = sanitizeLabel(message.info.agent) ?? "unknown agent";
      const messageID = sanitizeLabel(message.info.id) ?? `assistant-${index + 1}`;
      return `${index + 1}. ${messageID}: agent=${JSON.stringify(agent)}, model=${JSON.stringify(describeAssistantModel(message.info))}`;
    })
    .join("\n");
}
