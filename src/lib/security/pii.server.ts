/**
 * PII / Sensitive Data Detection & Redaction
 * ------------------------------------------
 * Regex-based first line of defense. Detects: email, phone, SSN, credit
 * card (Luhn-validated), IP address, IBAN-ish, common API keys, JWT-like
 * tokens, and private key headers. `redact` replaces matches with typed
 * placeholders. `hash` returns a SHA-256 for logging without leaking the
 * raw value (used in `ai_policy_violations.matched_text_hash`).
 */

import { createHash } from "node:crypto";

export interface PiiMatch {
  type: "email" | "phone" | "ssn" | "credit_card" | "ip" | "iban" | "api_key" | "jwt" | "private_key";
  start: number;
  end: number;
  sample: string; // 4-char preview, never full value
}

interface Rule {
  type: PiiMatch["type"];
  re: RegExp;
  postValidate?: (m: string) => boolean;
}

const RULES: Rule[] = [
  { type: "email",       re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: "phone",       re: /(?<!\d)(\+?\d{1,3}[ -]?)?(\(?\d{2,4}\)?[ -]?)?\d{3}[ -]?\d{3,4}[ -]?\d{3,4}(?!\d)/g },
  { type: "ssn",         re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "credit_card", re: /\b(?:\d[ -]?){13,19}\b/g, postValidate: luhn },
  { type: "ip",          re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { type: "iban",        re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },
  { type: "api_key",     re: /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{16,}\b/g },
  { type: "jwt",         re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { type: "private_key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
];

function luhn(digits: string): boolean {
  const s = digits.replace(/[^\d]/g, "");
  if (s.length < 13 || s.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    let d = Number(s[s.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export function detectPII(text: string): PiiMatch[] {
  if (!text) return [];
  const matches: PiiMatch[] = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    for (const m of text.matchAll(rule.re)) {
      const raw = m[0];
      if (rule.postValidate && !rule.postValidate(raw)) continue;
      matches.push({
        type: rule.type,
        start: m.index ?? 0,
        end: (m.index ?? 0) + raw.length,
        sample: raw.slice(0, 2) + "***" + raw.slice(-2),
      });
    }
  }
  // Sort + de-overlap (keep earliest, longest).
  matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const dedup: PiiMatch[] = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) { dedup.push(m); lastEnd = m.end; }
  }
  return dedup;
}

export function redactPII(text: string): { redacted: string; matches: PiiMatch[] } {
  const matches = detectPII(text);
  if (!matches.length) return { redacted: text, matches };
  let out = "";
  let cursor = 0;
  for (const m of matches) {
    out += text.slice(cursor, m.start) + `[REDACTED_${m.type.toUpperCase()}]`;
    cursor = m.end;
  }
  out += text.slice(cursor);
  return { redacted: out, matches };
}

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
