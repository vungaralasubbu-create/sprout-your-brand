import type { BlockDef } from "./types";

export const TRIGGERS: BlockDef[] = [
  { id: "trg.student_registered", kind: "trigger", label: "Student Registered", description: "Fires when a new student signs up." },
  { id: "trg.program_purchased", kind: "trigger", label: "Program Purchased", description: "Fires on successful program purchase." },
  { id: "trg.lesson_completed", kind: "trigger", label: "Lesson Completed", description: "Fires when a lesson is marked complete." },
  { id: "trg.quiz_submitted", kind: "trigger", label: "Quiz Submitted", description: "Fires when a quiz is submitted." },
  { id: "trg.certificate_issued", kind: "trigger", label: "Certificate Issued", description: "Fires when a certificate is generated." },
  { id: "trg.partner_registered", kind: "trigger", label: "Partner Registered", description: "Fires when a partner application is approved." },
  { id: "trg.lead_created", kind: "trigger", label: "Lead Created", description: "Fires when a new lead enters CRM." },
  { id: "trg.consultation_booked", kind: "trigger", label: "Consultation Booked", description: "Fires when a consultation is booked." },
  { id: "trg.blog_published", kind: "trigger", label: "Blog Published", description: "Fires when a blog post is published." },
  { id: "trg.learn_guide_published", kind: "trigger", label: "Learn Guide Published", description: "Fires when a Learn guide goes live." },
  { id: "trg.support_ticket_created", kind: "trigger", label: "Support Ticket Created", description: "Fires when a support ticket is opened." },
  { id: "trg.payment_received", kind: "trigger", label: "Payment Received", description: "Fires when a payment is captured." },
  { id: "trg.refund_requested", kind: "trigger", label: "Refund Requested", description: "Fires when a refund is requested." },
  { id: "trg.white_label_activated", kind: "trigger", label: "White Label Activated", description: "Fires when a WL brand is provisioned." },
  { id: "trg.schedule", kind: "trigger", label: "On Schedule", description: "Cron-style scheduled trigger.", configSchema: [{ key: "cron", label: "Cron", type: "text", default: "0 9 * * *" }] },
];

export const CONDITIONS: BlockDef[] = [
  { id: "cnd.program_category", kind: "condition", label: "Program Category", description: "Branch by program category.", configSchema: [{ key: "category", label: "Category", type: "text" }] },
  { id: "cnd.revenue_model", kind: "condition", label: "Revenue Model", description: "Branch by revenue model.", configSchema: [{ key: "model", label: "Model", type: "select", options: ["70%", "50%", "White Label"] }] },
  { id: "cnd.quiz_score", kind: "condition", label: "Quiz Score", description: "Branch by score threshold.", configSchema: [{ key: "min", label: "Min Score", type: "number", default: 70 }] },
  { id: "cnd.completion", kind: "condition", label: "Completion %", description: "Branch by course completion.", configSchema: [{ key: "min", label: "Min %", type: "number", default: 80 }] },
  { id: "cnd.partner_level", kind: "condition", label: "Partner Level", description: "Branch by partner tier." },
  { id: "cnd.plan", kind: "condition", label: "Subscription Plan", description: "Branch by plan." },
  { id: "cnd.role", kind: "condition", label: "Student Role", description: "Branch by role/segment." },
  { id: "cnd.country", kind: "condition", label: "Country", description: "Branch by country." },
  { id: "cnd.language", kind: "condition", label: "Language", description: "Branch by language." },
  { id: "cnd.tag", kind: "condition", label: "Custom Tags", description: "Branch by tag." },
];

export const ACTIONS: BlockDef[] = [
  { id: "act.send_email", kind: "action", label: "Send Email", description: "Send a transactional email.", configSchema: [{ key: "template", label: "Template", type: "text" }] },
  { id: "act.send_notification", kind: "action", label: "Send Notification", description: "Send in-app notification." },
  { id: "act.create_task", kind: "action", label: "Create Task", description: "Create an internal task." },
  { id: "act.assign_mentor", kind: "action", label: "Assign GlintrAI", description: "Attach an AI mentor to a learner." },
  { id: "act.generate_plan", kind: "action", label: "Generate Study Plan", description: "Build a personalized study plan." },
  { id: "act.issue_certificate", kind: "action", label: "Issue Certificate", description: "Issue a completion certificate." },
  { id: "act.assign_lead", kind: "action", label: "Assign Lead", description: "Route lead to an owner." },
  { id: "act.crm_stage", kind: "action", label: "Move CRM Stage", description: "Advance CRM pipeline." },
  { id: "act.generate_invoice", kind: "action", label: "Generate Invoice", description: "Create an invoice document." },
  { id: "act.calendar_event", kind: "action", label: "Create Calendar Event", description: "Add to internal calendar." },
  { id: "act.unlock_lesson", kind: "action", label: "Unlock Next Lesson", description: "Release the next lesson." },
  { id: "act.recommend_program", kind: "action", label: "Recommend Program", description: "Suggest a program." },
  { id: "act.add_tag", kind: "action", label: "Add Tag", description: "Tag the record." },
  { id: "act.update_status", kind: "action", label: "Update Status", description: "Change record status." },
];

