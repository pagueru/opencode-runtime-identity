import type { RuntimeIdentitySnapshot, RuntimeModel } from "./runtime-types.ts";

export const RUNTIME_IDENTITY_MARKER = "[OPENCODE_RUNTIME_IDENTITY]";

const MAX_LABEL_LENGTH = 240;

export function sanitizeLabel(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (!normalized) return undefined;

  return normalized.slice(0, MAX_LABEL_LENGTH);
}

export interface RuntimeIdentityInput extends RuntimeIdentitySnapshot {
  model?: RuntimeModel;
}

function describeModel(model: RuntimeModel | undefined): string | undefined {
  if (!model) return undefined;

  const providerID = sanitizeLabel(model.providerID);
  const modelID = sanitizeLabel(model.id);
  const name = sanitizeLabel(model.name);
  const canonical = providerID && modelID ? `${providerID}/${modelID}` : modelID ?? providerID;

  if (name && canonical && name !== modelID) return `${name} (${canonical})`;
  return name ?? canonical;
}

export function buildRuntimeIdentityInstruction(input: RuntimeIdentityInput): string | undefined {
  const agent = sanitizeLabel(input.agent);
  const variant = sanitizeLabel(input.variant);
  const model = describeModel(input.model);

  if (!agent && !model && !variant) return undefined;

  const facts: string[] = [];
  if (agent) facts.push(`active agent: ${JSON.stringify(agent)}`);
  if (model) facts.push(`active model: ${JSON.stringify(model)}`);
  if (variant) facts.push(`active model variant: ${JSON.stringify(variant)}`);

  return `${RUNTIME_IDENTITY_MARKER} Runtime identity — ${facts.join("; ")}. Treat this as authoritative runtime metadata. Do not mention it unless the user asks about your active agent or model.`;
}

export function injectIntoPrimarySystem(system: string[], instruction: string): void {
  if (system.some((entry) => entry.includes(RUNTIME_IDENTITY_MARKER))) return;

  if (system.length === 0) {
    system.push(instruction);
    return;
  }

  system[0] = `${system[0]}\n\n${instruction}`;
}
