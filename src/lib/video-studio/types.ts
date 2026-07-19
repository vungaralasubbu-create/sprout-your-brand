/**
 * Glintr AI Video Studio — Types
 *
 * Central type definitions for the Video Studio subsystem.
 * Every server function and provider adapter imports from here.
 */

export type VideoFormat =
  | "instagram_reel"
  | "youtube_short"
  | "tiktok"
  | "linkedin_video"
  | "facebook_video"
  | "course_promo"
  | "webinar_promo"
  | "workshop_promo"
  | "internship_promo"
  | "hiring"
  | "explainer"
  | "product_demo"
  | "feature_announcement"
  | "success_story"
  | "testimonial"
  | "corporate"
  | "avatar"
  | "slideshow"
  | "educational"
  | "animated_presentation";

export type AspectRatio = "9:16" | "1:1" | "16:9" | "3:4" | "4:3" | "21:9";
export type Resolution = "480p" | "720p" | "1080p" | "4k";

export type ProjectStatus =
  | "draft"
  | "brief"
  | "storyboard"
  | "generating"
  | "ready"
  | "failed"
  | "archived"
  | "published";

export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "retrying";

export type ProviderKind = "video" | "voice" | "music" | "image" | "subtitle";

export type AssetKind =
  | "video"
  | "thumbnail"
  | "voice"
  | "music"
  | "subtitle_srt"
  | "subtitle_vtt"
  | "image"
  | "logo"
  | "project_file"
  | "scene_clip"
  | "preview"
  | "other";

/** Per-format specification (aspect ratio, target duration, resolution). */
export interface FormatSpec {
  aspect: AspectRatio;
  defaultDurationSec: number;
  minDurationSec: number;
  maxDurationSec: number;
  resolution: Resolution;
  platform: string;
  label: string;
}

export const FORMAT_SPECS: Record<VideoFormat, FormatSpec> = {
  instagram_reel: { aspect: "9:16", defaultDurationSec: 30, minDurationSec: 15, maxDurationSec: 90, resolution: "1080p", platform: "instagram", label: "Instagram Reel" },
  youtube_short: { aspect: "9:16", defaultDurationSec: 45, minDurationSec: 15, maxDurationSec: 60, resolution: "1080p", platform: "youtube", label: "YouTube Short" },
  tiktok: { aspect: "9:16", defaultDurationSec: 30, minDurationSec: 10, maxDurationSec: 180, resolution: "1080p", platform: "tiktok", label: "TikTok Video" },
  linkedin_video: { aspect: "1:1", defaultDurationSec: 60, minDurationSec: 15, maxDurationSec: 300, resolution: "1080p", platform: "linkedin", label: "LinkedIn Video" },
  facebook_video: { aspect: "1:1", defaultDurationSec: 60, minDurationSec: 15, maxDurationSec: 240, resolution: "1080p", platform: "facebook", label: "Facebook Video" },
  course_promo: { aspect: "16:9", defaultDurationSec: 60, minDurationSec: 30, maxDurationSec: 180, resolution: "1080p", platform: "web", label: "Course Promo" },
  webinar_promo: { aspect: "16:9", defaultDurationSec: 45, minDurationSec: 20, maxDurationSec: 120, resolution: "1080p", platform: "web", label: "Webinar Promo" },
  workshop_promo: { aspect: "16:9", defaultDurationSec: 45, minDurationSec: 20, maxDurationSec: 120, resolution: "1080p", platform: "web", label: "Workshop Promo" },
  internship_promo: { aspect: "9:16", defaultDurationSec: 30, minDurationSec: 15, maxDurationSec: 90, resolution: "1080p", platform: "social", label: "Internship Promo" },
  hiring: { aspect: "16:9", defaultDurationSec: 45, minDurationSec: 20, maxDurationSec: 120, resolution: "1080p", platform: "web", label: "Hiring Video" },
  explainer: { aspect: "16:9", defaultDurationSec: 90, minDurationSec: 30, maxDurationSec: 300, resolution: "1080p", platform: "web", label: "Explainer" },
  product_demo: { aspect: "16:9", defaultDurationSec: 90, minDurationSec: 30, maxDurationSec: 240, resolution: "1080p", platform: "web", label: "Product Demo" },
  feature_announcement: { aspect: "16:9", defaultDurationSec: 45, minDurationSec: 15, maxDurationSec: 120, resolution: "1080p", platform: "web", label: "Feature Announcement" },
  success_story: { aspect: "9:16", defaultDurationSec: 60, minDurationSec: 30, maxDurationSec: 180, resolution: "1080p", platform: "social", label: "Success Story" },
  testimonial: { aspect: "9:16", defaultDurationSec: 45, minDurationSec: 15, maxDurationSec: 120, resolution: "1080p", platform: "social", label: "Student Testimonial" },
  corporate: { aspect: "16:9", defaultDurationSec: 90, minDurationSec: 30, maxDurationSec: 300, resolution: "1080p", platform: "web", label: "Corporate Presentation" },
  avatar: { aspect: "9:16", defaultDurationSec: 45, minDurationSec: 15, maxDurationSec: 180, resolution: "1080p", platform: "social", label: "AI Avatar Video" },
  slideshow: { aspect: "16:9", defaultDurationSec: 60, minDurationSec: 20, maxDurationSec: 240, resolution: "1080p", platform: "web", label: "Slideshow" },
  educational: { aspect: "16:9", defaultDurationSec: 120, minDurationSec: 30, maxDurationSec: 600, resolution: "1080p", platform: "web", label: "Educational Lesson" },
  animated_presentation: { aspect: "16:9", defaultDurationSec: 90, minDurationSec: 30, maxDurationSec: 300, resolution: "1080p", platform: "web", label: "Animated Presentation" },
};

