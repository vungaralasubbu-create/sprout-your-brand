/**
 * Enterprise AI Generation Engine — universal DTOs.
 *
 * Every module inside Glintr calls the Engine through these types.
 * No module should ever know which provider produced the output.
 */

export type ContentType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "presentation"
  | "document"
  | "pdf"
  | "landing_page"
  | "advertisement"
  | "banner"
  | "logo"
  | "illustration"
  | "certificate";

export type OutputKind =
  | "text"
  | "markdown"
  | "html"
  | "json"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "zip";

export type GenerationMode =
  | "single"
  | "bulk"
  | "campaign"
  | "scheduled"
  | "workflow"
  | "api";

export type QualityTier = "fast" | "balanced" | "premium";

export type JobStatus =
  | "queued"
  | "preparing"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled"
  | "retrying";

export interface GenerationRequest {
  contentType: ContentType;
  prompt: string;
  negativePrompt?: string;
  mode?: GenerationMode;

  // routing hints
  workspaceId?: string | null;
  brandId?: string | null;
  campaignId?: string | null;
  approvalRequired?: boolean;
  saveToMediaLibrary?: boolean;

  // localization
  language?: string;
  country?: string;

  // media params
  platform?: string;
  aspectRatio?: string;
  durationSeconds?: number;
  resolution?: string;
  voice?: string;

  // model tuning
  quality?: QualityTier;
  creativity?: number;
  requestedProvider?: string;
  requestedModel?: string;

  // bulk fanout
  bulkCount?: number;
  scheduledAt?: string;

  metadata?: Record<string, string | number | boolean | null>;
}

export interface GenerationOutput {
  kind: OutputKind;
  textContent?: string;
  jsonContent?: string; // serialized JSON string
  storagePath?: string;
  publicUrl?: string;
  mediaAssetId?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface GenerationJobRecord {
  id: string;
  status: JobStatus;
  outputs: GenerationOutput[];
  chosenProvider?: string;
  chosenModel?: string;
  error?: { code: string; message: string };
}

export interface ProviderEstimate {
  cents: number;
  credits: number;
  seconds: number;
}

/** Every provider adapter registered with the Engine implements this. */
export interface EngineProvider {
  key: string;
  category: "text" | "image" | "video" | "audio" | "document" | "presentation";
  validate(req: GenerationRequest): { ok: true } | { ok: false; message: string };
  estimateCost(req: GenerationRequest): ProviderEstimate;
  estimateTime(req: GenerationRequest): number; // seconds
  capabilities(): Record<string, unknown>;
  health(): Promise<{ status: "healthy" | "degraded" | "down" | "unknown"; message?: string }>;
  generate(req: GenerationRequest, ctx: EngineContext): Promise<GenerationOutput[]>;
  /** Optional lifecycle hooks — video/long-running providers use them. */
  cancel?(jobId: string): Promise<void>;
  status?(jobId: string): Promise<JobStatus>;
  retry?(jobId: string): Promise<void>;
}

/** Runtime context threaded through the pipeline. */
export interface EngineContext {
  jobId: string;
  userId: string;
  brandSystemPrompt: string;
  campaignSummary: string;
  supabase: any; // authenticated supabase client from requireSupabaseAuth
}
