/**
 * Prompt-Injection / Jailbreak Detection
 * --------------------------------------
 * Heuristic classifier. Matches known jailbreak phrases, role-override
 * attempts, and role-tag smuggling ("<|system|>"). Returns a confidence
 * score 0-1 and the list of triggered signals. Callers decide whether
 * to `block` or `warn` based on policy config.
 */

export interface InjectionSignal {
  id: string;
  weight: number;
  matched: string;
}

const RULES: Array<{ id: string; re: RegExp; weight: number }> = [
  { id: "ignore_previous",       re: /\b(ignore|disregard|forget)\b[^.]{0,40}\b(previous|prior|above|earlier)\b[^.]{0,20}\b(instructions?|rules?|prompts?|messages?)\b/i, weight: 0.55 },
  { id: "role_override",         re: /\byou (are|will be) (now|actually) (?:a|an|the) [\w -]{2,60}/i, weight: 0.35 },
  { id: "system_prompt_reveal",  re: /\b(reveal|show|print|repeat)\b[^.]{0,40}\b(system prompt|instructions|hidden prompt|initial prompt)\b/i, weight: 0.6 },
  { id: "developer_mode",        re: /\b(developer mode|DAN mode|god mode|jailbreak|unrestricted mode)\b/i, weight: 0.7 },
  { id: "role_tag_smuggle",      re: /(<\|(system|user|assistant)\|>|\[SYSTEM\]|###\s*system)/i, weight: 0.5 },
  { id: "unfiltered",            re: /\b(without any (?:filter|restrictions?|ethics?|rules?)|no restrictions?)\b/i, weight: 0.4 },
  { id: "override_safety",       re: /\b(override|bypass|disable) (?:the )?(safety|content policy|guardrails?)\b/i, weight: 0.7 },
  { id: "pretend_you_can",       re: /\bpretend (that )?you (can|have|are)\b/i, weight: 0.25 },
  { id: "base64_hidden",         re: /decode this base64[^.]{0,20}(instruction|command)/i, weight: 0.5 },
];

export interface InjectionResult {
  score: number;                 // 0..1
  level: "clean" | "suspicious" | "likely" | "certain";
  signals: InjectionSignal[];
}

export function detectPromptInjection(text: string): InjectionResult {
  if (!text) return { score: 0, level: "clean", signals: [] };
  const signals: InjectionSignal[] = [];
  let score = 0;
  for (const rule of RULES) {
    const m = text.match(rule.re);
    if (m) {
      signals.push({ id: rule.id, weight: rule.weight, matched: m[0].slice(0, 80) });
      score = Math.min(1, score + rule.weight);
    }
  }
  const level: InjectionResult["level"] =
    score >= 0.85 ? "certain" : score >= 0.6 ? "likely" : score >= 0.3 ? "suspicious" : "clean";
  return { score, level, signals };
}
