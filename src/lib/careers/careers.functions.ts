import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  role_id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  mobile: z.string().trim().min(6).max(20),
  current_location: z.string().trim().max(120).optional().nullable(),
  linkedin_url: z.string().trim().url().max(300).optional().nullable().or(z.literal("")),
  portfolio_url: z.string().trim().url().max(300).optional().nullable().or(z.literal("")),
  resume_path: z.string().trim().max(500).optional().nullable(),
  cover_note: z.string().trim().max(4000).optional().nullable(),
  experience_summary: z.string().trim().max(2000).optional().nullable(),
  consent_status: z.literal(true),
  website: z.string().max(0).optional().default(""), // honeypot
});

export const submitCareerApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: role, error: roleErr } = await supabaseAdmin
      .from("hiring_roles")
      .select("id, title, status, is_published, application_close_at")
      .eq("id", data.role_id)
      .maybeSingle();

    if (roleErr || !role) {
      return { ok: false as const, error: "This role is no longer available." };
    }
    if (!role.is_published || role.status !== "open") {
      return { ok: false as const, error: "This role is not accepting applications." };
    }
    if (role.application_close_at && new Date(role.application_close_at) < new Date()) {
      return { ok: false as const, error: "The application window for this role is closed." };
    }

    // Dedupe by (role_id, lower(email)) — enforced by unique index too.
    const { data: existing } = await supabaseAdmin
      .from("hiring_applications")
      .select("id")
      .eq("role_id", data.role_id)
      .ilike("email", data.email)
      .maybeSingle();
    if (existing) {
      return {
        ok: false as const,
        error: "You have already applied to this role. Our team will get back to you.",
      };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("hiring_applications")
      .insert({
        role_id: data.role_id,
        full_name: data.full_name,
        email: data.email,
        mobile: data.mobile,
        current_location: data.current_location ?? null,
        linkedin_url: data.linkedin_url || null,
        portfolio_url: data.portfolio_url || null,
        resume_path: data.resume_path ?? null,
        cover_note: data.cover_note ?? null,
        experience_summary: data.experience_summary ?? null,
        source: "careers_page",
        consent_status: true,
        application_status: "submitted",
      })
      .select("application_code")
      .single();

    if (error) {
      console.error("[career application] insert failed", error.message);
      return { ok: false as const, error: "We couldn't submit your application. Please try again." };
    }

    return { ok: true as const, application_code: inserted?.application_code ?? null };
  });
