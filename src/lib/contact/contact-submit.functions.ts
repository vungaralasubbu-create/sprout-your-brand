import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { createHash } from "crypto";
import { z } from "zod";

import { redactSensitiveText } from "@/lib/student-support/student-support.functions";
import { CONTACT_INTENTS, normaliseContactIntent } from "./contact.functions";

// -------------------------------------------------------------
// Routing allow-list. Public frontends never send raw destinations —
// they send a topic; the server maps to an internal destination.
// -------------------------------------------------------------
const ROUTING_MAP: Record<string, string> = {
  general: "general_inbox",
  partnership: "partnerships",
  institution: "institutions",
  business: "business",
  media: "media",
  careers: "careers",
  other: "general_inbox",
};

// student_support / partner_support are intentionally NOT accepted here.
// Those must be filed through the Student Support / Partner Support flows.
const SUBMITTABLE_INTENTS = new Set([
  "general",
  "partnership",
  "institution",
  "business",
  "media",
  "careers",
  "other",
]);

const SUBMITTABLE_TOPIC_ENUM = z.enum([
  "general",
  "partnership",
  "institution",
  "business",
  "media",
  "careers",
  "other",
]);

const SOURCE_ENUM = z.enum(["contact_page", "ai_prepared", "router", "manual_topic"]);

// Basic email format check. Format validation is not identity verification.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const SubmitInputSchema = z.object({
  topic: z.string(),
  name: z.string(),
  email: z.string(),
  organisation: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  source: z.string().optional(),
  idempotencyKey: z.string().min(8).max(128),
  // honeypot — must be empty for humans
  website: z.string().optional().default(""),
  // client submit-open timestamp for a soft timing heuristic
  formOpenedAt: z.number().int().nonnegative().optional(),
});

type FieldErrors = Partial<Record<
  "topic" | "name" | "email" | "organisation" | "title" | "summary",
  string
>>;

type SubmitResult =
  | {
      ok: true;
      duplicate?: false;
      reference: string;
      topic: string;
      title: string;
      submittedAt: string;
    }
  | {
      ok: true;
      duplicate: true;
      reference: string;
      topic: string;
      title: string;
      submittedAt: string;
    }
  | { ok: false; kind: "validation"; fieldErrors: FieldErrors; message: string }
  | { ok: false; kind: "redirect_student_support"; message: string }
  | { ok: false; kind: "redirect_partner_support"; message: string }
  | { ok: false; kind: "rate_limited"; message: string }
  | { ok: false; kind: "duplicate_recent"; reference: string; topic: string; submittedAt: string; message: string }
  | { ok: false; kind: "error"; message: string };

// -------------------------------------------------------------
// Field-level validation, backend authoritative
// -------------------------------------------------------------
function validateFields(raw: {
  topic: string;
  name: string;
  email: string;
  organisation?: string;
  title: string;
  summary: string;
}): { errors: FieldErrors; cleaned: {
  topic: (typeof SUBMITTABLE_TOPIC_ENUM._def.values)[number];
  name: string;
  email: string;
  organisation: string | null;
  title: string;
  summary: string;
} | null } {
  const errors: FieldErrors = {};

  const intent = normaliseContactIntent(raw.topic);
  const topicParse = SUBMITTABLE_TOPIC_ENUM.safeParse(intent);
  if (!topicParse.success || !SUBMITTABLE_INTENTS.has(intent)) {
    errors.topic = "Choose a Contact topic.";
  }

  const name = redactSensitiveText((raw.name ?? "").trim());
  if (name.length < 2) errors.name = "Enter your name.";
  else if (name.length > 120) errors.name = "Name is too long.";

  const email = (raw.email ?? "").trim();
  if (!email) errors.email = "Enter your email address.";
  else if (email.length > 254 || !EMAIL_RE.test(email))
    errors.email = "Enter a valid email address.";

  const organisationRaw = redactSensitiveText((raw.organisation ?? "").trim());
  const organisation = organisationRaw.length ? organisationRaw : null;
  if (organisation && organisation.length > 200) {
    errors.organisation = "Organisation name is too long.";
  }
  // Institution enquiries require an institution value.
  if (topicParse.success && topicParse.data === "institution" && !organisation) {
    errors.organisation = "Enter your college or institution.";
  }

  const title = redactSensitiveText((raw.title ?? "").trim());
  if (title.length < 4) errors.title = "Add an enquiry title.";
  else if (title.length > 120) errors.title = "Enquiry title is too long.";

  const summary = redactSensitiveText((raw.summary ?? "").trim());
  if (summary.length < 20) errors.summary = "Tell us what you want to discuss.";
  else if (summary.length > 2400) errors.summary = "Enquiry summary is too long.";

  if (Object.keys(errors).length > 0 || !topicParse.success) {
    return { errors, cleaned: null };
  }

  return {
    errors,
    cleaned: {
      topic: topicParse.data,
      name,
      email,
      organisation,
      title,
      summary,
    },
  };
}

