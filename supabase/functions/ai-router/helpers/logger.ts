// Structured JSON logger. Never log API keys or full prompts.
type Level = "info" | "warn" | "error";

interface LogFields {
  requestId?: string;
  provider?: string | null;
  task?: string | null;
  executionMs?: number;
  status?: number;
  errorCode?: string;
  message?: string;
  [k: string]: unknown;
}

const SENSITIVE_KEYS = /^(authorization|api[_-]?key|secret|token|password)$/i;

function scrub(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (SENSITIVE_KEYS.test(k)) continue;
    out[k] = v;
  }
  return out;
}

function emit(level: Level, fields: LogFields) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: "ai-router",
    ...scrub(fields),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (fields: LogFields) => emit("info", fields),
  warn: (fields: LogFields) => emit("warn", fields),
  error: (fields: LogFields) => emit("error", fields),
};
