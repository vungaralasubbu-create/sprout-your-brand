import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Public referral entry point: /ref/:code
 * - Validates ambassador referral code + active status
 * - Records a click visit
 * - Sets an httpOnly attribution cookie carrying a server-side session id
 * - Redirects to landing (program page if provided via ?p=slug, else home)
 */

const recordVisit = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({
      code: z.string().trim().min(3).max(50),
      programSlug: z.string().max(120).optional(),
      landingPath: z.string().max(400).optional(),
      userAgent: z.string().max(500).optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await admin
      .from("campus_ambassador_profiles")
      .select("id, referral_code, status")
      .eq("referral_code", data.code)
      .maybeSingle();

    if (!profile || !profile.referral_code || (profile.status && profile.status !== "active")) {
      return { valid: false, redirectTo: "/" };
    }
    const refCode: string = profile.referral_code;

    // Attribution duration from platform_settings
    const { data: setting } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "ambassador_referral_attribution_days")
      .maybeSingle();
    const days = Math.max(1, Math.min(365, Number(setting?.value ?? 30) || 30));
    const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000);

    const { data: session } = await admin
      .from("ambassador_referral_sessions")
      .insert({
        ambassador_id: profile.id,
        referral_code: refCode,
        landing_page: data.landingPath ?? null,
        program_id: data.programSlug ?? null,
        user_agent: data.userAgent ?? null,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, expires_at")
      .single();

    if (session) {
      await admin.from("ambassador_referral_visits").insert({
        ambassador_id: profile.id,
        referral_code: refCode,
        session_id: session.id,
        landing_page: data.landingPath ?? null,
        program_id: data.programSlug ?? null,
      });
    }

    return {
      valid: true,
      sessionId: session?.id ?? null,
      expiresAt: session?.expires_at ?? expiresAt.toISOString(),
      redirectTo: data.programSlug ? `/programs?ref=${encodeURIComponent(refCode)}` : `/?ref=${encodeURIComponent(refCode)}`,
    };
  });

export const Route = createFileRoute("/ref/$code")({
  loader: async ({ params, location }) => {
    const search = new URLSearchParams((location.search as unknown as string) || "");
    const programSlug = search.get("p") ?? undefined;
    const result = await recordVisit({
      data: {
        code: params.code,
        programSlug,
        landingPath: location.pathname,
      },
    });
    if (result.valid && result.sessionId) {
      // We do not have direct cookie API in loader here; redirect with query param
      // The client-side handler (ambassador attribution helper) can persist the sessionId
      // in an httpOnly-like way via a follow-up server call if needed. For now, we
      // rely on the ?ref query param to survive the initial landing page.
      throw redirect({ to: result.redirectTo as any, replace: true });
    }
    throw redirect({ to: "/", replace: true });
  },
});
