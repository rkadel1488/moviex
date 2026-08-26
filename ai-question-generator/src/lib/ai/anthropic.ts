import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, StructuredCompletionInput, StructuredCompletionResult } from "./provider";
import { GENERATED_BATCH_JSON_SCHEMA, generatedBatchSchema } from "./schema";

const TOOL_NAME = "emit_questions";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    this.client = new Anthropic({ apiKey });
    this.model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
  }

  async generateStructured(input: StructuredCompletionInput): Promise<StructuredCompletionResult> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: input.maxTokens ?? 8000,
      system: input.system,
      messages: [{ role: "user", content: input.prompt }],
      tools: [
        {
          name: TOOL_NAME,
          description: "Emit the generated batch of assessment questions in the required structured shape.",
          input_schema: GENERATED_BATCH_JSON_SCHEMA as unknown as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use" && block.name === TOOL_NAME,
    );
    if (!toolUse) {
      throw new Error("Model did not return a structured question batch");
    }

    const parsed = generatedBatchSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw new Error(`Model output failed schema validation: ${parsed.error.message}`);
    }

    return {
      data: parsed.data,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }
}
