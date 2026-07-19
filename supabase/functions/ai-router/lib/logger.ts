/**
 * Minimal structured logger. Emits single-line JSON so Supabase log ingestion
 * can index fields without regex parsing.
 */
type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

function emit(level: Level, msg: string, fields: Fields): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  child(fields: Fields): Logger;
}

function make(base: Fields): Logger {
  return {
    debug: (m, f = {}) => emit("debug", m, { ...base, ...f }),
    info: (m, f = {}) => emit("info", m, { ...base, ...f }),
    warn: (m, f = {}) => emit("warn", m, { ...base, ...f }),
    error: (m, f = {}) => emit("error", m, { ...base, ...f }),
    child: (f) => make({ ...base, ...f }),
  };
}

export const logger: Logger = make({ svc: "ai-router" });
