/**
 * Unified Provider Adapter Interface
 * -----------------------------------
 * All AI providers implement this shape. Behind the scenes every adapter
 * routes through the Lovable AI Gateway (single upstream, unified auth),
 * but each adapter owns provider-specific model IDs, parameter shaping,
 * and optimization hints.
 */

export type ProviderId = "openai" | "anthropic" | "google";

export type TaskKind =
  | "chat"
  | "streaming"
  | "embedding"
  | "image"
  | "tool_call"
  | "structured";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON schema
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDef[];
  responseSchema?: Record<string, unknown>; // structured output
  signal?: AbortSignal;
}

export interface ChatResponse {
  content: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  structured?: unknown;
  usage: { promptTokens: number; completionTokens: number };
  finishReason: string;
  raw?: unknown;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  signal?: AbortSignal;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage: { promptTokens: number };
}

export interface ImageRequest {
  model: string;
  prompt: string;
  size?: string;
  quality?: "low" | "medium" | "high";
  signal?: AbortSignal;
}

export interface ImageResponse {
  images: Array<{ b64?: string; url?: string }>;
}

export interface ProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  embedding: boolean;
  image: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  maxContextTokens: number;
  defaultChatModel: string;
  defaultEmbedModel?: string;
  defaultImageModel?: string;
}

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;

  chat(req: ChatRequest): Promise<ChatResponse>;
  stream(req: ChatRequest): AsyncIterable<StreamChunk>;
  embed(req: EmbeddingRequest): Promise<EmbeddingResponse>;
  image(req: ImageRequest): Promise<ImageResponse>;

  /** Ping-style health probe. Returns latency in ms; throws on failure. */
  ping(): Promise<number>;
}

export interface AdapterInit {
  apiKey: string;              // LOVABLE_API_KEY
  baseUrl?: string;            // defaults to gateway
  requestTimeoutMs?: number;   // per-attempt timeout
  maxRetries?: number;         // for transient errors only
}