function hashIp(ip: string | undefined): string {
  const salt = process.env.CONTACT_ENQUIRY_IP_SALT ?? process.env.SUPABASE_PROJECT_ID ?? "glintr";
  return createHash("sha256").update(`${salt}::${ip ?? "unknown"}`).digest("hex").slice(0, 32);
}

function detectStudentIssue(text: string): boolean {
  const t = text.toLowerCase();
  const strong = [
    "my program",
    "my enrollment",
    "my enrolment",
    "my certificate",
    "my assessment",
    "my learning",
    "my module",
    "my lesson",
    "my progress",
    "cannot access my",
    "can't access my",
    "unlock my program",
  ];
  return strong.some((k) => t.includes(k));
}

function detectPartnerIssue(text: string): boolean {
  const t = text.toLowerCase();
  const strong = [
    "my payout",
    "my commission",
    "my sales partner",
    "my campus ambassador",
    "my referral",
    "as a partner",
    "as an ambassador",
  ];
  return strong.some((k) => t.includes(k));
}

// -------------------------------------------------------------
// Server function
// -------------------------------------------------------------
export const submitContactEnquiry = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => SubmitInputSchema.parse(raw))
  .handler(async ({ data }): Promise<SubmitResult> => {
    // Honeypot: silently succeed-look but do not create record.
    if ((data.website ?? "").trim().length > 0) {
      return {
        ok: true,
        reference: "CON-XXXXXXX",
        topic: "general",
        title: (data.title ?? "").slice(0, 120),
        submittedAt: new Date().toISOString(),
      };
    }

    // Field validation
    const { errors, cleaned } = validateFields({
      topic: data.topic,
      name: data.name,
      email: data.email,
      organisation: data.organisation,
      title: data.title,
      summary: data.summary,
    });
    if (!cleaned) {
      return {
        ok: false,
        kind: "validation",
        fieldErrors: errors,
        message: "Please review the highlighted fields.",
      };
    }

    // Redirect account-specific student / partner issues before creating a record.
    const combined = `${cleaned.title}\n${cleaned.summary}`;
    if (detectStudentIssue(combined)) {
      return {
        ok: false,
        kind: "redirect_student_support",
        message:
          "This enquiry looks like an existing Student Support issue. Please use Student Support so account-specific learning context can be reviewed securely.",
      };
    }
    if (detectPartnerIssue(combined)) {
      return {
        ok: false,
        kind: "redirect_partner_support",
        message:
          "This enquiry looks like an existing Partner Support issue. Please use Partner Support.",
      };
    }

    const source = SOURCE_ENUM.safeParse(data.source ?? "contact_page");
    const submissionSource = source.success ? source.data : "contact_page";
    const routing = ROUTING_MAP[cleaned.topic] ?? "general_inbox";
    const emailNorm = cleaned.email.toLowerCase();
    const titleNorm = cleaned.title.toLowerCase().replace(/\s+/g, " ").trim();

    // IP hashing for rate limiting; never stored raw.
    let ip: string | undefined;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? undefined;
    } catch {
      ip = undefined;
    }
    // Fallback fingerprint: user-agent + accept-language
    let uaHint = "";
    try {
      uaHint = `${getRequestHeader("user-agent") ?? ""}|${getRequestHeader("accept-language") ?? ""}`;
    } catch {
      uaHint = "";
    }
    const ipHash = hashIp(ip ? ip : `ua:${uaHint}`);

    let admin;
    try {
      const mod = await import("@/integrations/supabase/client.server");
      admin = mod.supabaseAdmin;
    } catch {
      return { ok: false, kind: "error", message: "Contact submission is temporarily unavailable." };
    }

    // Idempotency short-circuit
    {
      const { data: existing, error } = await admin
        .from("contact_enquiries")
        .select("reference, topic, title, created_at")
        .eq("idempotency_key", data.idempotencyKey)
        .maybeSingle();
      if (!error && existing?.reference) {
        return {
          ok: true,
          reference: existing.reference,
          topic: existing.topic as string,
          title: existing.title as string,
          submittedAt: existing.created_at as string,
        };
      }
    }

    // Rate limit: >=5 enquiries in last 15 minutes by ip_hash OR email
    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: recentByIp } = await admin
      .from("contact_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", windowStart);
    const { count: recentByEmail } = await admin
      .from("contact_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("email_normalised", emailNorm)
      .gte("created_at", windowStart);

    if ((recentByIp ?? 0) >= 5 || (recentByEmail ?? 0) >= 5) {
      return {
        ok: false,
        kind: "rate_limited",
        message: "Please wait before trying to send another Contact enquiry.",
      };
    }

    // Duplicate detection: same email + topic + title in last 24h.
    const dupWindow = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dup } = await admin
      .from("contact_enquiries")
      .select("reference, topic, created_at, title_normalised")
      .eq("email_normalised", emailNorm)
      .eq("topic", cleaned.topic)
      .gte("created_at", dupWindow)
      .order("created_at", { ascending: false })
      .limit(3);

    const dupHit = (dup ?? []).find((r) => (r.title_normalised as string) === titleNorm);
    if (dupHit) {
      return {
        ok: false,
        kind: "duplicate_recent",
        reference: dupHit.reference as string,
        topic: dupHit.topic as string,
        submittedAt: dupHit.created_at as string,
        message:
          "A similar enquiry may already have been sent recently. Please check before sending another.",
      };
    }

    // Attempt to resolve current user id if a valid bearer is attached.
    // Optional — do NOT fail submission if unauthenticated.
    let userId: string | null = null;
    try {
      const authHeader = getRequestHeader("authorization");
      if (authHeader?.toLowerCase().startsWith("bearer ")) {
        const token = authHeader.slice(7).trim();
        if (token.length > 0) {
          const { data: userData } = await admin.auth.getUser(token);
          userId = userData?.user?.id ?? null;
        }
      }
    } catch {
      userId = null;
    }

    // Insert
    const { data: inserted, error: insertError } = await admin
      .from("contact_enquiries")
      .insert({
        topic: cleaned.topic,
        routing_destination: routing,
        name: cleaned.name,
        email: cleaned.email,
        email_normalised: emailNorm,
        organisation: cleaned.organisation,
        title: cleaned.title,
        summary: cleaned.summary,
        title_normalised: titleNorm,
        submission_source: submissionSource,
        status: "submitted",
        user_id: userId,
        idempotency_key: data.idempotencyKey,
        ip_hash: ipHash,
      })
      .select("reference, topic, title, created_at")
      .single();

    if (insertError || !inserted) {
      // Unique-violation on idempotency_key → re-read the record.
      const { data: retry } = await admin
        .from("contact_enquiries")
        .select("reference, topic, title, created_at")
        .eq("idempotency_key", data.idempotencyKey)
        .maybeSingle();
      if (retry?.reference) {
        return {
          ok: true,
          reference: retry.reference,
          topic: retry.topic as string,
          title: retry.title as string,
          submittedAt: retry.created_at as string,
        };
      }
      return {
        ok: false,
        kind: "error",
        message: "Your enquiry has not been confirmed as sent. Please try again.",
      };
    }

    return {
      ok: true,
      reference: inserted.reference as string,
      topic: inserted.topic as string,
      title: inserted.title as string,
      submittedAt: inserted.created_at as string,
    };
  });

// Export types & topic list for the client
export const SUBMITTABLE_TOPICS = [
  "general",
  "partnership",
  "institution",
  "business",
  "media",
  "careers",
  "other",
] as const;
export type SubmittableTopic = (typeof SUBMITTABLE_TOPICS)[number];
export type ContactSubmitResult = SubmitResult;

// Re-export CONTACT_INTENTS to help callers avoid pulling from two files.
export { CONTACT_INTENTS };
