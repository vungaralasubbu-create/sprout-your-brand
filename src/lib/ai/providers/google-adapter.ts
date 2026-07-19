/**
 * Google Gemini Provider Adapter — routes through Lovable AI Gateway's
 * OpenAI-compatible endpoint (models prefixed `google/*`). Gemini supports
 * chat, streaming, embeddings, tools, and structured output. Image
 * generation uses `google/gemini-3-pro-image` via the same images endpoint.
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
  embedding: true,
  image: true,
  toolCalling: true,
  structuredOutput: true,
  maxContextTokens: 1_000_000,
  defaultChatModel: "google/gemini-3.5-flash",
  defaultEmbedModel: "google/gemini-embedding-001",
  defaultImageModel: "google/gemini-3-pro-image",
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
    body.response_format = {
      type: "json_schema",
      json_schema: { name: "response", strict: true, schema: req.responseSchema },
    };
  }
  return body;
}

export class GoogleAdapter implements ProviderAdapter {
  readonly id = "google" as const;
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

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    const raw = await this.client.call<any>({
      path: "/embeddings",
      body: { model: req.model, input: req.input },
      signal: req.signal,
    });
    return {
      embeddings: raw.data.map((d: any) => d.embedding),
      usage: { promptTokens: raw.usage?.prompt_tokens ?? 0 },
    };
  }

  async image(req: ImageRequest): Promise<ImageResponse> {
    const raw = await this.client.call<any>({
      path: "/images/generations",
      body: {
        model: req.model,
        prompt: req.prompt,
        size: req.size ?? "1024x1024",
      },
      signal: req.signal,
    });
    return { images: (raw.data ?? []).map((d: any) => ({ b64: d.b64_json, url: d.url })) };
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
