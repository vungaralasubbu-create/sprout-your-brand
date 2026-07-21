/**
 * Brand Context Engine — server functions.
 *
 * Diagnostics + cache invalidation for the centralized context loader.
 * Any admin / developer diagnostics panel can call `getAiContextDiagnostics`
 * to see what the AI will actually receive for the current user.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  buildAiContext,
  invalidateAiContext,
} from "@/lib/marketing-os/brand-context-engine.server";

export const getAiContextDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        query: z.string().max(2000).optional(),
        includeKnowledge: z.boolean().optional(),
        includeMemory: z.boolean().optional(),
        fresh: z.boolean().optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { systemPrompt, diagnostics } = await buildAiContext(
      context.supabase as any,
      context.userId,
      data,
    );
    return {
      diagnostics,
      preview: systemPrompt.slice(0, 4000),
    };
  });

export const clearAiContextCache = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    invalidateAiContext(context.userId);
    return { ok: true };
  });
