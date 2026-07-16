/**
 * Integration Hub — Catalog
 *
 * Central catalog of every third-party integration Glintr can surface,
 * grouped by category. This is presentation-only metadata (name, blurb,
 * fields required to "connect"). Real credential storage should graduate
 * to server-side encrypted storage via App User Connectors — see
 * `storage.ts` for the current client-side stub.
 */

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  Building2,
  Calendar,
  Cloud,
  CreditCard,
  Database,
  KeyRound,
  Mail,
  MessageSquare,
  ShieldCheck,
  Video,
} from "lucide-react";

export type CategoryId =
  | "communication"
  | "payments"
  | "crm"
  | "calendar"
  | "video"
  | "storage"
  | "marketing"
  | "analytics"
  | "hr"
  | "auth"
  | "ai"
  | "developer";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { id: "communication", name: "Communication", blurb: "Email, chat, WhatsApp, SMS", icon: MessageSquare },
  { id: "payments", name: "Payments", blurb: "Accept payments in India and globally", icon: CreditCard },
  { id: "video", name: "Video Meetings", blurb: "Live classes and interviews", icon: Video },
  { id: "calendar", name: "Calendar", blurb: "Sync classes, interviews, events", icon: Calendar },
  { id: "storage", name: "Storage", blurb: "Backups and media assets", icon: Cloud },
  { id: "marketing", name: "Marketing", blurb: "Pixels, analytics, email platforms", icon: BarChart3 },
  { id: "analytics", name: "Analytics", blurb: "Product and traffic analytics", icon: BarChart3 },
  { id: "crm", name: "CRM", blurb: "Sync leads and contacts", icon: Building2 },
  { id: "hr", name: "HR & Ops", blurb: "Payroll, attendance, HRIS", icon: ShieldCheck },
  { id: "auth", name: "Authentication", blurb: "Single sign-on providers", icon: KeyRound },
  { id: "ai", name: "AI Providers", blurb: "OpenAI, Anthropic, Gemini, custom LLMs", icon: BrainCircuit },
  { id: "developer", name: "Developer", blurb: "API keys, webhooks, sandbox", icon: Database },
];

export type FieldKind = "text" | "secret" | "url" | "email" | "toggle" | "select";

export interface ProviderField {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  options?: string[]; // for `select`
  help?: string;
  optional?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  category: CategoryId;
  blurb: string;
  fields: ProviderField[];
  supportsDefault?: boolean; // e.g. default payment gateway
  status?: "stable" | "beta" | "future";
  docs?: string;
}

const K_APIKEY: ProviderField = { key: "key_id", label: "Key ID", kind: "text", placeholder: "rzp_live_xxxxxxxxx" };
const K_SECRET: ProviderField = { key: "key_secret", label: "Key Secret", kind: "secret" };

