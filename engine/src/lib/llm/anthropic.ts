import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage, DEFAULT_MODEL, LlmProvider, StreamResult } from "./provider";

export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic";

  configError(): string | null {
    if (!process.env.ANTHROPIC_API_KEY) {
      return "ANTHROPIC_API_KEY is missing. Add it to engine/.env.local and restart the dev server.";
    }
    return null;
  }

  async stream(opts: {
    system?: string;
    messages: ChatMessage[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
    onText?: (delta: string) => void;
    signal?: AbortSignal;
  }): Promise<StreamResult> {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = opts.model || DEFAULT_MODEL;
    // temperature intentionally not sent, deprecated on Claude 5 models
    const stream = client.messages.stream(
      {
        model,
        max_tokens: opts.maxTokens ?? 16000,
        system: opts.system,
        messages: opts.messages,
      },
      { signal: opts.signal }
    );
    if (opts.onText) stream.on("text", opts.onText);
    const final = await stream.finalMessage();
    const text = final.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return {
      text,
      tokensIn: final.usage.input_tokens,
      tokensOut: final.usage.output_tokens,
      model,
    };
  }
}
