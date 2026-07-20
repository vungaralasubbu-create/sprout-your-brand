// Platform Connector Interface — the Publishing Engine calls this, never
// hardcoded platform logic. New platforms register a connector without any
// UI or scheduler change.
export type PlatformKey = "facebook" | "instagram" | "linkedin" | "x" | "threads" | "pinterest" | "youtube" | "tiktok" | "gbp";

export interface PlatformCapabilities {
  requiresMedia: boolean;
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsThread: boolean;
  captionLimit: number | null;
  hashtagLimit: number | null;
}

export interface PublishInput {
  ownerId: string;
  accountId: string;
  title: string;
  body: string;
  hashtags: string[];
  cta: string | null;
  mediaUrls: string[];
  thread: string[] | null;
  metadata: Record<string, unknown>;
}

export interface PublishSuccess {
  ok: true;
  platformPostId: string | null;
  platformUrl: string | null;
  response: unknown;
}

export interface PublishFailure {
  ok: false;
  errorCode: "validation" | "network" | "expired_token" | "rate_limit" | "duplicate" | "platform" | "unknown";
  errorMessage: string;
  response?: unknown;
  retryable: boolean;
}

export type PublishResult = PublishSuccess | PublishFailure;

export interface ValidationIssue { code: string; message: string; fatal: boolean }

export interface PlatformConnector {
  key: PlatformKey;
  label: string;
  capabilities: PlatformCapabilities;
  validate: (input: PublishInput) => ValidationIssue[];
  publish: (input: PublishInput) => Promise<PublishResult>;
}
