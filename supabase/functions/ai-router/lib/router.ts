/**
 * Task router. Maps a validated AiRouterRequest to a provider execution.
 *
 * Infrastructure milestone: returns a readiness acknowledgement without
 * invoking any upstream provider. When task handlers are enabled, replace
 * the readiness branch with a `providers[name].complete(...)` call wrapped
 * in `withRetry` from ./retry.ts.
 */
import type { Logger } from "./logger.ts";
import type { AiRouterRequest } from "./validate.ts";
import { DEFAULT_PROVIDER, providers } from "./providers.ts";

export interface RouterContext {
  signal: AbortSignal;
  log: Logger;
  requestId: string;
}

export interface RouterResult {
  success: true;
  message: string;
  requestId: string;
  task: string;
  provider: string;
}

export const router = {
  async handle(req: AiRouterRequest, ctx: RouterContext): Promise<RouterResult> {
    const providerName = req.provider ?? DEFAULT_PROVIDER;
    const provider = providers[providerName];
    if (!provider) {
      throw new Error(`unknown_provider:${providerName}`);
    }

    // Infrastructure-only response. Real task execution wires in here.
    // Example (future):
    //   const result = await withRetry(
    //     () => provider.complete(req, ctx),
    //     { signal: ctx.signal, retries: 3, baseDelayMs: 300 },
    //   );
    //   return { success: true, ...result };
    await Promise.resolve();

    return {
      success: true,
      message: "AI Router Ready",
      requestId: ctx.requestId,
      task: req.task,
      provider: providerName,
    };
  },
};
