import type { GeneratedBatch } from "./schema";
import { AnthropicProvider } from "./anthropic";

export interface StructuredCompletionInput {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface StructuredCompletionResult {
  data: GeneratedBatch;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Provider abstraction so the generation pipeline (src/lib/ai/generate.ts)
 * never talks to a vendor SDK directly. To add OpenAI/Gemini/etc:
 *   1. Implement this interface (see anthropic.ts for the reference shape).
 *   2. Register it in `getAIProvider()` below, keyed by AI_PROVIDER env var.
 * Nothing outside this file and anthropic.ts needs to change.
 */
export interface AIProvider {
  readonly name: string;
  generateStructured(input: StructuredCompletionInput): Promise<StructuredCompletionResult>;
}

let cachedProvider: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  switch (providerName) {
    // To add another vendor (OpenAI, Gemini, ...), implement AIProvider in a
    // sibling file and add a case here — nothing else in the app changes.
    case "anthropic":
      cachedProvider = new AnthropicProvider();
      return cachedProvider;
    default:
      throw new Error(`Unknown AI_PROVIDER "${providerName}". Supported: anthropic`);
  }
}
