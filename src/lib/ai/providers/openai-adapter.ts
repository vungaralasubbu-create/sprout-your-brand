/**
 * OpenAI Provider Adapter (via Lovable AI Gateway).
 * Handles chat, streaming, embeddings, images, tools, structured output.
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
  embedding: true,
  image: true,
  toolCalling: true,
  structuredOutput: true,
  maxContextTokens: 200_000,
  defaultChatModel: "openai/gpt-5.4-mini",
  defaultEmbedModel: "openai/text-embedding-3-small",
  defaultImageModel: "openai/gpt-image-1",
};

const REASONING_MODELS = /^openai\/(gpt-5(\.[0-9]+)?(-[a-z]+)?|o[134])/;

function shapeBody(req: ChatRequest, forceReasoningNone = false) {
  const body: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
  };
  // Reasoning models reject temperature / max_tokens; use max_completion_tokens.
  const isReasoning = REASONING_MODELS.test(req.model);
  if (!isReasoning) {
    if (req.temperature != null) body.temperature = req.temperature;
    if (req.maxTokens != null) body.max_tokens = req.maxTokens;
  } else {
    if (req.maxTokens != null) body.max_completion_tokens = req.maxTokens;
    if (forceReasoningNone || /gpt-5\.6/.test(req.model)) {
      body.reasoning_effort = "none";
    }
  }
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

export class OpenAIAdapter implements ProviderAdapter {
  readonly id = "openai" as const;
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
      } catch {
        /* ignore keep-alive */
      }
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
        quality: req.quality ?? "low",
      },
      signal: req.signal,
    });
    return {
      images: (raw.data ?? []).map((d: any) => ({ b64: d.b64_json, url: d.url })),
    };
  }

  async ping(): Promise<number> {
    const t0 = Date.now();
    try {
      await this.client.call({
        path: "/chat/completions",
        body: {
          model: CAPS.defaultChatModel,
          messages: [{ role: "user", content: "ping" }],
          max_completion_tokens: 5,
          reasoning_effort: "none",
        },
        timeoutMs: 8000,
        maxRetries: 0,
      });
      return Date.now() - t0;
    } catch (e) {
      if (e instanceof GatewayError) throw e;
      throw new GatewayError(String(e), 0, "network", true);
    }
  }
}

export function mapOpenAIChat(raw: any): ChatResponse {
  const choice = raw?.choices?.[0] ?? {};
  const msg = choice.message ?? {};
  const toolCalls = (msg.tool_calls ?? []).map((tc: any) => ({
    name: tc.function?.name,
    arguments: safeJson(tc.function?.arguments),
  }));
  let structured: unknown;
  if (msg.content && msg.content.startsWith("{")) {
    try { structured = JSON.parse(msg.content); } catch { /* not JSON */ }
  }
  return {
    content: msg.content ?? "",
    toolCalls: toolCalls.length ? toolCalls : undefined,
    structured,
    usage: {
      promptTokens: raw.usage?.prompt_tokens ?? 0,
      completionTokens: raw.usage?.completion_tokens ?? 0,
    },
    finishReason: choice.finish_reason ?? "stop",
    raw,
  };
}

function safeJson(s: unknown): Record<string, unknown> {
  if (typeof s !== "string") return {};
  try { return JSON.parse(s); } catch { return {}; }
}
