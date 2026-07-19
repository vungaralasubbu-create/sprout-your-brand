/**
 * Anthropic (Claude) Provider Adapter — routes through Lovable AI Gateway's
 * OpenAI-compatible endpoint. Model IDs follow the `anthropic/*` prefix
 * (e.g. `anthropic/claude-sonnet-4`). Embeddings/images are unsupported by
 * Anthropic; those calls throw a clear "capability_missing" error and the
 * router falls over to OpenAI/Google.
 */

import { GatewayClient, GatewayError } from "./base-adapter";
import { mapOpenAIChat } from "./openai-adapter";
import type {
  AdapterInit,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ImageRequest,
  ImageResponse,
  ProviderAdapter,
  ProviderCapabilities,
  StreamChunk,
} from "./types";

const CAPS: ProviderCapabilities = {
  chat: true,
  streaming: true,
  embedding: false,
  image: false,
  toolCalling: true,
  structuredOutput: true,
  maxContextTokens: 200_000,
  defaultChatModel: "anthropic/claude-sonnet-4",
};

function shapeBody(req: ChatRequest) {
  const body: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
  };
  if (req.temperature != null) body.temperature = req.temperature;
  if (req.maxTokens != null) body.max_tokens = req.maxTokens;
  if (req.tools?.length) {
    body.tools = req.tools.map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
  }
  if (req.responseSchema) {
    // OpenRouter-style structured output for Claude
    body.response_format = {
      type: "json_schema",
      json_schema: { name: "response", strict: true, schema: req.responseSchema },
    };
  }
  return body;
}

export class AnthropicAdapter implements ProviderAdapter {
  readonly id = "anthropic" as const;
  readonly capabilities = CAPS;
  private client: GatewayClient;

  constructor(init: AdapterInit) {
    this.client = new GatewayClient(init);
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const raw = await this.client.call<any>({
      path: "/chat/completions",
      body: shapeBody(req),
      signal: req.signal,
    });
    return mapOpenAIChat(raw);
  }

  async *stream(req: ChatRequest): AsyncIterable<StreamChunk> {
    for await (const payload of this.client.stream({
      path: "/chat/completions",
      body: shapeBody(req),
      signal: req.signal,
    })) {
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content ?? "";
        if (delta) yield { delta, done: false };
      } catch { /* ignore */ }
    }
    yield { delta: "", done: true };
  }

  embed(_req: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new GatewayError("Anthropic does not support embeddings", 400, "bad_request", false);
  }

  image(_req: ImageRequest): Promise<ImageResponse> {
    throw new GatewayError("Anthropic does not support image generation", 400, "bad_request", false);
  }

  async ping(): Promise<number> {
    const t0 = Date.now();
    await this.client.call({
      path: "/chat/completions",
      body: {
        model: CAPS.defaultChatModel,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      },
      timeoutMs: 8000,
      maxRetries: 0,
    });
    return Date.now() - t0;
  }
}
