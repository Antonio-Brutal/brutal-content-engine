import { AnthropicProvider } from "./anthropic";
import { LlmProvider } from "./provider";

class BrutalOsProvider implements LlmProvider {
  readonly name = "brutal-os";
  configError(): string | null {
    return "The Brutal OS provider is a placeholder until its API details are supplied (BRUTAL_OS_API_KEY / BRUTAL_OS_BASE_URL). Set LLM_PROVIDER=anthropic for now.";
  }
  stream(): never {
    throw new Error(this.configError()!);
  }
}

const providers: Record<string, LlmProvider> = {
  anthropic: new AnthropicProvider(),
  "brutal-os": new BrutalOsProvider(),
};

export function getProvider(): LlmProvider {
  const name = process.env.LLM_PROVIDER || "anthropic";
  const p = providers[name];
  if (!p) throw new Error(`Unknown LLM_PROVIDER "${name}". Valid: ${Object.keys(providers).join(", ")}`);
  return p;
}

export * from "./provider";
