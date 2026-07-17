/**
 * Partner Earnings Marketing Copy — CMS server functions.
 *
 * - Read is public (RLS policy allows anon SELECT on `marketing.%` keys).
 * - Write is admin-only, gated by `is_admin(auth.uid())` in RLS AND a
 *   defence-in-depth check inside the handler.
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  DEFAULT_PARTNER_EARNINGS_COPY,
  PARTNER_EARNINGS_COPY_KEY,
  partnerEarningsCopySchema,
  type PartnerEarningsCopy,
} from "@/data/partner-earnings-copy-schema";

function serverPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function parseValue(raw: string | null): PartnerEarningsCopy {
  if (!raw) return DEFAULT_PARTNER_EARNINGS_COPY;
  try {
    const parsed = partnerEarningsCopySchema.parse(JSON.parse(raw));
    return parsed;
  } catch {
    return DEFAULT_PARTNER_EARNINGS_COPY;
  }
}

export const fetchPartnerEarningsCopy = createServerFn({ method: "GET" }).handler(
  async (): Promise<PartnerEarningsCopy> => {
    const supabase = serverPublicClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", PARTNER_EARNINGS_COPY_KEY)
      .maybeSingle();
    if (error) return DEFAULT_PARTNER_EARNINGS_COPY;
    return parseValue(data?.value ?? null);
  },
);

export const savePartnerEarningsCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => partnerEarningsCopySchema.parse(data))
  .handler(async ({ data, context }): Promise<PartnerEarningsCopy> => {
    const { data: isAdminData, error: isAdminErr } = await context.supabase.rpc(
      "is_admin",
      { _user_id: context.userId },
    );
    if (isAdminErr || !isAdminData) {
      throw new Response("Forbidden", { status: 403 });
    }

    const value = JSON.stringify(data);
    const { error } = await context.supabase
      .from("platform_settings")
      .upsert(
        { key: PARTNER_EARNINGS_COPY_KEY, value, updated_by: context.userId },
        { onConflict: "key" },
      );
    if (error) throw new Response(error.message, { status: 500 });
    return data;
  });

export const _internalSchemaCheck = z.object({}); // keep tree-shaker honest
