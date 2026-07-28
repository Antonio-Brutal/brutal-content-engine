// LLM provider adapter. Everything above this interface is provider-agnostic, so the
// planned port to Brutal OS is a config change (LLM_PROVIDER + its key), not a rewrite.

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type StreamResult = { text: string; tokensIn: number; tokensOut: number; model: string };

export interface LlmProvider {
  readonly name: string;
  /** Returns null when usable, otherwise a human-readable reason (used as a preflight before firing calls). */
  configError(): string | null;
  stream(opts: {
    system?: string;
    messages: ChatMessage[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
    onText?: (delta: string) => void;
    signal?: AbortSignal;
  }): Promise<StreamResult>;
}

export const DEFAULT_MODEL = process.env.LLM_MODEL || "claude-sonnet-5";
export const LONGFORM_MODEL = process.env.LLM_LONGFORM_MODEL || DEFAULT_MODEL;
