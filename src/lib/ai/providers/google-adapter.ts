/**
 * Google Gemini Provider Adapter — calls Google's native
 * Generative Language API (`generativelanguage.googleapis.com/v1beta`)
 * directly. No Lovable AI gateway.
 *
 * The Gemini REST API is not OpenAI-compatible; this adapter maps the
 * unified ChatRequest to Gemini's `generateContent` shape and normalizes
 * responses back to our ChatResponse contract. Streaming uses
 * `streamGenerateContent?alt=sse`.
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
  image: false, // Gemini image generation uses a distinct API path/shape
  toolCalling: true,
  structuredOutput: true,
  maxContextTokens: 1_000_000,
  defaultChatModel: "gemini-1.5-flash",
  defaultEmbedModel: "text-embedding-004",
};

function nativeModel(id: string): string {
  return id.replace(/^google\//, "");
}

function toGeminiContents(req: ChatRequest) {
  const systemText = req.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const body: Record<string, unknown> = { contents };
  if (systemText) {
    body.systemInstruction = { parts: [{ text: systemText }] };
  }
  const genConfig: Record<string, unknown> = {};
  if (req.temperature != null) genConfig.temperature = req.temperature;
  if (req.maxTokens != null) genConfig.maxOutputTokens = req.maxTokens;
  if (req.responseSchema) {
    genConfig.responseMimeType = "application/json";
    genConfig.responseSchema = req.responseSchema;
  }
  if (Object.keys(genConfig).length) body.generationConfig = genConfig;
  if (req.tools?.length) {
    body.tools = [{
      functionDeclarations: req.tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    }];
  }
  return body;
}

function mapGeminiResponse(raw: any): ChatResponse {
  const candidate = raw?.candidates?.[0] ?? {};
  const parts = candidate?.content?.parts ?? [];
  const text = parts
    .filter((p: any) => typeof p.text === "string")
    .map((p: any) => p.text)
    .join("");
  const toolCalls = parts
    .filter((p: any) => p.functionCall)
    .map((p: any) => ({
      name: p.functionCall.name,
      arguments: (p.functionCall.args as Record<string, unknown>) ?? {},
    }));
  return {
    content: text,
    toolCalls: toolCalls.length ? toolCalls : undefined,
    usage: {
      promptTokens: raw?.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: raw?.usageMetadata?.candidatesTokenCount ?? 0,
    },
    finishReason: candidate?.finishReason ?? "STOP",
    raw,
  };
}

export class GoogleAdapter implements ProviderAdapter {
  readonly id = "google" as const;
  readonly capabilities = CAPS;
  private client: GatewayClient;

  constructor(init: AdapterInit) {
    this.client = new GatewayClient(init);
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const model = nativeModel(req.model);
    const raw = await this.client.call<any>({
      path: `/models/${encodeURIComponent(model)}:generateContent`,
      body: toGeminiContents(req),
      signal: req.signal,
    });
    return mapGeminiResponse(raw);
  }

  async *stream(req: ChatRequest): AsyncIterable<StreamChunk> {
    const model = nativeModel(req.model);
    for await (const payload of this.client.stream({
      path: `/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
      body: toGeminiContents(req),
      signal: req.signal,
    })) {
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
        if (delta) yield { delta, done: false };
      } catch { /* ignore */ }
    }
    yield { delta: "", done: true };
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = nativeModel(req.model);
    const inputs = Array.isArray(req.input) ? req.input : [req.input];
    // Native Gemini embeddings: one request per input via :embedContent
    const embeddings: number[][] = [];
    for (const text of inputs) {
      const raw = await this.client.call<any>({
        path: `/models/${encodeURIComponent(model)}:embedContent`,
        body: { content: { parts: [{ text }] } },
        signal: req.signal,
      });
      embeddings.push(raw?.embedding?.values ?? []);
    }
    return { embeddings, usage: { promptTokens: 0 } };
  }

  image(_req: ImageRequest): Promise<ImageResponse> {
    throw new GatewayError(
      "Google image generation uses a distinct API — configure a dedicated image provider adapter.",
      400,
      "bad_request",
      false,
    );
  }

  async ping(): Promise<number> {
    const t0 = Date.now();
    await this.client.call({
      path: `/models/${encodeURIComponent(CAPS.defaultChatModel)}:generateContent`,
      body: { contents: [{ role: "user", parts: [{ text: "ping" }] }], generationConfig: { maxOutputTokens: 5 } },
      timeoutMs: 8000,
      maxRetries: 0,
    });
    return Date.now() - t0;
  }
}
