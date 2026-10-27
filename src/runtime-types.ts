/** Structural types kept deliberately small to isolate OpenCode SDK churn. */
export interface RuntimeModel {
  id?: string;
  providerID?: string;
  name?: string;
}

export interface RuntimeIdentitySnapshot {
  agent?: string;
  variant?: string;
}

export interface RuntimeMessageInfo {
  role?: string;
  id?: string;
  sessionID?: string;
  agent?: string;
  variant?: string;
  model?: {
    providerID?: string;
    modelID?: string;
    variant?: string;
  };
  providerID?: string;
  modelID?: string;
}

export interface RuntimeMessage {
  info: RuntimeMessageInfo;
  parts?: unknown[];
}

export interface AttributionMessageInfo extends RuntimeMessageInfo {
  role: "assistant";
}
