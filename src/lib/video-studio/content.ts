/**
 * Video Studio — AI content builders (brief, storyboard, SEO).
 *
 * All AI calls go through the centralized AI Router via aiChat.
 * Never call model providers directly from this module.
 */

import { aiChat } from "@/lib/ai/ai-platform.functions";
import type {
  CreativeBrief,
  GenerateVideoInput,
  Scene,
  Storyboard,
} from "./types";
import { FORMAT_SPECS } from "./types";

function safeJson<T>(raw: string, fallback: T): T {
  try {
    const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
}

function normalizeDuration(input: GenerateVideoInput): number {
  const spec = FORMAT_SPECS[input.format];
  const requested = input.durationSeconds ?? spec.defaultDurationSec;
  return Math.min(Math.max(requested, spec.minDurationSec), spec.maxDurationSec);
}

/** Generate a creative brief. */
export async function generateBrief(input: GenerateVideoInput): Promise<CreativeBrief> {
  const spec = FORMAT_SPECS[input.format];
  const duration = normalizeDuration(input);

  const system = [
    "You are an award-winning short-form video creative director.",
    "Return concise, punchy briefs. Output STRICT JSON only, no prose.",
  ].join(" ");

  const user = [
    `Format: ${spec.label} (${spec.aspect}, ${duration}s, ${spec.platform})`,
    `Topic: ${input.topic}`,
    input.goal ? `Goal: ${input.goal}` : "",
    input.audience ? `Audience: ${input.audience}` : "",
    input.style ? `Style: ${input.style}` : "",
    input.cta ? `CTA: ${input.cta}` : "",
    input.language ? `Language: ${input.language}` : "",
    "",
    "Return JSON: { hook, angle, message, toneKeywords[], visualStyle, audienceInsight, cta }",
  ].filter(Boolean).join("\n");

  const res = (await aiChat({
    data: {
      profile: { quality: "balanced" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      maxTokens: 700,
    },
  })) as { text?: string; content?: string };

  const raw = res.text ?? res.content ?? "";
  return safeJson<CreativeBrief>(raw, {
    hook: input.topic,
    angle: input.goal ?? "Engaging value-first angle",
    message: input.topic,
    toneKeywords: ["confident", "modern"],
    visualStyle: input.style ?? "cinematic",
    audienceInsight: input.audience ?? "General audience",
    cta: input.cta ?? "Learn more",
  });
}

/** Generate a full storyboard from a brief. */
export async function generateStoryboard(
  input: GenerateVideoInput,
  brief: CreativeBrief,
): Promise<Storyboard> {
  const spec = FORMAT_SPECS[input.format];
  const duration = normalizeDuration(input);
  const sceneCount = Math.max(3, Math.min(8, Math.round(duration / 6)));

  const system = [
    "You are an expert short-form video storyboarder.",
    "Return STRICT JSON only. No prose, no markdown fences.",
  ].join(" ");

  const user = [
    `Format: ${spec.label} — ${spec.aspect} — ${duration}s — ${spec.platform}`,
    `Language: ${input.language ?? "en"}`,
    `Topic: ${input.topic}`,
    `Hook: ${brief.hook}`,
    `Message: ${brief.message}`,
    `Visual style: ${brief.visualStyle}`,
    `Tone: ${brief.toneKeywords.join(", ")}`,
    `CTA: ${brief.cta}`,
    input.script ? `Existing script (respect it): ${input.script}` : "",
    "",
    `Break into ${sceneCount} scenes summing to ~${duration}s. Return JSON:`,
    `{`,
    `  "title": string,`,
    `  "description": string,`,
    `  "hashtags": string[],`,
    `  "seoKeywords": string[],`,
    `  "thumbnailPrompt": string,`,
    `  "scenes": [{`,
    `    "sceneNumber": number,`,
    `    "durationSeconds": number,`,
    `    "narration": string,`,
    `    "visualPrompt": string,`,
    `    "videoPrompt": string,`,
    `    "transition": string,`,
    `    "cameraMovement": string,`,
    `    "animationType": string,`,
    `    "overlayText": string,`,
    `    "backgroundAudio": string`,
    `  }]`,
    `}`,
  ].filter(Boolean).join("\n");

  const res = (await aiChat({
    data: {
      profile: { quality: "premium" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.75,
      maxTokens: 2600,
    },
  })) as { text?: string; content?: string };

  const raw = res.text ?? res.content ?? "";
  const fallbackScene: Scene = {
    sceneNumber: 1,
    durationSeconds: duration,
    narration: brief.message,
    visualPrompt: `${brief.visualStyle} scene about ${input.topic}`,
    videoPrompt: `${brief.visualStyle}, ${input.topic}, ${brief.toneKeywords.join(", ")}`,
    transition: "cut",
    cameraMovement: "static",
    animationType: "none",
    overlayText: brief.hook,
    backgroundAudio: "upbeat",
    brandAssets: {},
  };

  const parsed = safeJson<Storyboard>(raw, {
    title: input.title || input.topic,
    description: brief.message,
    hashtags: [],
    seoKeywords: [],
    thumbnailPrompt: `${brief.visualStyle}, ${input.topic}, bold typography`,
    scenes: [fallbackScene],
    totalDurationSeconds: duration,
  });

  // Normalize
  parsed.scenes = (parsed.scenes ?? []).map((s, i) => ({
    sceneNumber: i + 1,
    durationSeconds: Math.max(1, Number(s.durationSeconds) || duration / sceneCount),
    narration: s.narration ?? "",
    visualPrompt: s.visualPrompt ?? "",
    videoPrompt: s.videoPrompt ?? s.visualPrompt ?? "",
    transition: s.transition ?? "cut",
    cameraMovement: s.cameraMovement ?? "static",
    animationType: s.animationType ?? "none",
    overlayText: s.overlayText ?? "",
    backgroundAudio: s.backgroundAudio ?? "upbeat",
    brandAssets: s.brandAssets ?? {},
  }));
  parsed.totalDurationSeconds = parsed.scenes.reduce((a, s) => a + s.durationSeconds, 0);

  return parsed;
}

/** Deterministic SRT / VTT builders from scene narration. */
function fmtTime(sec: number, sep: "," | "."): string {
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  const ms = Math.floor((sec - Math.floor(sec)) * 1000).toString().padStart(3, "0");
  return `${h}:${m}:${s}${sep}${ms}`;
}

export function buildSubtitles(scenes: Scene[]): { srt: string; vtt: string } {
  let cursor = 0;
  const srtLines: string[] = [];
  const vttLines: string[] = ["WEBVTT", ""];
  scenes.forEach((s, i) => {
    const start = cursor;
    const end = cursor + s.durationSeconds;
    cursor = end;
    const text = (s.narration || s.overlayText || "").trim();
    if (!text) return;
    srtLines.push(String(i + 1));
    srtLines.push(`${fmtTime(start, ",")} --> ${fmtTime(end, ",")}`);
    srtLines.push(text);
    srtLines.push("");
    vttLines.push(`${fmtTime(start, ".")} --> ${fmtTime(end, ".")}`);
    vttLines.push(text);
    vttLines.push("");
  });
  return { srt: srtLines.join("\n"), vtt: vttLines.join("\n") };
}

/** AI assistant suggestions (hook, CTA, title, description, keywords). */
export async function suggest(
  kind:
    | "better_hook"
    | "stronger_cta"
    | "shorter_version"
    | "longer_version"
    | "better_scene_order"
    | "better_thumbnail"
    | "better_title"
    | "better_description"
    | "seo_keywords",
  context: Record<string, unknown>,
): Promise<string> {
  const res = (await aiChat({
    data: {
      profile: { quality: "balanced" },
      messages: [
        { role: "system", content: "You improve short-form video marketing assets. Reply concise and actionable." },
        { role: "user", content: `Improvement: ${kind}\nContext:\n${JSON.stringify(context)}` },
      ],
      temperature: 0.7,
      maxTokens: 500,
    },
  })) as { text?: string; content?: string };
  return res.text ?? res.content ?? "";
}
