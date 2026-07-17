/**
 * Unified entry point for the GlintrAI assistant.
 *
 * Every "Ask GlintrAI" button across the platform should call `openGlintrAI()`
 * so all AI interactions land in the SAME conversation with the SAME history
 * and the SAME lead-capture flow. Do NOT introduce alternate AI chat surfaces.
 */
export const GLINTR_AI_OPEN_EVENT = "glintr:open-ai";

export type OpenGlintrAIDetail = {
  /** Optional pre-filled question to seed the composer with. */
  prompt?: string;
  /** Optional source label for analytics ("faqs", "glossary", "learn", …). */
  source?: string;
};

export function openGlintrAI(detail: OpenGlintrAIDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GLINTR_AI_OPEN_EVENT, { detail }));
}
