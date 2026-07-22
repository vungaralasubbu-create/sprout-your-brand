/**
 * Channel classifier for Conversion Intelligence.
 * Runs client-side; no PII, no external calls.
 */

export type Channel =
  | "google_organic"
  | "google_ads"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "referral"
  | "email"
  | "whatsapp"
  | "sms"
  | "ai_chatgpt"
  | "ai_gemini"
  | "ai_claude"
  | "ai_perplexity"
  | "ai_other"
  | "direct";

export interface TouchContext {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_path?: string | null;
}

const AI_HOSTS: Record<string, Channel> = {
  "chat.openai.com": "ai_chatgpt",
  "chatgpt.com": "ai_chatgpt",
  "gemini.google.com": "ai_gemini",
  "bard.google.com": "ai_gemini",
  "claude.ai": "ai_claude",
  "perplexity.ai": "ai_perplexity",
  "www.perplexity.ai": "ai_perplexity",
};

const SOCIAL_HOSTS: Partial<Record<string, Channel>> = {
  "facebook.com": "facebook",
  "www.facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "l.facebook.com": "facebook",
  "instagram.com": "instagram",
  "www.instagram.com": "instagram",
  "l.instagram.com": "instagram",
  "linkedin.com": "linkedin",
  "www.linkedin.com": "linkedin",
  "lnkd.in": "linkedin",
  "youtube.com": "youtube",
  "www.youtube.com": "youtube",
  "m.youtube.com": "youtube",
  "youtu.be": "youtube",
  "tiktok.com": "tiktok",
  "www.tiktok.com": "tiktok",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "t.co": "twitter",
  "wa.me": "whatsapp",
  "api.whatsapp.com": "whatsapp",
  "chat.whatsapp.com": "whatsapp",
};

function hostFromReferrer(referrer?: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function classifyChannel(ctx: TouchContext): Channel {
  const src = (ctx.utm_source ?? "").toLowerCase().trim();
  const med = (ctx.utm_medium ?? "").toLowerCase().trim();

  // UTM wins
  if (src) {
    if (med === "cpc" || med === "ppc" || med === "paid" || src === "google_ads" || src === "adwords") return "google_ads";
    if (src.includes("google")) return med === "organic" ? "google_organic" : "google_ads";
    if (src.includes("facebook") || src === "fb") return "facebook";
    if (src.includes("instagram") || src === "ig") return "instagram";
    if (src.includes("linkedin")) return "linkedin";
    if (src.includes("youtube")) return "youtube";
    if (src.includes("tiktok")) return "tiktok";
    if (src.includes("twitter") || src === "x") return "twitter";
    if (src.includes("whatsapp") || src === "wa") return "whatsapp";
    if (med === "email" || src.includes("mail") || src.includes("newsletter")) return "email";
    if (med === "sms") return "sms";
    if (src.includes("chatgpt") || src.includes("openai")) return "ai_chatgpt";
    if (src.includes("gemini") || src.includes("bard")) return "ai_gemini";
    if (src.includes("claude") || src.includes("anthropic")) return "ai_claude";
    if (src.includes("perplexity")) return "ai_perplexity";
    if (med === "referral") return "referral";
  }

  const host = hostFromReferrer(ctx.referrer);
  if (host) {
    if (AI_HOSTS[host]) return AI_HOSTS[host];
    if (host.endsWith(".google.") || host === "google.com" || host.startsWith("google.")) return "google_organic";
    if (host.includes("google.")) return "google_organic";
    const social = SOCIAL_HOSTS[host];
    if (social) return social;
    return "referral";
  }

  return "direct";
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  google_organic: "Google Organic",
  google_ads: "Google Ads",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  referral: "Referral",
  email: "Email",
  whatsapp: "WhatsApp",
  sms: "SMS",
  ai_chatgpt: "ChatGPT",
  ai_gemini: "Gemini",
  ai_claude: "Claude",
  ai_perplexity: "Perplexity",
  ai_other: "AI Search",
  direct: "Direct",
};

export const FUNNEL_STAGES = [
  "homepage",
  "program",
  "course",
  "blog",
  "landing",
  "form_start",
  "form_submit",
  "payment",
  "enrollment",
  "course_start",
  "course_complete",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const STAGE_LABELS: Record<FunnelStage, string> = {
  homepage: "Homepage",
  program: "Program Page",
  course: "Course Page",
  blog: "Blog",
  landing: "Landing Page",
  form_start: "Form Started",
  form_submit: "Form Submitted",
  payment: "Payment",
  enrollment: "Enrollment",
  course_start: "Course Started",
  course_complete: "Course Completed",
};
