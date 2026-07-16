/**
 * Daily Briefing generator
 *
 * Produces a per-role "morning brief" — priorities, opportunities, risks,
 * and quick wins — that renders on top of every dashboard.
 *
 * Deterministic scaffold so the panel is instant and reliable on first
 * paint. Consumers can layer a real AI call on top and merge results;
 * we keep this file offline-safe so dashboards never wait on the network.
 */

import type { CommandRole } from "./registry";

export type BriefingKind = "priority" | "opportunity" | "risk" | "win";

export interface BriefingItem {
  id: string;
  kind: BriefingKind;
  title: string;
  detail?: string;
  impact?: string; // e.g. "+18% traffic"
  to?: string; // deep-link destination
  cta?: string;
}

export interface Briefing {
  role: CommandRole;
  headline: string;
  subline: string;
  items: BriefingItem[];
  generatedAt: number;
}

function dayKey(now = new Date()) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/** Simple stable rotation so the briefing shifts day-to-day. */
function rotate<T>(items: T[], now = new Date()): T[] {
  if (items.length === 0) return items;
  const seed = new Date(dayKey(now)).getTime() / 86_400_000;
  const offset = Math.floor(seed) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

// --- Role playbooks ----------------------------------------------------------

const STUDENT_ITEMS: BriefingItem[] = [
  { id: "s1", kind: "priority", title: "Finish today's module", detail: "You're 72% through your active course — one module keeps momentum.", to: "/my", cta: "Continue" },
  { id: "s2", kind: "opportunity", title: "Ship a portfolio project", detail: "Hiring managers rate portfolio work above certificates.", to: "/workspace", cta: "Open workspace", impact: "+2× interview rate" },
  { id: "s3", kind: "win", title: "Update your resume", detail: "New skills unlocked this week — regenerate your resume snapshot.", to: "/my", cta: "Refresh resume" },
  { id: "s4", kind: "opportunity", title: "Book a mock interview", detail: "GlintrAI can simulate a 20-minute technical round.", to: "/my", cta: "Start mock" },
  { id: "s5", kind: "risk", title: "You haven't logged in for 5 days", detail: "Streaks matter — a 15-minute review restores momentum.", to: "/my", cta: "Resume" },
];

const SALES_PARTNER_ITEMS: BriefingItem[] = [
  { id: "sp1", kind: "priority", title: "Call your hottest lead first", detail: "One lead has viewed pricing 3× this week.", to: "/partner/leads", cta: "Open lead", impact: "high intent" },
  { id: "sp2", kind: "opportunity", title: "Send 5 WhatsApp follow-ups", detail: "Leads contacted within 24h convert 3× more.", to: "/partner/leads", cta: "Draft with AI" },
  { id: "sp3", kind: "risk", title: "3 stale leads (no activity 7d+)", detail: "Re-engage or archive to keep your pipeline honest.", to: "/partner/leads" },
  { id: "sp4", kind: "win", title: "Share a success story", detail: "A student you referred just completed their course — post it.", to: "/partner/marketing", cta: "Generate post", impact: "social proof" },
  { id: "sp5", kind: "opportunity", title: "Review this week's payouts", detail: "Verify commissions and flag any anomalies.", to: "/partner/earnings", cta: "Open earnings" },
];

const ACADEMY_ITEMS: BriefingItem[] = [
  { id: "a1", kind: "priority", title: "Publish 2 blogs today", detail: "Your content velocity is below the growth threshold.", to: "/admin/ai-content/factory", cta: "Draft with AI", impact: "+18% traffic est." },
  { id: "a2", kind: "opportunity", title: "Refresh your top course", detail: "Your best-selling course hasn't been updated in 60 days.", to: "/admin/courses", cta: "Open editor", impact: "+12% conversion est." },
  { id: "a3", kind: "risk", title: "SEO health dropped 4 points", detail: "3 pages lost featured snippets this week.", to: "/admin/ai-coo", cta: "Open advisor" },
  { id: "a4", kind: "win", title: "Instagram engagement up 22%", detail: "Double down on carousel format this week.", to: "/partner/marketing", cta: "Plan calendar" },
  { id: "a5", kind: "opportunity", title: "Assign an AI Employee", detail: "Offload content ops to your AI content manager.", to: "/partner/ai-employees" },
];

const ADMIN_ITEMS: BriefingItem[] = [
  { id: "ad1", kind: "priority", title: "Approve 4 partner applications", detail: "Applications waiting > 48h reduce activation by 30%.", to: "/admin/partners", cta: "Review queue" },
  { id: "ad2", kind: "opportunity", title: "Launch monthly campaign", detail: "Generate a coordinated blog + social + email push.", to: "/admin/ai-content/factory", cta: "Open factory" },
  { id: "ad3", kind: "risk", title: "Broken links detected", detail: "12 internal links returning 404 on production.", to: "/admin/ai-coo", impact: "SEO risk" },
  { id: "ad4", kind: "win", title: "Weekly revenue +14%", detail: "Two new academy partners went live.", to: "/admin/dashboard" },
  { id: "ad5", kind: "priority", title: "Refund queue", detail: "3 refund requests awaiting decision.", to: "/admin/finance" },
];

const FOUNDER_ITEMS: BriefingItem[] = [
  { id: "f1", kind: "priority", title: "Review growth score", detail: "AI Growth Engine flagged 3 leverage points this week.", to: "/admin/ai-coo", cta: "Open COO" },
  { id: "f2", kind: "opportunity", title: "Investor update draft ready", detail: "This week's MRR, ARR, and partner metrics are compiled.", to: "/admin/dashboard" },
  { id: "f3", kind: "risk", title: "Marketing ROI dipped on paid channels", detail: "Consider shifting spend to organic content.", to: "/admin/ai-coo" },
  { id: "f4", kind: "win", title: "New country on the map", detail: "First academy partner in a new geography just launched.", to: "/admin/partners" },
];

// --- Public API --------------------------------------------------------------

export function generateBriefing(role: CommandRole, now = new Date()): Briefing {
  let items: BriefingItem[];
  let headline: string;
  let subline: string;

  switch (role) {
    case "student":
      items = rotate(STUDENT_ITEMS, now).slice(0, 4);
      headline = "Your learning brief";
      subline = "Momentum compounds — here's what to tackle today.";
      break;
    case "sales_partner":
      items = rotate(SALES_PARTNER_ITEMS, now).slice(0, 4);
      headline = "Today's sales plan";
      subline = "Highest-leverage moves before you open your inbox.";
      break;
    case "academy_partner":
      items = rotate(ACADEMY_ITEMS, now).slice(0, 4);
      headline = "Your academy brief";
      subline = "AI COO recommendations for growth this week.";
      break;
    case "founder":
      items = rotate(FOUNDER_ITEMS, now).slice(0, 4);
      headline = "Founder brief";
      subline = "Leverage points, risks, and wins across the platform.";
      break;
    case "admin":
      items = rotate(ADMIN_ITEMS, now).slice(0, 4);
      headline = "Operator's brief";
      subline = "What needs your judgement today.";
      break;
    default:
      items = rotate(STUDENT_ITEMS, now).slice(0, 3);
      headline = "Today's shortlist";
      subline = "A few high-impact moves to keep progress compounding.";
  }

  return { role, headline, subline, items, generatedAt: now.getTime() };
}
