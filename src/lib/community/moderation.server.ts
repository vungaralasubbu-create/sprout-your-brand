import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

export interface ModerationResult {
  status: "approved" | "pending" | "hidden";
  reason?: string;
  score: number; // 0 clean → 1 toxic/spam
}

const SPAM_KEYWORDS = [
  "http://bit.ly", "click here to win", "free money", "make money fast",
  "viagra", "xxx", "porn", "casino", "crypto pump", "buy followers",
];

/** Fast heuristic classifier for offline / AI-unavailable paths. */
export function heuristicModerate(text: string): ModerationResult {
  const s = (text || "").toLowerCase();
  if (!s.trim()) return { status: "hidden", reason: "Empty content", score: 1 };
  const urlCount = (s.match(/https?:\/\//g) || []).length;
  const hasSpamKw = SPAM_KEYWORDS.some((kw) => s.includes(kw));
  const shouty = s.replace(/[^a-z]/g, "").length > 30 && s === s.toUpperCase();
  const short = s.trim().length < 6;
  if (hasSpamKw || urlCount > 4) return { status: "hidden", reason: "Detected spam or excessive links", score: 0.9 };
  if (shouty || short) return { status: "pending", reason: "Needs moderator review", score: 0.5 };
  return { status: "approved", score: 0 };
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  const local = heuristicModerate(text);
  if (local.status === "hidden") return local;
  if (!isAiAvailable()) return local;

  try {
    const result = await callLovableAiJson<{
      verdict: "approved" | "review" | "block";
      score: number;
      reason?: string;
    }>({
      model: "google/gemini-2.5-flash-lite",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a community moderator for an EdTech platform. Classify user-submitted posts. " +
            "Return JSON: {verdict:'approved'|'review'|'block', score:0..1, reason?:string}. " +
            "Block: spam, scams, hateful/harassing, explicit sexual, doxxing, self-harm, illegal. " +
            "Review: borderline promotion, mild negativity, off-topic, insults. Approved: everything else. " +
            "score reflects toxicity/spam probability.",
        },
        { role: "user", content: text.slice(0, 4000) },
      ],
    });
    const status =
      result.verdict === "block" ? "hidden" : result.verdict === "review" ? "pending" : "approved";
    return { status, reason: result.reason, score: Math.max(0, Math.min(1, result.score ?? 0)) };
  } catch (err) {
    console.warn("[community moderation] AI failed, falling back to heuristic:", err);
    return local;
  }
}

export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "thread";
}
