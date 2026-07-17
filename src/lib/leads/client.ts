/**
 * Client-side helpers for the unified platform lead-capture system.
 *
 * Any surface (slide-in card, exit-intent, GlintrAI, brochure CTA…) submits
 * to `platform_leads` and logs analytics events to `platform_lead_events`.
 * The public INSERT policy allows anon submissions; RLS blocks reads.
 */
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const LeadStatuses = ["student", "working", "job_seeker", "other"] as const;
export const LeadSources = [
  "homepage",
  "ai",
  "popup",
  "brochure",
  "consultation",
  "exit_intent",
  "scroll",
  "returning_visitor",
  "demo",
  "roadmap",
  "cta",
  "course_page",
  "unknown",
] as const;
export type LeadSource = (typeof LeadSources)[number];

export const leadSchema = z
  .object({
    name: z.string().trim().max(120).optional().or(z.literal("")),
    email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    interested_course: z.string().trim().max(160).optional().or(z.literal("")),
    qualification: z.string().trim().max(120).optional().or(z.literal("")),
    current_status: z.enum(LeadStatuses).optional(),
    source: z.enum(LeadSources).default("unknown"),
    source_detail: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    page_path: z.string().max(500).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) => (v.email && v.email.length > 0) || (v.phone && v.phone.length > 0), {
    message: "Provide email or phone",
    path: ["email"],
  });


export type LeadInput = z.infer<typeof leadSchema>;

function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = q.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export async function submitLead(input: LeadInput): Promise<{ id: string }> {
  const parsed = leadSchema.parse(input);
  const utm = readUtm();
  const row = {
    ...parsed,
    ...utm,
    page_path: parsed.page_path ?? (typeof window !== "undefined" ? window.location.pathname : null),
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    metadata: (parsed.metadata ?? {}) as never,
  };
  const { data, error } = await supabase
    .from("platform_leads")
    .insert(row as never)
    .select("id")
    .single();
  if (error) throw error;


  // Permanent suppression of future popups after submit
  try {
    localStorage.setItem("glintr_popup_submitted_v1", "1");
    localStorage.setItem("glintr_lead_submitted_at", String(Date.now()));
  } catch {
    /* ignore */
  }
  await logLeadEvent({
    event_type: "popup_submit",
    source: parsed.source,
    lead_id: (data as { id: string }).id,
    metadata: { detail: parsed.source_detail ?? null },
  });
  return data as { id: string };
}

export interface LeadEventInput {
  event_type:
    | "popup_view"
    | "popup_close"
    | "popup_submit"
    | "ai_convert"
    | "brochure_download"
    | "consultation_book"
    | "roadmap_request"
    | "cta_click";
  source?: string;
  variant?: string;
  lead_id?: string;
  metadata?: Record<string, unknown>;
}

export async function logLeadEvent(evt: LeadEventInput): Promise<void> {
  try {
    await supabase.from("platform_lead_events").insert({
      event_type: evt.event_type,
      source: evt.source ?? null,
      variant: evt.variant ?? null,
      lead_id: evt.lead_id ?? null,
      page_path: typeof window !== "undefined" ? window.location.pathname : null,
      metadata: (evt.metadata ?? {}) as never,
    });
  } catch {
    /* silent — analytics must never break UX */
  }
}

export function hasSubmittedLead(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("glintr_popup_submitted_v1") === "1";
  } catch {
    return false;
  }
}
