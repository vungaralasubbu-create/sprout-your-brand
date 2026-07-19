/**
 * Glintr Engage — canonical types shared between server and client code.
 * Server-only helpers live in *.server.ts; server functions in *.functions.ts.
 */

export type EngageChannel = "email" | "push" | "inapp" | "sms";

export type EngageProviderKind =
  | "lovable"
  | "resend"
  | "sendgrid"
  | "ses"
  | "mailgun"
  | "postmark"
  | "brevo"
  | "smtp"
  | "gmail"
  | "outlook"
  | "webpush"
  | "fcm"
  | "onesignal"
  | "mailchimp"
  | "hubspot"
  | "customerio"
  | "klaviyo"
  | "twilio"
  | "whatsapp";

export type EngageTemplateCategory =
  | "transactional"
  | "onboarding"
  | "nurture"
  | "promotional"
  | "system"
  | "notification"
  | "newsletter";

export type EngageMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "unsubscribed"
  | "failed"
  | "suppressed";

export type EngageAudience =
  | "all"
  | "students"
  | "partners"
  | "brand_owners"
  | "instructors"
  | "admins"
  | "leads";

export type EngageScheduleType = "immediate" | "scheduled" | "recurring" | "best_time";

export type EngageCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "cancelled"
  | "failed";

export interface EngageSequenceStep {
  delay_hours: number;
  template_key: string;
  channel: EngageChannel;
  condition?: {
    field?: string;
    op?: "=" | "!=" | ">" | "<" | "exists" | "not_exists";
    value?: unknown;
  };
  variant?: string;
}

export interface EngageSegmentRule {
  field: string;
  op: "=" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "not_in" | "contains" | "exists" | "not_exists";
  value?: unknown;
}

export interface EngageSegmentRules {
  all?: EngageSegmentRule[];
  any?: EngageSegmentRule[];
}

export interface RenderedMessage {
  recipient: string;
  channel: EngageChannel;
  subject?: string;
  preview_text?: string;
  html?: string;
  text?: string;
  push_title?: string;
  push_body?: string;
  push_url?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  metadata?: Record<string, unknown>;
}

export interface SendResult {
  ok: boolean;
  provider_message_id?: string;
  provider?: string;
  status?: EngageMessageStatus;
  error_code?: string;
  error_message?: string;
  queued?: boolean;
}

export interface VerifyResult {
  ok: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

export interface WebhookEvent {
  provider: string;
  event: EngageMessageStatus;
  provider_message_id?: string;
  recipient?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
