/**
 * Glintr AI Lead Scoring — pure, reusable microservice.
 *
 * Inputs: lead row + event stream + scoring config.
 * Output: score (0-100), category, probability, breakdown, summary, next action.
 *
 * Deterministic and framework-free so it runs in server functions, workers,
 * migrations, or future AI models can replace/augment without touching CRM UI.
 */

export type ScoreCategory = "hot" | "warm" | "nurture" | "cold";

export interface LeadEventLike {
  event_type: string;
  source?: string | null;
  page_path?: string | null;
  metadata?: Record<string, unknown> | null;
  duration_seconds?: number | null;
  created_at?: string;
}

export interface LeadLike {
  id: string;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  phone?: string | null;
  email?: string | null;
  interested_course?: string | null;
  career_interest?: string | null;
  metadata?: Record<string, unknown> | null;
  visit_count?: number | null;
  first_seen_at?: string | null;
  last_activity_at?: string | null;
}

export interface ScoringWeights {
  page_view: number;
  course_view: number;
  programs_view: number;
  long_session: number;
  scroll_deep: number;
  video_watch: number;
  brochure_download: number;
  curriculum_download: number;
  career_roadmap: number;
  demo_request: number;
  consultation_booked: number;
  ai_conversation: number;
  ai_message: number;
  ai_qualified: number;
  phone_captured: number;
  otp_verified: number;
  returning_visitor: number;
  utm_paid: number;
  utm_organic: number;
  short_session_penalty: number;
  bounce_penalty: number;
}

export interface ScoringThresholds {
  hot: number;
  warm: number;
  nurture: number;
}

export interface ScoringConfig {
  weights: ScoringWeights;
  thresholds: ScoringThresholds;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  page_view: 2,
  course_view: 8,
  programs_view: 4,
  long_session: 6,
  scroll_deep: 5,
  video_watch: 6,
  brochure_download: 15,
  curriculum_download: 12,
  career_roadmap: 10,
  demo_request: 20,
  consultation_booked: 25,
  ai_conversation: 4,
  ai_message: 2,
  ai_qualified: 12,
  phone_captured: 20,
  otp_verified: 10,
  returning_visitor: 8,
  utm_paid: 5,
  utm_organic: 3,
  short_session_penalty: -6,
  bounce_penalty: -10,
};

export const DEFAULT_THRESHOLDS: ScoringThresholds = {
  hot: 90,
  warm: 70,
  nurture: 40,
};

export interface ScoreBreakdown {
  signal: keyof ScoringWeights | "identity" | "recency" | "diversity";
  points: number;
  count?: number;
  note?: string;
}

export interface ScoringResult {
  score: number;
  category: ScoreCategory;
  probability: number;
  breakdown: ScoreBreakdown[];
  summary: string;
  next_action: string;
  reason: string;
  signals: {
    courseViews: number;
    aiMessages: number;
    downloads: number;
    consultations: number;
    demos: number;
    videos: number;
    visits: number;
    returning: boolean;
    verified: boolean;
    hasContact: boolean;
    dominantCourse: string | null;
  };
}

const CAP = 100;

function categorize(score: number, t: ScoringThresholds): ScoreCategory {
  if (score >= t.hot) return "hot";
  if (score >= t.warm) return "warm";
  if (score >= t.nurture) return "nurture";
  return "cold";
}

function classifyEvent(evt: LeadEventLike): keyof ScoringWeights | null {
  const t = (evt.event_type || "").toLowerCase();
  const path = (evt.page_path || "").toLowerCase();
  if (t === "brochure_download") return "brochure_download";
  if (t === "consultation_book") return "consultation_booked";
  if (t === "roadmap_request") return "career_roadmap";
  if (t === "ai_convert") return "ai_qualified";
  if (t === "ai_message") return "ai_message";
  if (t === "ai_conversation_start") return "ai_conversation";
  if (t === "video_watch") return "video_watch";
  if (t === "scroll_deep") return "scroll_deep";
  if (t === "long_session") return "long_session";
  if (t === "phone_captured") return "phone_captured";
  if (t === "otp_verified") return "otp_verified";
  if (t === "returning_visit") return "returning_visitor";
  if (t === "cta_click") return "page_view";
  if (t === "popup_submit") return "phone_captured";
  if (t === "page_view") {
    if (/\/(programs|courses)\/[^/]+\/[^/]+/.test(path)) return "course_view";
    if (/\/(programs|courses)/.test(path)) return "programs_view";
    return "page_view";
  }
  return null;
}

