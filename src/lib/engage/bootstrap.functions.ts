/**
 * Bootstraps the platform's system templates + default sequences. Safe to
 * run repeatedly — uses upsert on (template_key, channel, locale, version).
 * Called from the Admin Engage UI's "Seed defaults" button.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SYSTEM_TEMPLATES, SYSTEM_SEQUENCES } from "./constants";
import { defaultHtml } from "./render.server";

export const bootstrapEngageDefaults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin && !isSuper) {
      return { ok: false as const, error: "Only admins can seed defaults." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let templatesUpserted = 0;
    for (const spec of SYSTEM_TEMPLATES) {
      const html = defaultHtml({
        headline: spec.headline,
        body: spec.body,
        cta_label: spec.cta_label,
        cta_url: spec.cta_url,
        preview: spec.preview,
      });
      const text = `${spec.headline}\n\n${spec.body}${
        spec.cta_url ? `\n\n${spec.cta_label ?? "Open"}: ${spec.cta_url}` : ""
      }`;

      const { error } = await supabaseAdmin
        .from("engage_templates")
        .upsert(
          {
            tenant_scope: "platform",
            brand_id: null,
            template_key: spec.key,
            channel: spec.channel,
            category: spec.category,
            name: spec.name,
            subject: spec.subject,
            preview_text: spec.preview,
            body_html: html,
            body_text: text,
            body_json: null,
            locale: "en",
            version: 1,
            is_active: true,
            is_system: true,
          },
          { onConflict: "brand_id,template_key,channel,locale,version" as never },
        );
      if (!error) templatesUpserted++;
    }

    let sequencesUpserted = 0;
    for (const seq of SYSTEM_SEQUENCES) {
      const { error } = await supabaseAdmin
        .from("engage_sequences")
        .upsert(
          {
            tenant_scope: "platform",
            brand_id: null,
            name: seq.name,
            description: seq.description,
            trigger_event: seq.trigger_event,
            audience: seq.audience,
            steps: seq.steps as never,
            is_active: true,
            is_system: true,
          },
          { onConflict: "name" as never, ignoreDuplicates: true },
        );
      if (!error) sequencesUpserted++;
    }

    return {
      ok: true as const,
      templates: templatesUpserted,
      sequences: sequencesUpserted,
    };
  });