// eslint-disable-next-line max-lines
export const PROVIDERS: Provider[] = [
  // --- Payments ------------------------------------------------------------
  { id: "razorpay", name: "Razorpay", category: "payments", blurb: "India-first UPI, cards, wallets, netbanking.", supportsDefault: true, fields: [K_APIKEY, K_SECRET, { key: "webhook_secret", label: "Webhook secret", kind: "secret", optional: true }] },
  { id: "stripe", name: "Stripe", category: "payments", blurb: "Global card payments and subscriptions.", supportsDefault: true, fields: [{ key: "publishable", label: "Publishable key", kind: "text" }, { key: "secret", label: "Secret key", kind: "secret" }, { key: "webhook_secret", label: "Webhook secret", kind: "secret", optional: true }] },
  { id: "paypal", name: "PayPal", category: "payments", blurb: "International payments and payouts.", supportsDefault: true, fields: [{ key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }, { key: "env", label: "Environment", kind: "select", options: ["sandbox", "live"] }] },
  { id: "cashfree", name: "Cashfree", category: "payments", blurb: "Indian gateway with fast payouts.", supportsDefault: true, fields: [{ key: "app_id", label: "App ID", kind: "text" }, { key: "app_secret", label: "App secret", kind: "secret" }] },
  { id: "phonepe", name: "PhonePe", category: "payments", blurb: "UPI-first gateway.", status: "future", supportsDefault: true, fields: [{ key: "merchant_id", label: "Merchant ID", kind: "text" }] },
  { id: "upi", name: "UPI (Direct)", category: "payments", blurb: "Static VPA + QR for zero-fee collections.", supportsDefault: true, fields: [{ key: "vpa", label: "VPA / UPI ID", kind: "text", placeholder: "glintr@upi" }, { key: "merchant_name", label: "Merchant name", kind: "text" }] },
  { id: "bank", name: "Bank Transfer", category: "payments", blurb: "IMPS / NEFT / RTGS instructions.", supportsDefault: true, fields: [{ key: "account_name", label: "Account name", kind: "text" }, { key: "account_number", label: "Account number", kind: "text" }, { key: "ifsc", label: "IFSC", kind: "text" }] },

  // --- Communication ------------------------------------------------------
  { id: "gmail", name: "Gmail", category: "communication", blurb: "Send transactional and campaign emails via Gmail.", fields: [{ key: "email", label: "Account email", kind: "email" }, { key: "app_password", label: "App password", kind: "secret" }] },
  { id: "outlook", name: "Microsoft Outlook", category: "communication", blurb: "Send email via Microsoft 365 / Outlook.", fields: [{ key: "tenant_id", label: "Tenant ID", kind: "text" }, { key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "whatsapp", name: "WhatsApp Business", category: "communication", blurb: "WhatsApp Cloud API for notifications and 1:1 chat.", fields: [{ key: "phone_number_id", label: "Phone number ID", kind: "text" }, { key: "access_token", label: "Access token", kind: "secret" }, { key: "webhook_token", label: "Webhook verify token", kind: "secret", optional: true }] },
  { id: "telegram", name: "Telegram", category: "communication", blurb: "Community bots and channel broadcasts.", fields: [{ key: "bot_token", label: "Bot token", kind: "secret" }] },
  { id: "slack", name: "Slack", category: "communication", blurb: "Internal alerts and Ops notifications.", fields: [{ key: "webhook_url", label: "Incoming webhook URL", kind: "url" }] },
  { id: "discord", name: "Discord", category: "communication", blurb: "Community server automation.", fields: [{ key: "webhook_url", label: "Webhook URL", kind: "url" }] },
  { id: "twilio", name: "Twilio SMS", category: "communication", blurb: "Programmable SMS worldwide.", fields: [{ key: "account_sid", label: "Account SID", kind: "text" }, { key: "auth_token", label: "Auth token", kind: "secret" }, { key: "from", label: "Sender", kind: "text" }] },
  { id: "msg91", name: "MSG91", category: "communication", blurb: "India-first SMS + WhatsApp gateway.", fields: [{ key: "auth_key", label: "Auth key", kind: "secret" }, { key: "sender_id", label: "Sender ID", kind: "text" }] },

  // --- Video ----------------------------------------------------------------
  { id: "zoom", name: "Zoom", category: "video", blurb: "Live classes with recording and breakouts.", fields: [{ key: "account_id", label: "Account ID", kind: "text" }, { key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "gmeet", name: "Google Meet", category: "video", blurb: "Meeting links via Google Calendar API.", fields: [{ key: "service_account_json", label: "Service account JSON", kind: "secret" }] },
  { id: "teams", name: "Microsoft Teams", category: "video", blurb: "Corporate training sessions.", fields: [{ key: "tenant_id", label: "Tenant ID", kind: "text" }, { key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "webex", name: "Cisco Webex", category: "video", blurb: "Enterprise-grade meetings.", fields: [{ key: "access_token", label: "Access token", kind: "secret" }] },

  // --- Calendar -------------------------------------------------------------
  { id: "gcal", name: "Google Calendar", category: "calendar", blurb: "Sync classes, interviews, events.", fields: [{ key: "service_account_json", label: "Service account JSON", kind: "secret" }] },
  { id: "outlook-cal", name: "Outlook Calendar", category: "calendar", blurb: "Sync events with Microsoft 365.", fields: [{ key: "tenant_id", label: "Tenant ID", kind: "text" }, { key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "apple-cal", name: "Apple Calendar", category: "calendar", blurb: "iCloud calendar via CalDAV.", status: "future", fields: [{ key: "apple_id", label: "Apple ID", kind: "email" }, { key: "app_password", label: "App-specific password", kind: "secret" }] },

  // --- Storage --------------------------------------------------------------
  { id: "gdrive", name: "Google Drive", category: "storage", blurb: "Store media, resources, and backups.", fields: [{ key: "service_account_json", label: "Service account JSON", kind: "secret" }, { key: "folder_id", label: "Root folder ID", kind: "text", optional: true }] },
  { id: "onedrive", name: "Microsoft OneDrive", category: "storage", blurb: "Store files in Microsoft 365.", fields: [{ key: "tenant_id", label: "Tenant ID", kind: "text" }, { key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "dropbox", name: "Dropbox", category: "storage", blurb: "Team folders for content teams.", fields: [{ key: "access_token", label: "Access token", kind: "secret" }] },
  { id: "s3", name: "Amazon S3", category: "storage", blurb: "Enterprise-grade object storage.", fields: [{ key: "bucket", label: "Bucket", kind: "text" }, { key: "region", label: "Region", kind: "text", placeholder: "ap-south-1" }, { key: "access_key", label: "Access key", kind: "text" }, { key: "secret_key", label: "Secret key", kind: "secret" }] },
  { id: "r2", name: "Cloudflare R2", category: "storage", blurb: "S3-compatible, zero egress fees.", fields: [{ key: "account_id", label: "Account ID", kind: "text" }, { key: "bucket", label: "Bucket", kind: "text" }, { key: "access_key", label: "Access key", kind: "text" }, { key: "secret_key", label: "Secret key", kind: "secret" }] },

  // --- Marketing / Analytics -----------------------------------------------
  { id: "ga4", name: "Google Analytics 4", category: "analytics", blurb: "Traffic and conversion analytics.", fields: [{ key: "measurement_id", label: "Measurement ID", kind: "text", placeholder: "G-XXXXXXXX" }] },
  { id: "gtm", name: "Google Tag Manager", category: "analytics", blurb: "Centralized tag orchestration.", fields: [{ key: "container_id", label: "Container ID", kind: "text", placeholder: "GTM-XXXXXX" }] },
  { id: "meta-pixel", name: "Meta Pixel", category: "marketing", blurb: "Facebook / Instagram ad tracking.", fields: [{ key: "pixel_id", label: "Pixel ID", kind: "text" }] },
  { id: "linkedin-tag", name: "LinkedIn Insight Tag", category: "marketing", blurb: "B2B campaign tracking.", fields: [{ key: "partner_id", label: "Partner ID", kind: "text" }] },
  { id: "tiktok-pixel", name: "TikTok Pixel", category: "marketing", status: "future", blurb: "Short-video ad tracking.", fields: [{ key: "pixel_id", label: "Pixel ID", kind: "text" }] },
  { id: "mailchimp", name: "Mailchimp", category: "marketing", blurb: "Email campaigns and lists.", fields: [{ key: "api_key", label: "API key", kind: "secret" }] },
  { id: "brevo", name: "Brevo", category: "marketing", blurb: "Email + SMS marketing (India-friendly).", fields: [{ key: "api_key", label: "API key", kind: "secret" }] },
  { id: "posthog", name: "PostHog", category: "analytics", blurb: "Product analytics and session replay.", fields: [{ key: "api_key", label: "Project API key", kind: "text" }, { key: "host", label: "Host", kind: "url", placeholder: "https://us.posthog.com" }] },

  // --- CRM ------------------------------------------------------------------
  { id: "hubspot", name: "HubSpot", category: "crm", blurb: "Sync leads and marketing contacts.", fields: [{ key: "access_token", label: "Private app token", kind: "secret" }] },
  { id: "salesforce", name: "Salesforce", category: "crm", blurb: "Enterprise CRM sync.", fields: [{ key: "instance_url", label: "Instance URL", kind: "url" }, { key: "access_token", label: "OAuth access token", kind: "secret" }] },
  { id: "zoho", name: "Zoho CRM", category: "crm", blurb: "Popular India-first CRM.", fields: [{ key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }, { key: "refresh_token", label: "Refresh token", kind: "secret" }] },
  { id: "freshsales", name: "Freshsales", category: "crm", blurb: "Freshworks sales CRM.", fields: [{ key: "domain", label: "Domain", kind: "text", placeholder: "yourorg.myfreshworks.com" }, { key: "api_key", label: "API key", kind: "secret" }] },

  // --- HR / Ops -------------------------------------------------------------
  { id: "razorpayx", name: "RazorpayX Payroll", category: "hr", blurb: "Payroll automation for India.", fields: [{ key: "api_key", label: "API key", kind: "secret" }] },
  { id: "keka", name: "Keka HRIS", category: "hr", blurb: "HR operations and attendance.", fields: [{ key: "api_key", label: "API key", kind: "secret" }] },

  // --- Auth / SSO -----------------------------------------------------------
  { id: "sso-google", name: "Google Sign-In", category: "auth", blurb: "OAuth sign-in with Google.", fields: [{ key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "sso-microsoft", name: "Microsoft SSO", category: "auth", blurb: "Sign in with Microsoft accounts.", fields: [{ key: "tenant_id", label: "Tenant ID", kind: "text" }, { key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "sso-apple", name: "Apple Sign In", category: "auth", blurb: "Sign in with Apple ID.", fields: [{ key: "team_id", label: "Team ID", kind: "text" }, { key: "key_id", label: "Key ID", kind: "text" }, { key: "private_key", label: "Private key", kind: "secret" }] },
  { id: "sso-linkedin", name: "LinkedIn SSO", category: "auth", blurb: "Professional-network sign-in.", fields: [{ key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "sso-github", name: "GitHub OAuth", category: "auth", blurb: "Developer sign-in.", fields: [{ key: "client_id", label: "Client ID", kind: "text" }, { key: "client_secret", label: "Client secret", kind: "secret" }] },
  { id: "sso-saml", name: "SAML 2.0", category: "auth", status: "future", blurb: "Enterprise SSO with IdPs like Okta, Azure AD.", fields: [{ key: "metadata_url", label: "Metadata URL", kind: "url" }] },

  // --- AI providers ---------------------------------------------------------
  { id: "openai", name: "OpenAI", category: "ai", blurb: "GPT models for chat and structured output.", supportsDefault: true, fields: [{ key: "api_key", label: "API key", kind: "secret" }] },
  { id: "anthropic", name: "Anthropic", category: "ai", blurb: "Claude models for long-context reasoning.", supportsDefault: true, fields: [{ key: "api_key", label: "API key", kind: "secret" }] },
  { id: "gemini", name: "Google Gemini", category: "ai", blurb: "Gemini models via AI Studio.", supportsDefault: true, fields: [{ key: "api_key", label: "API key", kind: "secret" }] },
  { id: "azure-openai", name: "Azure OpenAI", category: "ai", blurb: "Enterprise OpenAI with private routing.", supportsDefault: true, fields: [{ key: "endpoint", label: "Endpoint", kind: "url" }, { key: "api_key", label: "API key", kind: "secret" }, { key: "deployment", label: "Deployment name", kind: "text" }] },
  { id: "custom-llm", name: "Custom LLM Endpoint", category: "ai", blurb: "Any OpenAI-compatible endpoint.", supportsDefault: true, fields: [{ key: "base_url", label: "Base URL", kind: "url" }, { key: "api_key", label: "API key", kind: "secret" }] },

  // --- Developer / APIs ----------------------------------------------------
  { id: "webhook", name: "Outbound Webhook", category: "developer", blurb: "Push platform events to any URL.", fields: [{ key: "url", label: "Webhook URL", kind: "url" }, { key: "secret", label: "Signing secret", kind: "secret", optional: true }] },
];

export function providersByCategory(id: CategoryId): Provider[] {
  return PROVIDERS.filter((p) => p.category === id);
}

export function findProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

// Marketplace apps (installable extensions)
export interface MarketplaceApp {
  id: string;
  name: string;
  blurb: string;
  category: "core" | "growth" | "ops" | "ai";
  status: "installed" | "available" | "coming_soon";
  icon: LucideIcon;
}

export const MARKETPLACE: MarketplaceApp[] = [
  { id: "attendance", name: "Attendance Plugin", blurb: "Track student & staff attendance with QR codes.", category: "ops", status: "available", icon: ShieldCheck },
  { id: "exam", name: "Exam Plugin", blurb: "Proctored exams with automatic grading.", category: "core", status: "available", icon: Boxes },
  { id: "job-portal", name: "Job Portal", blurb: "Curated job board for graduates.", category: "growth", status: "available", icon: Building2 },
  { id: "placement", name: "Placement Portal", blurb: "Manage campus placements end-to-end.", category: "growth", status: "available", icon: Building2 },
  { id: "accounting", name: "Accounting", blurb: "Invoices, GST, reconciliation.", category: "ops", status: "coming_soon", icon: CreditCard },
  { id: "wa-automation", name: "WhatsApp Automation", blurb: "Broadcast, drip, and support workflows.", category: "growth", status: "available", icon: Mail },
  { id: "ai-tutor", name: "AI Tutor Plugin", blurb: "Course-aware AI tutor for every learner.", category: "ai", status: "installed", icon: BrainCircuit },
  { id: "ai-agents", name: "AI Agents Studio", blurb: "Build multi-step AI workflows.", category: "ai", status: "installed", icon: BrainCircuit },
];
