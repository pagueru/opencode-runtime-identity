import { sanitizeLabel } from "./identity-format.ts";
import type { RuntimeIdentitySnapshot, RuntimeMessage } from "./runtime-types.ts";

interface RuntimeIdentityStoreEntry {
  snapshot: RuntimeIdentitySnapshot;
  updatedAt: number;
}

interface RuntimeIdentityStoreOptions {
  ttlMs?: number;
  maxEntries?: number;
  now?: () => number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 256;

export class RuntimeIdentityStore {
  readonly #bySession = new Map<string, RuntimeIdentityStoreEntry>();
  readonly #ttlMs: number;
  readonly #maxEntries: number;
  readonly #now: () => number;

  constructor(options: RuntimeIdentityStoreOptions = {}) {
    this.#ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.#maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.#now = options.now ?? Date.now;
  }

  captureFromMessages(messages: RuntimeMessage[]): void {
    this.#evictExpired();

    const lastUserMessage = [...messages].reverse().find((message) => message.info.role === "user");
    if (!lastUserMessage) return;

    const sessionID = sanitizeLabel(lastUserMessage.info.sessionID);
    if (!sessionID) return;

    const agent = sanitizeLabel(lastUserMessage.info.agent);
    const variant = sanitizeLabel(
      lastUserMessage.info.model?.variant ?? lastUserMessage.info.variant,
    );

    if (!agent && !variant) {
      this.#bySession.delete(sessionID);
      return;
    }

    this.#bySession.delete(sessionID);
    this.#bySession.set(sessionID, {
      snapshot: {
        ...(agent ? { agent } : {}),
        ...(variant ? { variant } : {}),
      },
      updatedAt: this.#now(),
    });
    this.#evictOverflow();
  }

  get(sessionID: string | undefined): RuntimeIdentitySnapshot | undefined {
    this.#evictExpired();

    const normalizedSessionID = sanitizeLabel(sessionID);
    if (!normalizedSessionID) return undefined;

    return this.#bySession.get(normalizedSessionID)?.snapshot;
  }

  size(): number {
    this.#evictExpired();
    return this.#bySession.size;
  }

  #evictExpired(): void {
    if (this.#ttlMs <= 0) {
      this.#bySession.clear();
      return;
    }

    const expiresBefore = this.#now() - this.#ttlMs;
    for (const [sessionID, entry] of this.#bySession) {
      if (entry.updatedAt < expiresBefore) this.#bySession.delete(sessionID);
    }
  }

  #evictOverflow(): void {
    while (this.#bySession.size > this.#maxEntries) {
      const oldestSessionID = this.#bySession.keys().next().value;
      if (!oldestSessionID) return;
      this.#bySession.delete(oldestSessionID);
    }
  }
}