export interface CreativeBrief {
  hook: string;
  angle: string;
  message: string;
  toneKeywords: string[];
  visualStyle: string;
  audienceInsight: string;
  cta: string;
}

export interface Scene {
  sceneNumber: number;
  durationSeconds: number;
  narration: string;
  visualPrompt: string;
  videoPrompt: string;
  transition: string;
  cameraMovement: string;
  animationType: string;
  overlayText: string;
  backgroundAudio: string;
  brandAssets: Record<string, unknown>;
}

export interface Storyboard {
  title: string;
  description: string;
  hashtags: string[];
  seoKeywords: string[];
  thumbnailPrompt: string;
  scenes: Scene[];
  totalDurationSeconds: number;
}

export interface GenerateVideoInput {
  projectId?: string;
  title: string;
  format: VideoFormat;
  topic: string;
  goal?: string;
  audience?: string;
  durationSeconds?: number;
  language?: string;
  brandKitId?: string;
  style?: string;
  platform?: string;
  cta?: string;
  script?: string;
  imageUrls?: string[];
  logoUrl?: string;
  voiceId?: string;
  templateId?: string;
  sourceType?: string;
  sourceId?: string;
}

/**
 * Provider adapter contract. Every video/voice/music provider MUST implement
 * this interface so the runtime can swap providers without touching orchestration.
 */
export interface ProviderJobInput {
  jobId: string;
  ownerId: string;
  projectId?: string;
  sceneId?: string;
  input: Record<string, unknown>;
}

export interface ProviderJobResult {
  status: JobStatus;
  providerRef?: string;
  output?: Record<string, unknown>;
  assetUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  costCredits?: number;
  nextPollInMs?: number;
}

export interface VideoProviderAdapter {
  slug: string;
  kind: ProviderKind;
  generate(input: ProviderJobInput): Promise<ProviderJobResult>;
  checkStatus(providerRef: string): Promise<ProviderJobResult>;
  cancel(providerRef: string): Promise<void>;
  estimateCost(input: Record<string, unknown>): Promise<number>;
  fetchResult(providerRef: string): Promise<ProviderJobResult>;
  generateThumbnail?(input: ProviderJobInput): Promise<ProviderJobResult>;
}
