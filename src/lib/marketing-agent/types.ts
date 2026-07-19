// Enterprise Autonomous Marketing Agent — shared types.
// Zero UI, zero auth changes. All AI flows go through the central AI Router.

export type ApprovalLevel = "suggest_only" | "ai_plus_human" | "fully_auto";

export type AgentStatus = "active" | "paused" | "archived";

export type PlanHorizon =
  | "daily" | "weekly" | "monthly" | "quarterly" | "annual"
  | "campaign" | "content" | "seo" | "email" | "social"
  | "video" | "blog" | "brand" | "growth" | "referral" | "placement";

export type DecisionKind =
  | "pause" | "scale" | "budget_up" | "budget_down"
  | "create_ab" | "generate_asset" | "generate_video"
  | "generate_landing" | "generate_email" | "other";

export type DecisionState =
  | "proposed" | "approved" | "rejected" | "executed" | "rolled_back" | "failed";

export type RecommendationKind =
  | "course" | "content" | "blog" | "video" | "email"
  | "budget" | "creative" | "seo" | "growth" | "referral" | "placement";

export type ReportKind =
  | "morning_brief" | "weekly" | "monthly" | "quarterly" | "annual"
  | "campaign_summary" | "executive" | "seo" | "social" | "email";

export type KnowledgeKind =
  | "winning_creative" | "winning_cta" | "winning_subject"
  | "winning_landing" | "winning_video" | "winning_keyword"
  | "campaign_history" | "pattern";

export interface AgentRow {
  id: string;
  owner_id: string;
  brand_id: string | null;
  name: string;
  status: AgentStatus;
  approval_level: ApprovalLevel;
  auto_publish: boolean;
  auto_optimize: boolean;
  auto_email: boolean;
  auto_blog: boolean;
  auto_video: boolean;
  auto_landing: boolean;
  auto_social: boolean;
  timezone: string;
  language: string;
  goals: Record<string, unknown>;
  channels: string[];
  budget_monthly: number | null;
  last_tick_at: string | null;
  next_tick_at: string | null;
}

export interface DailyPlan {
  date: string;
  focus: string[];
  campaigns_to_review: string[];
  content_to_create: Array<{ kind: string; topic: string; priority: number }>;
  seo_tasks: string[];
  social_posts: Array<{ platform: string; theme: string; time: string }>;
  emails: Array<{ segment: string; theme: string }>;
  budget_moves: Array<{ campaign_id?: string; direction: "up" | "down" | "hold"; note: string }>;
  risks: string[];
}

export interface DecisionProposal {
  kind: DecisionKind;
  target_kind?: string;
  target_id?: string;
  action: Record<string, unknown>;
  rationale: string;
  confidence: number; // 0..1
}
