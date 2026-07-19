// GEO Freshness Detector — heuristic + LLM-assisted staleness signals.

import { aiChat } from "@/lib/ai/router.server";

export type FreshnessSignal = {
  signal: string;
  severity: "low" | "medium" | "high";
  detail: string;
};

const CURRENT_YEAR = new Date().getFullYear();

const STALE_KEYWORDS: Array<{ pattern: RegExp; signal: string; severity: FreshnessSignal["severity"] }> = [
  { pattern: /\bAngularJS\b/i, signal: "deprecated_framework", severity: "high" },
  { pattern: /\bjQuery\s+1\./i, signal: "outdated_library", severity: "medium" },
  { pattern: /\bPython\s*2(\.\d)?\b/i, signal: "deprecated_language", severity: "high" },
  { pattern: /\bNode\.js\s*(10|12|14)\b/i, signal: "eol_runtime", severity: "medium" },
  { pattern: /\bIE\s*(6|7|8|9|10|11)\b/i, signal: "deprecated_browser", severity: "high" },
  { pattern: /\bFlash\s+Player\b/i, signal: "deprecated_platform", severity: "high" },
];

export function detectHeuristicSignals(body: string): FreshnessSignal[] {
  const out: FreshnessSignal[] = [];
  for (const r of STALE_KEYWORDS) {
    if (r.pattern.test(body)) {
      out.push({ signal: r.signal, severity: r.severity, detail: r.pattern.toString() });
    }
  }
  const oldYear = body.match(/\b(20(0\d|1[0-6]))\b/g);
  if (oldYear && oldYear.length > 2) {
    out.push({
      signal: "old_year_references",
      severity: "medium",
      detail: `References to ${oldYear.slice(0, 4).join(", ")}. Consider updating to ${CURRENT_YEAR}.`,
    });
  }
  return out;
}

const SYSTEM = `You are the Glintr GEO Freshness Auditor.
Identify stale technologies, deprecated frameworks, outdated statistics, old salaries, or expired certifications
mentioned in the content. Return STRICT JSON:
{ "signals": [{ "signal": string, "severity": "low"|"medium"|"high", "detail": string }] }
Only flag things that are actually stale in ${CURRENT_YEAR}.`;

export async function detectSignals(body: string): Promise<FreshnessSignal[]> {
  const heuristics = detectHeuristicSignals(body);
  const raw = await aiChat({
    system: SYSTEM,
    messages: [{ role: "user", content: body.slice(0, 10000) }],
    responseFormat: "json",
    temperature: 0.2,
    maxTokens: 1200,
  });
  const parsed = raw as { signals?: FreshnessSignal[] };
  const ai = Array.isArray(parsed?.signals) ? parsed.signals : [];
  const merged: FreshnessSignal[] = [...heuristics];
  for (const s of ai) {
    if (!s?.signal) continue;
    merged.push({
      signal: s.signal,
      severity: (["low", "medium", "high"] as const).includes(s.severity) ? s.severity : "medium",
      detail: (s.detail ?? "").toString().slice(0, 400),
    });
  }
  return merged.slice(0, 25);
}
