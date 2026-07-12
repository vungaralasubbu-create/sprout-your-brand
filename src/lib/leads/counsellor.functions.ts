import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  program_interest: z.string().trim().max(200).optional().nullable(),
  preferred_contact_time: z.string().trim().max(80).optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
  course_name: z.string().trim().max(200).optional().nullable(),
  category_name: z.string().trim().max(120).optional().nullable(),
  partner_code: z.string().trim().max(40).optional().nullable(),
  referral_session: z.string().trim().max(120).optional().nullable(),
  consent: z.literal(true),
  // Honeypot: bots often fill this hidden field.
  website: z.string().max(0).optional().default(""),
});

export const submitCounsellorLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve partner_code → owner_partner_id (best-effort).
    let owner_partner_id: string | null = null;
    if (data.partner_code) {
      const { data: p } = await supabaseAdmin
        .from("partners")
        .select("id")
        .eq("partner_code", data.partner_code)
        .maybeSingle();
      owner_partner_id = p?.id ?? null;
    }

    const notesParts: string[] = [];
    if (data.category_name) notesParts.push(`Category: ${data.category_name}`);
    if (data.course_name) notesParts.push(`Course: ${data.course_name}`);
    if (data.partner_code) notesParts.push(`Referral code: ${data.partner_code}`);
    if (data.referral_session) notesParts.push(`Session: ${data.referral_session}`);

    const { error } = await supabaseAdmin.from("partner_leads").insert({
      lead_model: owner_partner_id ? "own_leads" : "not_sure",
      source: "website_counsellor",
      full_name: data.full_name,
      mobile: data.mobile,
      email: data.email ?? null,
      city: data.city ?? null,
      program_interest: data.program_interest ?? data.course_name ?? null,
      preferred_contact_time: data.preferred_contact_time ?? null,
      course_id: data.course_id ?? null,
      owner_partner_id,
      status: "new",
      attribution_status: "admin_review",
      notes: notesParts.join(" · ") || null,
    });

    if (error) {
      console.error("[counsellor lead] insert failed", error.message);
      return { ok: false as const, error: "We couldn't save your request. Please try again." };
    }
    return { ok: true as const };
  });
