import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Reads the `sales_otp_enabled` flag from `platform_settings`.
 * Defaults to `false` when unset or unreachable, so the GlintrAI widget
 * degrades to plain phone capture instead of blocking the conversation.
 */
export const getSalesOtpConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const key = process.env.SUPABASE_PUBLISHABLE_KEY;
      const url = process.env.SUPABASE_URL;
      if (!key || !url) return { enabled: false as const };
      const supabasePublic = createClient<Database>(url, key, {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
              h.delete("Authorization");
            }
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          },
        },
      });
      const { data } = await supabasePublic
        .from("platform_settings")
        .select("value")
        .eq("key", "sales_otp_enabled")
        .maybeSingle();
      const raw = (data?.value ?? "").toString().toLowerCase();
      return { enabled: raw === "true" || raw === "1" || raw === "on" };
    } catch {
      return { enabled: false as const };
    }
  },
);
