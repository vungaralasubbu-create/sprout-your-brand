/**
 * Provider adapter registry. Each adapter implements a common interface;
 * adding a new provider = one file + one registry entry.
 */

import type {
  EngageProviderKind,
  RenderedMessage,
  SendResult,
  VerifyResult,
  WebhookEvent,
} from "../types";

export interface ProviderConfig {
  kind: EngageProviderKind;
  config: Record<string, unknown>;
  secret?: string | null;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
}

export interface EngageProviderAdapter {
  kind: EngageProviderKind;
  displayName: string;
  channel: "email" | "push" | "sms";
  supportsWebhooks: boolean;
  verify(config: ProviderConfig): Promise<VerifyResult>;
  send(config: ProviderConfig, message: RenderedMessage): Promise<SendResult>;
  parseWebhook?(request: Request): Promise<WebhookEvent[]>;
}

const registry = new Map<EngageProviderKind, EngageProviderAdapter>();

export function registerProvider(adapter: EngageProviderAdapter): void {
  registry.set(adapter.kind, adapter);
}

export function getProvider(kind: EngageProviderKind): EngageProviderAdapter | undefined {
  return registry.get(kind);
}

export function listProviders(): EngageProviderAdapter[] {
  return Array.from(registry.values());
}

// Auto-register the built-in adapters.
import { lovableAdapter } from "./lovable.server";
import { resendAdapter } from "./resend.server";
import { sendgridAdapter } from "./sendgrid.server";
import { postmarkAdapter } from "./postmark.server";
import { mailgunAdapter } from "./mailgun.server";
import { brevoAdapter } from "./brevo.server";
import { sesAdapter } from "./ses.server";
import { smtpAdapter } from "./smtp.server";
import { webpushAdapter } from "./webpush.server";

registerProvider(lovableAdapter);
registerProvider(resendAdapter);
registerProvider(sendgridAdapter);
registerProvider(postmarkAdapter);
registerProvider(mailgunAdapter);
registerProvider(brevoAdapter);
registerProvider(sesAdapter);
registerProvider(smtpAdapter);
registerProvider(webpushAdapter);
