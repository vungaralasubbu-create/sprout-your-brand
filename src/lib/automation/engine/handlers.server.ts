/**
 * Handler registry. Add new automation workflows by registering a Handler here.
 * Each handler returns HandlerResult { ok, data?, followUps?, notifications? }.
 */
import type { Handler, HandlerContext, HandlerResult } from "./types";
import * as builtin from "./handlers/index";

const registry = new Map<string, Handler>();

export function registerHandler(code: string, fn: Handler) {
  registry.set(code, fn);
}

export function getHandler(code: string): Handler | undefined {
  return registry.get(code);
}

export function listHandlers(): string[] {
  return Array.from(registry.keys());
}

// Register built-ins on module load.
for (const [code, fn] of Object.entries(builtin.handlers)) {
  registerHandler(code, fn as Handler);
}

export type { Handler, HandlerContext, HandlerResult };
