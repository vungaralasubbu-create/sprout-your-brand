import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ShieldCheck, XCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-content/settings")({
  component: SettingsPage,
});

const AI_RULES = [
  "Nothing publishes automatically — every AI draft requires human review.",
  "Every AI draft opens in the editor with status Draft; it cannot skip the workflow.",
  "AI does not invent statistics — numbers must be sourced by an editor.",
  "AI does not invent brand names, certifications, or partnerships.",
  "AI does not reproduce copyrighted text.",
  "AI writes to a factual, non-hyperbolic tone. No marketing spin.",
  "Keyword usage must read naturally — no stuffing.",
  "Duplicate detection warns editors before regenerating an existing article.",
  "Uniqueness checks fire on every content score.",
  "Every draft carries editor cautions surfaced from the model as verification notes.",
];

const REVIEW_WORKFLOW = [
  { status: "Draft", note: "Working state. Only visible to admins.", tone: "muted" },
  { status: "In Review", note: "Editor is reviewing. Comments track requested changes.", tone: "warn" },
  { status: "Approved", note: "Ready to publish or schedule.", tone: "info" },
  { status: "Scheduled", note: "Publishes automatically when scheduled_for passes.", tone: "info" },
  { status: "Published", note: "Live on the public site — indexed and ranked.", tone: "good" },
  { status: "Archived", note: "Rejected or retired. Retained for history.", tone: "muted" },
];



function SettingsPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> AI Rules & Settings</h1>
        <p className="text-sm text-muted-foreground">Editorial guardrails that keep AI-assisted content trustworthy.</p>
      </header>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium flex items-center gap-2"><Info className="size-4 text-primary" /> AI quality rules</h2>
        <ul className="space-y-1.5">
          {AI_RULES.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium flex items-center gap-2"><AlertTriangle className="size-4 text-amber-600" /> What AI never does</h2>
        <ul className="space-y-1.5 text-sm">
          {[
            "Publish without human review",
            "Cite made-up sources or unverifiable statistics",
            "Claim fake partnerships, hiring or placement statistics",
            "Reproduce copyrighted articles, images or code",
            "Fabricate program details that don't exist in Glintr's catalog",
            "Replace subject-matter experts on regulated topics (medical, legal, financial)",
          ].map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" /><span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium">Editorial workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {REVIEW_WORKFLOW.map((w) => (
            <div key={w.status} className="rounded-md border border-border/60 p-3">
              <div className="text-sm font-medium">{w.status}</div>
              <div className="text-xs text-muted-foreground">{w.note}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 space-y-2">
        <h2 className="font-medium">Collaboration</h2>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Multiple editors can review the same draft in parallel.</li>
          <li>• Comments in the editor are threaded per draft and can be resolved.</li>
          <li>• Revisions are captured on every save; the last 50 are shown in the sidebar with one-click restore.</li>
          <li>• Approvals and rejections are logged as editorial comments with the actor's identity.</li>
          <li>• Mobile devices are supported for review, comments and status changes; long-form writing remains desktop-first.</li>
        </ul>
      </Card>
    </div>
  );
}
