/**
 * Global lead-capture event bus.
 * Any component can call `openLeadForm({ source, ... })` to trigger the
 * premium form (mounted once in __root as <LeadCaptureRoot />).
 */
import type { LeadSource } from "./client";

export interface OpenLeadFormPayload {
  source: LeadSource;
  headline?: string;
  subheadline?: string;
  cta?: string;
  requirePhone?: boolean;
  interested_course?: string;
  source_detail?: string;
  metadata?: Record<string, unknown>;
  /** Called after successful submit; receives lead id. */
  onSubmitted?: (leadId: string) => void;
}

export const LEAD_OPEN_EVENT = "glintr:open-lead-form";

export function openLeadForm(payload: OpenLeadFormPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LEAD_OPEN_EVENT, { detail: payload }));
}