function dominantCourseFrom(events: LeadEventLike[]): string | null {
  const counts = new Map<string, number>();
  for (const evt of events) {
    const path = evt.page_path || "";
    const match = path.match(/^\/(?:programs|courses)\/[^/]+\/([^/?#]+)/);
    if (match) counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

/**
 * Core scoring function. Pure. Deterministic.
 */
export function scoreLead(
  lead: LeadLike,
  events: LeadEventLike[],
  config: ScoringConfig = { weights: DEFAULT_WEIGHTS, thresholds: DEFAULT_THRESHOLDS },
): ScoringResult {
  const w = { ...DEFAULT_WEIGHTS, ...config.weights };
  const t = { ...DEFAULT_THRESHOLDS, ...config.thresholds };
  const breakdown: ScoreBreakdown[] = [];

  // Bucket events
  const counts = new Map<keyof ScoringWeights, number>();
  let totalDuration = 0;
  let uniquePages = new Set<string>();
  let uniqueCourses = new Set<string>();
  let aiMessages = 0;

  for (const evt of events) {
    const sig = classifyEvent(evt);
    if (evt.duration_seconds) totalDuration += evt.duration_seconds;
    if (evt.page_path) uniquePages.add(evt.page_path);
    const m = (evt.page_path || "").match(/^\/(?:programs|courses)\/[^/]+\/([^/?#]+)/);
    if (m) uniqueCourses.add(m[1]);
    if (sig === "ai_message") aiMessages += 1;
    if (sig) counts.set(sig, (counts.get(sig) ?? 0) + 1);
  }

  let score = 0;

  // Apply weighted signals with diminishing returns for repeats
  for (const [sig, n] of counts) {
    // diminishing returns: sqrt-based scaling caps spam
    const scaled = Math.round(w[sig] * Math.sqrt(n));
    if (scaled === 0) continue;
    score += scaled;
    breakdown.push({ signal: sig, points: scaled, count: n });
  }

  // Identity boosts
  const hasPhone = Boolean(lead.phone);
  const hasEmail = Boolean(lead.email);
  if (hasPhone && !counts.has("phone_captured")) {
    score += w.phone_captured;
    breakdown.push({ signal: "phone_captured", points: w.phone_captured, note: "phone on lead" });
  }
  if (hasEmail && hasPhone) {
    score += 5;
    breakdown.push({ signal: "identity", points: 5, note: "full contact" });
  }

  // UTM source boost
  const utm = (lead.utm_source || "").toLowerCase();
  const paid = ["google", "meta", "facebook", "instagram", "linkedin", "youtube"].includes(utm);
  if (paid) {
    score += w.utm_paid;
    breakdown.push({ signal: "utm_paid", points: w.utm_paid, note: utm });
  } else if (utm) {
    score += w.utm_organic;
    breakdown.push({ signal: "utm_organic", points: w.utm_organic, note: utm });
  }

  // Diversity of course interest
  if (uniqueCourses.size >= 2) {
    const bonus = Math.min(uniqueCourses.size * 3, 12);
    score += bonus;
    breakdown.push({ signal: "diversity", points: bonus, note: `${uniqueCourses.size} courses` });
  }

  // Recency
  if (lead.last_activity_at) {
    const last = new Date(lead.last_activity_at).getTime();
    const hours = (Date.now() - last) / 3_600_000;
    if (hours < 1) {
      score += 6;
      breakdown.push({ signal: "recency", points: 6, note: "active <1h" });
    } else if (hours < 24) {
      score += 3;
      breakdown.push({ signal: "recency", points: 3, note: "active today" });
    } else if (hours > 24 * 14) {
      score -= 8;
      breakdown.push({ signal: "recency", points: -8, note: "stale >14d" });
    }
  }

  // Session-quality signals
  if (events.length <= 1 && totalDuration < 15 && !hasPhone) {
    score += w.bounce_penalty;
    breakdown.push({ signal: "bounce_penalty", points: w.bounce_penalty });
  } else if (totalDuration && totalDuration < 30 && events.length < 3) {
    score += w.short_session_penalty;
    breakdown.push({ signal: "short_session_penalty", points: w.short_session_penalty });
  }

  // Clamp
  score = Math.max(0, Math.min(CAP, Math.round(score)));
  const category = categorize(score, t);
  const probability = Math.round(Math.min(99, score * 0.95 + (hasPhone ? 3 : 0)));

  const dominantCourse = dominantCourseFrom(events) || lead.interested_course || null;
  const returning = (lead.visit_count ?? 0) > 1 || (counts.get("returning_visitor") ?? 0) > 0;

  const summary = buildSummary({
    lead,
    counts,
    uniqueCourses,
    aiMessages,
    hasPhone,
    returning,
    totalDuration,
    dominantCourse,
    category,
  });

  const next_action = suggestNextAction({ category, hasPhone, hasEmail, counts });

  const reason = breakdown
    .slice()
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
    .slice(0, 3)
    .map((b) => `${b.signal}${b.count ? ` x${b.count}` : ""}: ${b.points > 0 ? "+" : ""}${b.points}`)
    .join(" · ");

  return {
    score,
    category,
    probability,
    breakdown,
    summary,
    next_action,
    reason,
    signals: {
      courseViews: counts.get("course_view") ?? 0,
      aiMessages,
      downloads: (counts.get("brochure_download") ?? 0) + (counts.get("curriculum_download") ?? 0),
      consultations: counts.get("consultation_booked") ?? 0,
      demos: counts.get("demo_request") ?? 0,
      videos: counts.get("video_watch") ?? 0,
      visits: uniquePages.size,
      returning,
      verified: (counts.get("otp_verified") ?? 0) > 0,
      hasContact: hasPhone || hasEmail,
      dominantCourse,
    },
  };
}

function buildSummary(args: {
  lead: LeadLike;
  counts: Map<keyof ScoringWeights, number>;
  uniqueCourses: Set<string>;
  aiMessages: number;
  hasPhone: boolean;
  returning: boolean;
  totalDuration: number;
  dominantCourse: string | null;
  category: ScoreCategory;
}): string {
  const parts: string[] = [];
  const {
    counts,
    uniqueCourses,
    aiMessages,
    hasPhone,
    returning,
    totalDuration,
    dominantCourse,
    category,
  } = args;

  if (uniqueCourses.size > 0) {
    parts.push(
      `viewed ${uniqueCourses.size} ${uniqueCourses.size === 1 ? "course" : "courses"}${dominantCourse ? ` (focus: ${dominantCourse.replace(/-/g, " ")})` : ""}`,
    );
  }
  const dl = (counts.get("brochure_download") ?? 0) + (counts.get("curriculum_download") ?? 0);
  if (dl > 0) parts.push(`downloaded ${dl} resource${dl > 1 ? "s" : ""}`);
  if (aiMessages > 0) parts.push(`chatted with GlintrAI (${aiMessages} messages)`);
  if ((counts.get("consultation_booked") ?? 0) > 0) parts.push("booked a consultation");
  if ((counts.get("demo_request") ?? 0) > 0) parts.push("requested a demo");
  if (returning) parts.push("is a returning visitor");
  if (totalDuration > 180) parts.push(`spent ${Math.round(totalDuration / 60)} min on site`);
  if (hasPhone) parts.push("shared their phone");

  const opening =
    category === "hot"
      ? "High probability of conversion — this lead"
      : category === "warm"
        ? "Strong interest — this lead"
        : category === "nurture"
          ? "Needs nurturing — this lead"
          : "Low intent — this lead";

  if (parts.length === 0) return `${opening} has minimal activity so far.`;
  return `${opening} ${parts.join(", ")}.`;
}

function suggestNextAction(args: {
  category: ScoreCategory;
  hasPhone: boolean;
  hasEmail: boolean;
  counts: Map<keyof ScoringWeights, number>;
}): string {
  const { category, hasPhone, counts } = args;
  if (category === "hot") {
    if ((counts.get("consultation_booked") ?? 0) > 0) return "Confirm consultation & prep offer";
    if (hasPhone) return "Call immediately";
    return "Send WhatsApp + book demo";
  }
  if (category === "warm") {
    if ((counts.get("brochure_download") ?? 0) > 0) return "Send scholarship offer";
    if (hasPhone) return "WhatsApp follow-up within 24h";
    return "Send curriculum & nurture email";
  }
  if (category === "nurture") {
    return "Add to nurture campaign · weekly touchpoints";
  }
  return "Low priority · monthly newsletter";
}
