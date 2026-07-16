/**
 * Glintr Sales AI Operating System — agent catalog.
 * Presentation-layer definitions; deterministic engines live in ./engine.ts.
 */

export type SalesAgentId =
  | "lead-qualification"
  | "conversation"
  | "follow-up"
  | "call-coach"
  | "objection-handling"
  | "proposal"
  | "sales-script"
  | "meeting"
  | "negotiation"
  | "closing"
  | "crm"
  | "revenue-forecast"
  | "performance-coach"
  | "marketing"
  | "learning";

export interface SalesAgent {
  id: SalesAgentId;
  name: string;
  role: string;
  purpose: string;
  color: string;
  icon: string;
  outputs: string[];
  defaultAutonomy: "suggest" | "act";
}

export const SALES_AGENTS: SalesAgent[] = [
  {
    id: "lead-qualification",
    name: "Lead Qualification AI",
    role: "SDR Analyst",
    purpose: "Score every lead, detect buying intent and urgency, predict conversion probability, recommend priority.",
    color: "#f472b6",
    icon: "Target",
    outputs: ["Hot / Warm / Cold", "Expected Revenue", "Best Time to Contact"],
    defaultAutonomy: "act",
  },
  {
    id: "conversation",
    name: "Conversation AI",
    role: "Copywriter",
    purpose: "Generate personalized WhatsApp, Email, SMS, LinkedIn, Instagram DM and Telegram messages using lead history.",
    color: "#22d3ee",
    icon: "MessageSquare",
    outputs: ["WhatsApp", "Email", "SMS", "LinkedIn", "Instagram", "Telegram"],
    defaultAutonomy: "suggest",
  },
  {
    id: "follow-up",
    name: "Follow-Up AI",
    role: "Cadence Manager",
    purpose: "Track every lead, suggest when/how to follow up, generate automatic cadences with reminders.",
    color: "#60a5fa",
    icon: "Clock",
    outputs: ["Next Best Channel", "Cadence Sequence", "Reminder", "Meeting Nudge"],
    defaultAutonomy: "act",
  },
  {
    id: "call-coach",
    name: "Call Coach AI",
    role: "Sales Coach",
    purpose: "Before and after every call — brief the partner, then summarize actions and next steps.",
    color: "#fb7185",
    icon: "Headphones",
    outputs: ["Pre-call brief", "Likely objections", "Suggested script", "Post-call summary"],
    defaultAutonomy: "suggest",
  },
  {
    id: "objection-handling",
    name: "Objection Handling AI",
    role: "Objection Specialist",
    purpose: "Respond to the 8 most common objections with multiple field-tested options.",
    color: "#f97316",
    icon: "ShieldQuestion",
    outputs: ["3+ response variants", "Rebuttal framework", "Follow-up prompt"],
    defaultAutonomy: "suggest",
  },
  {
    id: "proposal",
    name: "Proposal AI",
    role: "Proposal Designer",
    purpose: "Generate course proposals, fee breakdowns, EMI options, scholarships and brochures — PDF-ready.",
    color: "#a3e635",
    icon: "FileText",
    outputs: ["Proposal PDF", "Fee breakdown", "EMI options", "Comparison sheet"],
    defaultAutonomy: "suggest",
  },
  {
    id: "sales-script",
    name: "Sales Script AI",
    role: "Script Writer",
    purpose: "Generate call, zoom, counselling, corporate, parent and career-guidance scripts.",
    color: "#c084fc",
    icon: "ScrollText",
    outputs: ["Phone", "Zoom", "Counselling", "Corporate", "Parents", "Career"],
    defaultAutonomy: "suggest",
  },
  {
    id: "meeting",
    name: "Meeting AI",
    role: "Scheduler",
    purpose: "Create Meet/Zoom, calendar invites, reminders, meeting notes and follow-up tasks.",
    color: "#38bdf8",
    icon: "Calendar",
    outputs: ["Meeting link", "Calendar invite", "Reminder", "Notes", "Follow-up tasks"],
    defaultAutonomy: "act",
  },
  {
    id: "negotiation",
    name: "Negotiation AI",
    role: "Deal Desk",
    purpose: "Suggest scholarships, discounts, EMI, bonuses, upsell and cross-sell within admin-defined limits.",
    color: "#eab308",
    icon: "Handshake",
    outputs: ["Approved offer", "Guardrails hit"],
    defaultAutonomy: "suggest",
  },
  {
    id: "closing",
    name: "Closing AI",
    role: "Closer",
    purpose: "Detect buying signals and recommend the next best close action.",
    color: "#34d399",
    icon: "CheckCircle2",
    outputs: ["Close now", "Wait", "Offer scholarship", "Book counselling", "Send proposal"],
    defaultAutonomy: "suggest",
  },
  {
    id: "crm",
    name: "CRM AI",
    role: "Pipeline Keeper",
    purpose: "Automatically update lead status, notes, tasks, follow-ups and pipeline stage from every interaction.",
    color: "#818cf8",
    icon: "Database",
    outputs: ["Stage sync", "Auto notes", "Task creation"],
    defaultAutonomy: "act",
  },
  {
    id: "revenue-forecast",
    name: "Revenue Forecast AI",
    role: "Forecast Analyst",
    purpose: "Predict daily / weekly / monthly admissions, revenue and commission with confidence bands.",
    color: "#4ade80",
    icon: "LineChart",
    outputs: ["Daily", "Weekly", "Monthly", "Commission"],
    defaultAutonomy: "act",
  },
  {
    id: "performance-coach",
    name: "Performance Coach AI",
    role: "Sales Director",
    purpose: "Review each sales partner and recommend targeted improvements to close more admissions.",
    color: "#f59e0b",
    icon: "Trophy",
    outputs: ["Response-speed drills", "Follow-up quotas", "Channel mix", "Content nudges"],
    defaultAutonomy: "suggest",
  },
  {
    id: "marketing",
    name: "Marketing AI",
    role: "Growth Marketer",
    purpose: "Generate LinkedIn / Instagram / WhatsApp / Facebook / Reel / Poster / Email campaigns.",
    color: "#ec4899",
    icon: "Megaphone",
    outputs: ["LinkedIn Post", "Instagram Post", "WhatsApp Status", "Facebook Post", "Reel Script", "Poster", "Email"],
    defaultAutonomy: "suggest",
  },
  {
    id: "learning",
    name: "Learning AI",
    role: "Sales Trainer",
    purpose: "Daily quiz, product knowledge, competitor comparison, role play and sales challenges.",
    color: "#0ea5e9",
    icon: "GraduationCap",
    outputs: ["Daily quiz", "Product knowledge", "Competitor sheet", "Role play", "Challenge"],
    defaultAutonomy: "suggest",
  },
];

