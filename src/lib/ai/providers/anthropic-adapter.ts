/**
 * Anthropic (Claude) Provider Adapter — calls the native Anthropic
 * `/messages` API directly (no Lovable AI gateway).
 *
 * The Anthropic API is not OpenAI-compatible; this adapter maps the
 * unified ChatRequest to Anthropic's request shape and normalizes the
 * response back to our ChatResponse contract via `mapOpenAIChat`.
 *
 * Embeddings and images are unsupported by Anthropic; those calls throw
 * `capability_missing` and the smart router falls over to OpenAI / Google.
 */

import { GatewayClient, GatewayError } from "./base-adapter";
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
  defaultChatModel: "claude-3-5-sonnet-latest",
};

function nativeModel(id: string): string {
  return id.replace(/^anthropic\//, "");
}

function splitSystemAndMessages(req: ChatRequest) {
  const system = req.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n") || undefined;
  const messages = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
  return { system, messages };
}

function shapeBody(req: ChatRequest) {
  const { system, messages } = splitSystemAndMessages(req);
  const body: Record<string, unknown> = {
    model: nativeModel(req.model),
    max_tokens: req.maxTokens ?? 1024,
    messages,
  };
  if (system) body.system = system;
  if (req.temperature != null) body.temperature = req.temperature;
  if (req.tools?.length) {
    body.tools = req.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }
  return body;
}

function mapAnthropicResponse(raw: any): ChatResponse {
  const blocks = Array.isArray(raw?.content) ? raw.content : [];
  const text = blocks
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text ?? "")
    .join("");
  const toolUses = blocks
    .filter((b: any) => b.type === "tool_use")
    .map((b: any) => ({ name: b.name, arguments: (b.input as Record<string, unknown>) ?? {} }));
  return {
    content: text,
    toolCalls: toolUses.length ? toolUses : undefined,
    usage: {
      promptTokens: raw?.usage?.input_tokens ?? 0,
      completionTokens: raw?.usage?.output_tokens ?? 0,
    },
    finishReason: raw?.stop_reason ?? "stop",
    raw,
  };
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
      path: "/messages",
      body: shapeBody(req),
      signal: req.signal,
    });
    return mapAnthropicResponse(raw);
  }

  async *stream(req: ChatRequest): AsyncIterable<StreamChunk> {
    for await (const payload of this.client.stream({
      path: "/messages",
      body: shapeBody(req),
      signal: req.signal,
    })) {
      try {
        const parsed = JSON.parse(payload);
        if (parsed?.type === "content_block_delta") {
          const delta = parsed?.delta?.text ?? "";
          if (delta) yield { delta, done: false };
        }
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
      path: "/messages",
      body: {
        model: CAPS.defaultChatModel,
        max_tokens: 5,
        messages: [{ role: "user", content: "ping" }],
      },
      timeoutMs: 8000,
      maxRetries: 0,
    });
    return Date.now() - t0;
  }
}