export const AI_ACTIONS: BlockDef[] = [
  { id: "ai.study_plan", kind: "ai_action", label: "AI: Study Plan", description: "Generate a personalized study plan." },
  { id: "ai.revision_plan", kind: "ai_action", label: "AI: Revision Plan", description: "Draft a revision plan." },
  { id: "ai.roadmap", kind: "ai_action", label: "AI: Learning Roadmap", description: "Draft a learning roadmap." },
  { id: "ai.email_draft", kind: "ai_action", label: "AI: Email Draft", description: "Draft an email (requires approval)." },
  { id: "ai.sales_followup", kind: "ai_action", label: "AI: Sales Follow-up", description: "Draft follow-up (requires approval)." },
  { id: "ai.blog_outline", kind: "ai_action", label: "AI: Blog Outline", description: "Draft outline (requires approval)." },
  { id: "ai.faq", kind: "ai_action", label: "AI: FAQ Draft", description: "Draft FAQ entries (requires approval)." },
  { id: "ai.support_response", kind: "ai_action", label: "AI: Support Response", description: "Draft support response." },
  { id: "ai.meeting_summary", kind: "ai_action", label: "AI: Meeting Summary", description: "Summarize a meeting." },
];

export const UTILITY: BlockDef[] = [
  { id: "delay.hour", kind: "delay", label: "Wait 1 Hour", description: "Pause execution 1 hour." },
  { id: "delay.day", kind: "delay", label: "Wait 1 Day", description: "Pause execution 1 day." },
  { id: "delay.date", kind: "delay", label: "Wait Until Date", description: "Pause until a specific date.", configSchema: [{ key: "date", label: "Date", type: "text" }] },
  { id: "delay.lesson", kind: "delay", label: "Wait Until Lesson Completed", description: "Pause until a lesson completes." },
  { id: "notif.email", kind: "notification", label: "Notify: Email", description: "Send email notification." },
  { id: "notif.inapp", kind: "notification", label: "Notify: In-App", description: "Send in-app notification." },
  { id: "notif.push", kind: "notification", label: "Notify: Push", description: "Send push notification." },
  { id: "notif.whatsapp", kind: "notification", label: "Notify: WhatsApp (future)", description: "Reserved for WhatsApp." },
  { id: "notif.sms", kind: "notification", label: "Notify: SMS (future)", description: "Reserved for SMS." },
  { id: "appr.content", kind: "approval", label: "Approve: Content", description: "Human approval for content." },
  { id: "appr.certificate", kind: "approval", label: "Approve: Certificate", description: "Human approval for certificate." },
  { id: "appr.refund", kind: "approval", label: "Approve: Refund", description: "Human approval for refund." },
  { id: "appr.payout", kind: "approval", label: "Approve: Payout", description: "Human approval for payout." },
  { id: "appr.lead", kind: "approval", label: "Approve: Lead Assignment", description: "Human approval for lead routing." },
  { id: "web.post", kind: "webhook", label: "Webhook: POST", description: "Send an outbound webhook.", configSchema: [{ key: "url", label: "URL", type: "text" }] },
  { id: "int.email", kind: "integration", label: "Integration: Email Provider", description: "Connector placeholder." },
  { id: "int.calendar", kind: "integration", label: "Integration: Calendar", description: "Connector placeholder." },
  { id: "int.crm", kind: "integration", label: "Integration: CRM", description: "Connector placeholder." },
  { id: "int.payments", kind: "integration", label: "Integration: Payment Gateway", description: "Connector placeholder." },
  { id: "int.storage", kind: "integration", label: "Integration: Storage", description: "Connector placeholder." },
  { id: "loop.until", kind: "loop", label: "Loop: Repeat Until Complete", description: "Loop until condition met.", configSchema: [{ key: "max", label: "Max Iterations", type: "number", default: 10 }] },
  { id: "loop.weekly", kind: "loop", label: "Loop: Weekly Reminder", description: "Repeat weekly.", configSchema: [{ key: "max", label: "Max Iterations", type: "number", default: 8 }] },
  { id: "loop.monthly", kind: "loop", label: "Loop: Monthly Reminder", description: "Repeat monthly.", configSchema: [{ key: "max", label: "Max Iterations", type: "number", default: 12 }] },
  { id: "end.stop", kind: "end", label: "End Workflow", description: "Stop execution." },
];

export const ALL_BLOCKS: BlockDef[] = [...TRIGGERS, ...CONDITIONS, ...ACTIONS, ...AI_ACTIONS, ...UTILITY];

export function findBlock(id: string): BlockDef | undefined {
  return ALL_BLOCKS.find((b) => b.id === id);
}

export const BLOCK_GROUPS: Array<{ key: string; label: string; blocks: BlockDef[] }> = [
  { key: "triggers", label: "Triggers", blocks: TRIGGERS },
  { key: "conditions", label: "Conditions", blocks: CONDITIONS },
  { key: "actions", label: "Actions", blocks: ACTIONS },
  { key: "ai", label: "AI Actions", blocks: AI_ACTIONS },
  { key: "utility", label: "Delays / Loops / Notify / Approval / Webhook", blocks: UTILITY },
];