export function findSalesAgent(id: SalesAgentId) {
  return SALES_AGENTS.find((a) => a.id === id)!;
}

// -------------------------------------------------------------------------
// Objection library
// -------------------------------------------------------------------------

export const OBJECTIONS: Array<{ id: string; title: string; frameworks: string[] }> = [
  {
    id: "too-expensive",
    title: "Too expensive",
    frameworks: [
      "Reframe to career outcome: cost of the program vs. cost of staying in current role for another 12 months.",
      "Break the fee into effective monthly EMI and align to salary uplift benchmarks for the target role.",
      "Offer a scholarship review within admin-approved limits — do not exceed.",
    ],
  },
  {
    id: "need-time",
    title: "Need time",
    frameworks: [
      "Ask what specifically they need to decide on — pricing, timing or approval — and address just that.",
      "Book a 20-minute follow-up in 48 hours and share a comparison sheet before the call.",
      "Send 1 alumnus testimonial that matches their exact profile.",
    ],
  },
  {
    id: "parent-approval",
    title: "Need parent's approval",
    frameworks: [
      "Offer a joint counselling call with the parent this week and share the parent-facing brochure.",
      "Prepare 3 parent-oriented FAQs: fees, safety of career, placement track record.",
      "Send outcome data (median salary, top hiring partners) tailored to the parent's likely concerns.",
    ],
  },
  {
    id: "employer-approval",
    title: "Need employer approval",
    frameworks: [
      "Share the corporate upskilling proposal and offer a signed L&D justification letter.",
      "Position the program as ROI for the employer — attach 2 role transitions from similar companies.",
      "Suggest weekend/live cohort options that don't impact working hours.",
    ],
  },
  {
    id: "enrolled-elsewhere",
    title: "Already enrolled elsewhere",
    frameworks: [
      "Ask what outcome they signed up for and what's missing — do not disparage the other provider.",
      "Position Glintr as complementary: internships, career services, placement network.",
      "Offer a limited free trial cohort week to compare experience.",
    ],
  },
  {
    id: "no-time",
    title: "No time",
    frameworks: [
      "Present the self-paced + weekend live-class option with real completion stats.",
      "Show a peer profile that closed in similar time constraints and the exact hours/week they invested.",
      "Book a 10-minute call — respect their time and prepare a tight agenda.",
    ],
  },
  {
    id: "need-emi",
    title: "Need EMI",
    frameworks: [
      "Share admin-approved EMI plans (0% for 6 months, 9–12% for 12–24 months).",
      "Explain no-cost EMI eligibility, documents required and processing time.",
      "Offer to hold their seat for 48 hours while EMI is being processed.",
    ],
  },
  {
    id: "not-interested",
    title: "Not interested",
    frameworks: [
      "Ask one clarifying question about the goal that triggered their initial enquiry — most 'not interested' means 'not yet'.",
      "Politely offer a check-in in 30 days plus one relevant resource (career roadmap).",
      "Add to the long-term nurture cadence and mark the lead as cold, do not push.",
    ],
  },
];

