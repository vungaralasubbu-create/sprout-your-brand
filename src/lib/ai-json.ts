/**
 * Robust JSON parser for AI responses.
 *
 * AI models frequently return JSON with:
 *  - markdown code fences (```json ... ```)
 *  - leading/trailing prose
 *  - unescaped control characters inside string values (raw \n, \t, tabs)
 *  - unescaped inner backslashes (bad \x escapes) — most common in markdown bodies
 *  - trailing commas
 *  - truncated payloads
 *
 * This helper strips fences, isolates the JSON envelope, repairs common
 * defects, and — if the strict parse still fails — walks strings and escapes
 * illegal control characters and stray backslashes so the payload becomes
 * valid JSON. On failure it throws a structured error with the raw payload
 * and the offset/field that failed for developer logs.
 */

export class AiJsonParseError extends Error {
  readonly raw: string;
  readonly cleaned: string;
  readonly offset?: number;
  readonly field?: string;
  readonly truncated: boolean;
  constructor(opts: {
    message: string;
    raw: string;
    cleaned: string;
    offset?: number;
    field?: string;
    truncated: boolean;
  }) {
    super(opts.message);
    this.name = "AiJsonParseError";
    this.raw = opts.raw;
    this.cleaned = opts.cleaned;
    this.offset = opts.offset;
    this.field = opts.field;
    this.truncated = opts.truncated;
  }
}

/** Detect obvious truncation: unbalanced braces/brackets or trailing ellipsis. */
export function detectTruncation(text: string): boolean {
  const s = text.trim();
  if (!s) return true;
  let braces = 0;
  let brackets = 0;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") braces++;
    else if (c === "}") braces--;
    else if (c === "[") brackets++;
    else if (c === "]") brackets--;
  }
  if (braces !== 0 || brackets !== 0 || inStr) return true;
  return /\u2026$|\.\.\.$|\[truncated\]|\[continued\]/i.test(s);
}

/** Strip code fences, extract the JSON envelope. */
function isolateJson(raw: string): string {
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Strip a leading "json" label if the model wrote one.
  s = s.replace(/^json\s*/i, "");
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  let start = -1;
  let openCh = "";
  if (firstObj === -1 && firstArr === -1) return s;
  if (firstArr === -1 || (firstObj !== -1 && firstObj < firstArr)) {
    start = firstObj;
    openCh = "{";
  } else {
    start = firstArr;
    openCh = "[";
  }
  const closeCh = openCh === "{" ? "}" : "]";
  const end = s.lastIndexOf(closeCh);
  if (start === -1 || end === -1 || end < start) return s;
  return s.substring(start, end + 1);
}

/**
 * Walk the string and:
 *  - escape raw control chars (\n, \r, \t, other <0x20) inside string values
 *  - escape stray backslashes that don't introduce a valid JSON escape
 * This makes markdown bodies with newlines / tabs / \d regex fragments parse.
 */
function sanitizeStrings(input: string): string {
  const out: string[] = [];
  let inStr = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (!inStr) {
      out.push(c);
      if (c === '"') inStr = true;
      continue;
    }
    if (c === '"') {
      out.push(c);
      inStr = false;
      continue;
    }
    if (c === "\\") {
      const next = input[i + 1];
      if (next && /["\\/bfnrtu]/.test(next)) {
        out.push(c, next);
        i++;
      } else {
        // Stray backslash — escape it.
        out.push("\\\\");
      }
      continue;
    }
    const code = c.charCodeAt(0);
    if (code < 0x20) {
      if (c === "\n") out.push("\\n");
      else if (c === "\r") out.push("\\r");
      else if (c === "\t") out.push("\\t");
      else if (c === "\b") out.push("\\b");
      else if (c === "\f") out.push("\\f");
      else out.push("\\u" + code.toString(16).padStart(4, "0"));
      continue;
    }
    out.push(c);
  }
  return out.join("");
}

function stripTrailingCommas(s: string): string {
  return s.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Given a JSON string offset from a SyntaxError, best-effort locate which
 * top-level field the offset lies within. Used only for error diagnostics.
 */
function locateField(cleaned: string, offset: number | undefined): string | undefined {
  if (offset == null || offset < 0) return undefined;
  const before = cleaned.slice(0, Math.min(offset, cleaned.length));
  // Walk backwards; find the nearest "field": pattern at depth 1.
  const re = /"([^"\\]{1,80})"\s*:/g;
  let last: string | undefined;
  let m: RegExpExecArray | null;
  while ((m = re.exec(before)) !== null) last = m[1];
  return last;
}

function extractOffset(err: unknown): number | undefined {
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.match(/position (\d+)/i) || msg.match(/at position (\d+)/i);
  return m ? Number(m[1]) : undefined;
}

/**
 * Parse a raw AI response into JSON. Throws AiJsonParseError with diagnostics.
 * Never mutates the caller's raw string; never manually concatenates JSON.
 */
export function parseAiJson<T = unknown>(raw: string): T {
  const truncated = detectTruncation(raw);
  const isolated = isolateJson(raw);

  // Attempt 1: strict.
  try {
    return JSON.parse(isolated) as T;
  } catch {
    /* fall through */
  }

  // Attempt 2: strip trailing commas.
  const noTrail = stripTrailingCommas(isolated);
  try {
    return JSON.parse(noTrail) as T;
  } catch {
    /* fall through */
  }

  // Attempt 3: escape control chars & stray backslashes inside strings.
  const sanitized = sanitizeStrings(noTrail);
  try {
    return JSON.parse(sanitized) as T;
  } catch (err) {
    const offset = extractOffset(err);
    const field = locateField(sanitized, offset);
    throw new AiJsonParseError({
      message: `AI returned invalid JSON${field ? ` (near field "${field}")` : ""}: ${(err as Error).message}`,
      raw,
      cleaned: sanitized,
      offset,
      field,
      truncated,
    });
  }
}

/** Convenience: parse and, on failure, run onError with diagnostics. */
export function tryParseAiJson<T = unknown>(
  raw: string,
  onError?: (err: AiJsonParseError) => void,
): T | null {
  try {
    return parseAiJson<T>(raw);
  } catch (err) {
    if (err instanceof AiJsonParseError && onError) onError(err);
    return null;
  }
}
