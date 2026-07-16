import type { Workflow, WorkflowNode } from "./types";

function n(id: string, defId: string, kind: WorkflowNode["kind"], label: string, x: number, y: number, next?: string | null): WorkflowNode {
  return { id, defId, kind, label, x, y, config: {}, next: next ?? null };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: string;
  nodes: WorkflowNode[];
}

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "tpl.student_onboarding",
    name: "Student Onboarding",
    description: "Welcome new students, assign mentor, and generate a study plan.",
    category: "Learning",
    trigger: "trg.student_registered",
    nodes: [
      n("t", "trg.student_registered", "trigger", "Student Registered", 60, 60, "a1"),
      n("a1", "act.send_email", "action", "Send Welcome Email", 60, 180, "a2"),
      n("a2", "act.assign_mentor", "action", "Assign GlintrAI", 60, 300, "a3"),
      n("a3", "ai.study_plan", "ai_action", "AI: Generate Study Plan", 60, 420, "e"),
      n("e", "end.stop", "end", "End", 60, 540),
    ],
  },
  {
    id: "tpl.partner_onboarding",
    name: "Partner Onboarding",
    description: "Onboard approved partners with training and lead access.",
    category: "Sales",
    trigger: "trg.partner_registered",
    nodes: [
      n("t", "trg.partner_registered", "trigger", "Partner Registered", 60, 60, "a1"),
      n("a1", "act.send_email", "action", "Onboarding Email", 60, 180, "a2"),
      n("a2", "act.create_task", "action", "Assign Training Modules", 60, 300, "d1"),
      n("d1", "delay.day", "delay", "Wait 1 Day", 60, 420, "n1"),
      n("n1", "notif.inapp", "notification", "In-app Kickoff Reminder", 60, 540, "e"),
      n("e", "end.stop", "end", "End", 60, 660),
    ],
  },
  {
    id: "tpl.course_completion",
    name: "Course Completion",
    description: "Issue certificate and recommend next program.",
    category: "Learning",
    trigger: "trg.lesson_completed",
    nodes: [
      n("t", "trg.lesson_completed", "trigger", "Lesson Completed", 60, 60, "c1"),
      n("c1", "cnd.completion", "condition", "Completion ≥ 100%?", 60, 180),
      n("a1", "act.issue_certificate", "action", "Issue Certificate", 60, 320, "a2"),
      n("a2", "act.recommend_program", "action", "Recommend Next Program", 60, 440, "e"),
      n("e", "end.stop", "end", "End", 60, 560),
    ],
  },
  {
    id: "tpl.revenue_share",
    name: "Revenue Share Payout",
    description: "Compute partner share and route for approval.",
    category: "Finance",
    trigger: "trg.payment_received",
    nodes: [
      n("t", "trg.payment_received", "trigger", "Payment Received", 60, 60, "a1"),
      n("a1", "act.generate_invoice", "action", "Generate Invoice", 60, 180, "ap"),
      n("ap", "appr.payout", "approval", "Approve Payout", 60, 300, "n1"),
      n("n1", "notif.email", "notification", "Notify Partner", 60, 420, "e"),
      n("e", "end.stop", "end", "End", 60, 540),
    ],
  },
  {
    id: "tpl.lead_followup",
    name: "Lead Follow-up",
    description: "Route lead, send AI-drafted follow-up (with approval).",
    category: "Sales",
    trigger: "trg.lead_created",
    nodes: [
      n("t", "trg.lead_created", "trigger", "Lead Created", 60, 60, "a1"),
      n("a1", "act.assign_lead", "action", "Assign Lead", 60, 180, "ai1"),
      n("ai1", "ai.sales_followup", "ai_action", "AI: Draft Follow-up", 60, 300, "ap"),
      n("ap", "appr.content", "approval", "Approve Content", 60, 420, "a2"),
      n("a2", "act.send_email", "action", "Send Follow-up", 60, 540, "e"),
      n("e", "end.stop", "end", "End", 60, 660),
    ],
  },
  {
    id: "tpl.consultation",
    name: "Consultation Workflow",
    description: "Confirm booking, schedule reminder, capture summary.",
    category: "Sales",
    trigger: "trg.consultation_booked",
    nodes: [
      n("t", "trg.consultation_booked", "trigger", "Consultation Booked", 60, 60, "a1"),
      n("a1", "act.calendar_event", "action", "Create Calendar Event", 60, 180, "d1"),
      n("d1", "delay.hour", "delay", "Wait 1 Hour Before", 60, 300, "n1"),
      n("n1", "notif.email", "notification", "Reminder Email", 60, 420, "ai1"),
      n("ai1", "ai.meeting_summary", "ai_action", "AI: Meeting Summary", 60, 540, "e"),
      n("e", "end.stop", "end", "End", 60, 660),
    ],
  },
  {
    id: "tpl.certificate",
    name: "Certificate Workflow",
    description: "Approve, issue and deliver certificate.",
    category: "Learning",
    trigger: "trg.certificate_issued",
    nodes: [
      n("t", "trg.certificate_issued", "trigger", "Certificate Issued", 60, 60, "ap"),
      n("ap", "appr.certificate", "approval", "Approve Certificate", 60, 180, "a1"),
      n("a1", "act.send_email", "action", "Deliver Certificate", 60, 300, "e"),
      n("e", "end.stop", "end", "End", 60, 420),
    ],
  },
  {
    id: "tpl.blog_publishing",
    name: "Blog Publishing",
    description: "Approve content and notify subscribers.",
    category: "Content",
    trigger: "trg.blog_published",
    nodes: [
      n("t", "trg.blog_published", "trigger", "Blog Published", 60, 60, "ap"),
      n("ap", "appr.content", "approval", "Content Approval", 60, 180, "a1"),
      n("a1", "notif.email", "notification", "Email Subscribers", 60, 300, "e"),
      n("e", "end.stop", "end", "End", 60, 420),
    ],
  },
  {
    id: "tpl.white_label_launch",
    name: "White Label Launch",
    description: "Provision brand, run setup tasks, notify owner.",
    category: "Operations",
    trigger: "trg.white_label_activated",
    nodes: [
      n("t", "trg.white_label_activated", "trigger", "White Label Activated", 60, 60, "a1"),
      n("a1", "act.create_task", "action", "Provision Brand Assets", 60, 180, "a2"),
      n("a2", "act.calendar_event", "action", "Schedule Kickoff Call", 60, 300, "n1"),
      n("n1", "notif.email", "notification", "Send Setup Guide", 60, 420, "e"),
      n("e", "end.stop", "end", "End", 60, 540),
    ],
  },
];

export function seedWorkflowsFromTemplates(): Workflow[] {
  const now = new Date().toISOString();
  return TEMPLATES.slice(0, 5).map((t, i) => ({
    id: `wf_${t.id.replace("tpl.", "")}`,
    name: t.name,
    description: t.description,
    status: (i === 0 ? "active" : i === 1 ? "active" : i === 2 ? "draft" : i === 3 ? "scheduled" : "active") as Workflow["status"],
    trigger: t.trigger,
    tags: [t.category],
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
    nodes: t.nodes,
    version: 1,
    history: [{ version: 1, publishedAt: now, editor: "system", nodes: t.nodes, note: "Initial version" }],
    errorPolicy: "retry",
    maxRetries: 3,
    permissionRole: "administrator",
  }));
}