// -------------------------------------------------------------------------
// Admin controls defaults
// -------------------------------------------------------------------------

export interface AdminControls {
  maxDiscountPercent: number;
  maxScholarshipPercent: number;
  emiRules: { minMonths: number; maxMonths: number; zeroCostMonths: number };
  escalation: {
    responseTimeMinutes: number;
    followUpsPerLead: number;
    inactivityHoursBeforeReassign: number;
  };
  businessHours: { startHour: number; endHour: number; timezone: string; days: number[] };
  scripts: { name: string; body: string }[];
  templates: { channel: MessageChannel; name: string; body: string }[];
}

export type MessageChannel = "whatsapp" | "email" | "sms" | "linkedin" | "instagram" | "telegram";

export const DEFAULT_ADMIN_CONTROLS: AdminControls = {
  maxDiscountPercent: 15,
  maxScholarshipPercent: 25,
  emiRules: { minMonths: 3, maxMonths: 24, zeroCostMonths: 6 },
  escalation: {
    responseTimeMinutes: 30,
    followUpsPerLead: 5,
    inactivityHoursBeforeReassign: 48,
  },
  businessHours: { startHour: 9, endHour: 20, timezone: "Asia/Kolkata", days: [1, 2, 3, 4, 5, 6] },
  scripts: [
    { name: "First call — discovery", body: "Hi {name}, I'm calling from Glintr regarding your enquiry about {program}. Do you have 2 minutes so I can understand what outcome you're looking for?" },
    { name: "Objection — too expensive", body: "I hear you {name}. Before we talk price, let's align on outcome — most learners land a role with a 40–70% salary uplift within 6 months. Let me walk you through the EMI options so the monthly is closer to your current SIP." },
  ],
  templates: [
    { channel: "whatsapp", name: "Welcome nudge", body: "Hi {name} 👋 Thanks for your interest in {program} at Glintr. I've kept 2 slots for a career call — Tue 6pm or Wed 11am work for you?" },
    { channel: "email", name: "Post-consultation follow-up", body: "Hi {name},\n\nGreat speaking to you today. Attaching the fee sheet, EMI options and 3 alumni stories for the {program}.\n\nHappy to hop on a 15-min close call this week — let me know what works." },
  ],
};

export const LEAD_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Consulted",
  "Proposal Sent",
  "Negotiation",
  "Enrolled",
  "Lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
