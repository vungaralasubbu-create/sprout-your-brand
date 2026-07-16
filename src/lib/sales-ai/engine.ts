/**
 * Deterministic Sales AI engines — scoring, forecasts, recommendations,
 * message generators, proposals, and NL command interpretation.
 *
 * Pure functions, safe on client and server. Real LLM enrichment happens
 * server-side in a follow-up phase; the shapes here match what the UI
 * needs today so agents feel useful out of the gate.
 */

import { OBJECTIONS, type AdminControls, type MessageChannel } from "./catalog";
import type { SalesLead, LeadEvent } from "./storage";

// -------------------------------------------------------------------------
// Lead qualification
// -------------------------------------------------------------------------

const PROGRAM_PRICE: Record<string, number> = {
  "AI Engineering Bootcamp": 149000,
  "Data Science with Python": 89000,
  "VLSI Design Program": 199000,
  "Full Stack Development": 79000,
  "Cloud DevOps Program": 119000,
  "UX Design Immersive": 99000,
};
export function priceForProgram(program: string) {
  return PROGRAM_PRICE[program] ?? 99000;
}

export interface QualificationResult {
  score: number;
  intent: "hot" | "warm" | "cold";
  expectedRevenue: number;
  bestTimeToContact: string;
  priority: number; // higher = sooner
  reasons: string[];
}

export function qualifyLead(lead: SalesLead, admin: AdminControls): QualificationResult {
  const reasons: string[] = [];
  let score = 40;

  const engaged = lead.timeline.filter((e) => e.by === "lead").length;
  if (engaged >= 2) { score += 20; reasons.push(`${engaged} inbound replies`); }
  else if (engaged === 1) { score += 10; reasons.push("Replied once"); }

  const stageBoost: Record<string, number> = {
    New: 0, Contacted: 5, Qualified: 12, Consulted: 18, "Proposal Sent": 24, Negotiation: 28, Enrolled: 40, Lost: -40,
  };
  score += stageBoost[lead.stage] ?? 0;
  reasons.push(`Stage: ${lead.stage}`);

  if (lead.budgetSensitivity === "low") { score += 10; reasons.push("Budget-comfortable"); }
  else if (lead.budgetSensitivity === "high") { score -= 6; reasons.push("Budget-sensitive"); }

  const hoursIdle = (Date.now() - lead.updatedAt) / 3600000;
  if (hoursIdle < 2) { score += 6; reasons.push("Recently active"); }
  else if (hoursIdle > 48) { score -= 8; reasons.push("Cold for 48h+"); }

  if (lead.parentInvolved) reasons.push("Parent involvement");
  if (lead.employer) reasons.push(`Employer: ${lead.employer}`);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const intent: "hot" | "warm" | "cold" = score >= 75 ? "hot" : score >= 50 ? "warm" : "cold";
  const expectedRevenue = Math.round(priceForProgram(lead.program) * (score / 100) * 0.9);

  const bestTimeToContact = pickBestSlot(admin);
  const priority = Math.round(score + (intent === "hot" ? 20 : intent === "warm" ? 8 : 0) - hoursIdle * 0.5);

  return { score, intent, expectedRevenue, bestTimeToContact, priority, reasons };
}

function pickBestSlot(admin: AdminControls): string {
  const now = new Date();
  const day = now.getDay();
  const inHours = day >= 1 && day <= 6 && now.getHours() >= admin.businessHours.startHour && now.getHours() < admin.businessHours.endHour;
  if (inHours) return "Now — within business hours";
  const hours = ["11:00 AM", "1:00 PM", "3:30 PM", "6:00 PM", "7:30 PM"];
  return `Today · ${hours[Math.floor(Math.random() * hours.length)]}`;
}

// -------------------------------------------------------------------------
// Conversation AI — channel-aware messages
// -------------------------------------------------------------------------

export function generateMessage(lead: SalesLead, channel: MessageChannel, intent: "hot" | "warm" | "cold"): string {
  const first = lead.name.split(" ")[0];
  const p = lead.program;
  const uplift = intent === "hot" ? "seat is limited — 2 slots left for the next cohort" : intent === "warm" ? "cohort starts in 10 days" : "career roadmap tailored to your profile";

  switch (channel) {
    case "whatsapp":
      return `Hi ${first} 👋\n\nQuick nudge on ${p} — ${uplift}. Would 6 PM today or 11 AM tomorrow work for a 15-min career call?\n\n— Team Glintr`;
    case "sms":
      return `Hi ${first}, Glintr here. About ${p} — ${uplift}. Call at 6 PM today? Reply Y/N.`;
    case "email":
      return `Subject: ${p} — next cohort details for ${first}\n\nHi ${first},\n\nSharing the fee breakdown, EMI options and 3 alumni stories that match your profile.\n\nA 20-min career call this week would let us tailor the roadmap. Would Tue 6 PM or Wed 11 AM suit you?\n\nBest,\nTeam Glintr`;
    case "linkedin":
      return `Hi ${first}, saw your interest in ${p}. Happy to share the cohort outcomes + salary uplift data for people in your role. Open to a 15-min call this week?`;
    case "instagram":
      return `Hey ${first} 👋 Thanks for checking out ${p}! Dropping the fee sheet + EMI options in DM. Free for a quick call this week?`;
    case "telegram":
      return `Hi ${first}, this is Glintr Admissions on Telegram. ${uplift}. Can I share the fee sheet + EMI options here?`;
  }
}

// -------------------------------------------------------------------------
// Follow-up cadence
// -------------------------------------------------------------------------

export interface FollowUpStep {
  offsetHours: number;
  channel: MessageChannel;
  action: string;
  detail: string;
}

export function generateCadence(lead: SalesLead, intent: "hot" | "warm" | "cold"): FollowUpStep[] {
  if (intent === "hot") {
    return [
      { offsetHours: 0, channel: "whatsapp", action: "Send WhatsApp", detail: "Confirm cohort details + book call today." },
      { offsetHours: 3, channel: "email", action: "Email fee sheet", detail: "PDF: fees, EMI, scholarships, alumni." },
      { offsetHours: 20, channel: "linkedin", action: "LinkedIn nudge", detail: "Social proof — 3 alumni transitions." },
      { offsetHours: 48, channel: "sms", action: "SMS reminder", detail: "Final call slot reminder before cohort seat lock." },
    ];
  }
  if (intent === "warm") {
    return [
      { offsetHours: 0, channel: "whatsapp", action: "Send WhatsApp", detail: "Warm intro + fee sheet + calendar link." },
      { offsetHours: 24, channel: "email", action: "Career roadmap", detail: "Personalized roadmap for their target role." },
      { offsetHours: 72, channel: "call", action: "Call attempt #1", detail: "20-min discovery call to understand goal." },
      { offsetHours: 120, channel: "whatsapp", action: "Nudge", detail: "Alumni story matching their profile." },
    ];
  }
  return [
    { offsetHours: 24, channel: "email", action: "Long-form resource", detail: "Career guide + industry salary benchmarks." },
    { offsetHours: 168, channel: "linkedin", action: "Weekly touch", detail: "Share one program-relevant post." },
    { offsetHours: 336, channel: "whatsapp", action: "Re-engagement", detail: "Ask if timing has changed." },
  ];
}

// -------------------------------------------------------------------------
// Call coach — pre/post brief
// -------------------------------------------------------------------------

export interface CallBrief {
  summary: string;
  interests: string[];
  questionsAsked: string[];
  likelyObjections: string[];
  suggestedScript: string;
  previousInteractions: LeadEvent[];
}

export function buildCallBrief(lead: SalesLead): CallBrief {
  const questions = lead.timeline
    .filter((e) => e.by === "lead" && e.summary.toLowerCase().includes("?"))
    .map((e) => e.summary);

  const likely = lead.budgetSensitivity === "high"
    ? ["Too expensive", "Need EMI", "Need parent's approval"]
    : lead.employer
      ? ["Need employer approval", "No time"]
      : ["Need time", "Already enrolled elsewhere"];

  return {
    summary: `${lead.name} · ${lead.role ?? "—"} · ${lead.program} · Stage ${lead.stage}. Source: ${lead.source}. Last active ${timeAgo(lead.updatedAt)}.`,
    interests: [lead.program, `Career transition to ${lead.role ?? "target role"}`, "Placement outcomes"],
    questionsAsked: questions.length ? questions : ["No explicit questions on file — start with discovery."],
    likelyObjections: likely,
    suggestedScript: `Open with outcome, not price. Anchor to ${lead.program} placements. If they push on price, walk through no-cost EMI. Book next step before ending the call.`,
    previousInteractions: lead.timeline.slice(0, 6),
  };
}

export function buildPostCallSummary(lead: SalesLead, notes: string) {
  const actions: string[] = [];
  const lc = notes.toLowerCase();
  if (lc.includes("emi") || lc.includes("installment")) actions.push("Send EMI plan PDF within the hour");
  if (lc.includes("parent")) actions.push("Book joint call with parent this week");
  if (lc.includes("interview") || lc.includes("placement")) actions.push("Share placement report + 3 alumni transitions");
  if (!actions.length) actions.push("Send fee sheet + book follow-up call in 48h");
  return {
    summary: `${lead.name} — ${lead.program}. ${notes.slice(0, 200)}${notes.length > 200 ? "…" : ""}`,
    actions,
    nextFollowUp: "Book follow-up in 48h via WhatsApp; escalate to call if no reply in 24h.",
  };
}

// -------------------------------------------------------------------------
// Objections
// -------------------------------------------------------------------------

export function responsesForObjection(id: string) {
  return OBJECTIONS.find((o) => o.id === id)?.frameworks ?? [];
}

// -------------------------------------------------------------------------
// Proposal
// -------------------------------------------------------------------------

export interface Proposal {
  lead: string;
  program: string;
  headline: string;
  feeBreakdown: { label: string; amount: number }[];
  emiOptions: { months: number; monthly: number; interest: number }[];
  scholarship: { percent: number; amount: number };
  benefits: string[];
  bonuses: string[];
  disclaimer: string;
}

export function buildProposal(lead: SalesLead, admin: AdminControls, opts?: { discountPercent?: number; scholarshipPercent?: number }): Proposal {
  const base = priceForProgram(lead.program);
  const discountPercent = Math.min(opts?.discountPercent ?? 0, admin.maxDiscountPercent);
  const scholarshipPercent = Math.min(opts?.scholarshipPercent ?? 10, admin.maxScholarshipPercent);
  const scholarship = Math.round((base * scholarshipPercent) / 100);
  const discount = Math.round((base * discountPercent) / 100);
  const gst = Math.round((base - discount - scholarship) * 0.18);
  const net = base - discount - scholarship + gst;

  const emi = [admin.emiRules.zeroCostMonths, 12, admin.emiRules.maxMonths]
    .filter((m, i, a) => m && a.indexOf(m) === i)
    .map((months) => {
      const interest = months <= admin.emiRules.zeroCostMonths ? 0 : 12;
      const monthly = Math.round((net * (1 + interest / 100)) / months);
      return { months, monthly, interest };
    });

  return {
    lead: lead.name,
    program: lead.program,
    headline: `${lead.program} — proposal for ${lead.name}`,
    feeBreakdown: [
      { label: "Program fee", amount: base },
      { label: "Scholarship", amount: -scholarship },
      { label: "Partner discount", amount: -discount },
      { label: "GST (18%)", amount: gst },
      { label: "Net payable", amount: net },
    ],
    emiOptions: emi,
    scholarship: { percent: scholarshipPercent, amount: scholarship },
    benefits: [
      "Placement support + hiring-partner network",
      "1:1 industry mentor + career coach",
      "Capstone project reviewed by working practitioners",
      "Verifiable certificate on completion",
    ],
    bonuses: ["Free interview-prep track", "Alumni network for life"],
    disclaimer: "Offers subject to admin-approved caps and cohort availability.",
  };
}

// -------------------------------------------------------------------------
// Scripts
// -------------------------------------------------------------------------

export function generateScript(kind: "phone" | "zoom" | "college" | "corporate" | "parents" | "career"): { title: string; sections: { heading: string; body: string }[] } {
  switch (kind) {
    case "phone":
      return {
        title: "Phone Call Script — Discovery",
        sections: [
          { heading: "Opener (15s)", body: "Hi {name}, this is {you} from Glintr. Do you have 2 minutes to talk about the {program} you enquired about?" },
          { heading: "Discovery (2m)", body: "What outcome are you looking for in the next 6–12 months? What's stopping you today?" },
          { heading: "Anchor + Proof (1m)", body: "Anchor to outcome first, then walk through 2 alumni stories matching their profile." },
          { heading: "Close (30s)", body: "Book a 20-min zoom this week — offer 2 fixed slots, not open availability." },
        ],
      };
    case "zoom":
      return { title: "Zoom Call Script — Career Consultation", sections: [
        { heading: "Warm-up", body: "Confirm mic/screen, restate their goal, set an agenda: goal → roadmap → fees → EMI → next step." },
        { heading: "Share screen", body: "Walk through personalized roadmap and cohort schedule." },
        { heading: "Objection window", body: "Ask: 'What would stop you from starting the next cohort?' — then address just that." },
        { heading: "Close", body: "Send proposal live in-call and confirm a payment link timeline." },
      ] };
    case "college":
      return { title: "College Counselling Script", sections: [
        { heading: "Rapport", body: "Introduce Glintr, cohort model, and hiring partners relevant to the college's placement history." },
        { heading: "Career fit", body: "Ask about branch, backlogs, prior projects." },
        { heading: "Fee + scholarship", body: "Anchor to placement uplift, then walk through admin-approved scholarships." },
      ] };
    case "corporate":
      return { title: "Corporate Meeting Script", sections: [
        { heading: "Business goal", body: "Ask HR/L&D lead about upcoming roles and skill gaps." },
        { heading: "ROI framing", body: "Show cohort case studies with role-transition data." },
        { heading: "Proposal", body: "Propose a pilot cohort of 15 with milestone-based invoicing." },
      ] };
    case "parents":
      return { title: "Parent Conversation Script", sections: [
        { heading: "Reassure", body: "Highlight placement partners, safety of career, refund policy." },
        { heading: "Investment framing", body: "EMI vs. traditional degree, ROI on 12-month horizon." },
        { heading: "Next step", body: "Book a joint call with the learner + parent this week." },
      ] };
    case "career":
      return { title: "Career Guidance Script", sections: [
        { heading: "Goal", body: "Ask about target role and 3-year vision." },
        { heading: "Gap", body: "Map missing skills to Glintr modules." },
        { heading: "Path", body: "Draw a 6-12-24 month plan; enroll in the closest-fit program." },
      ] };
  }
}

// -------------------------------------------------------------------------
// Negotiation guardrails
// -------------------------------------------------------------------------

export interface NegotiationOffer {
  discountPercent: number;
  scholarshipPercent: number;
  emiMonths: number;
  bonus?: string;
  upsell?: string;
  crossSell?: string;
  approved: boolean;
  reason?: string;
}

export function suggestNegotiation(lead: SalesLead, admin: AdminControls): NegotiationOffer {
  const budget = lead.budgetSensitivity;
  const scholarship = budget === "high" ? admin.maxScholarshipPercent : budget === "medium" ? Math.round(admin.maxScholarshipPercent * 0.6) : Math.round(admin.maxScholarshipPercent * 0.3);
  const discount = budget === "high" ? admin.maxDiscountPercent : Math.round(admin.maxDiscountPercent * 0.5);
  const emiMonths = budget === "high" ? admin.emiRules.maxMonths : 12;
  return {
    discountPercent: Math.min(discount, admin.maxDiscountPercent),
    scholarshipPercent: Math.min(scholarship, admin.maxScholarshipPercent),
    emiMonths,
    bonus: "Interview-prep track",
    upsell: "Career Services Pro (₹15,000)",
    crossSell: lead.program.includes("AI") ? "GenAI micro-track (₹9,900)" : undefined,
    approved: discount <= admin.maxDiscountPercent && scholarship <= admin.maxScholarshipPercent,
    reason: "Within admin-defined caps",
  };
}

// -------------------------------------------------------------------------
// Closing signals
// -------------------------------------------------------------------------

export function detectClosingSignal(lead: SalesLead): { action: "close-now" | "wait" | "offer-scholarship" | "book-counselling" | "send-proposal"; reason: string } {
  const stage = lead.stage;
  const inbound = lead.timeline.filter((e) => e.by === "lead").length;
  if (stage === "Negotiation" && inbound >= 3) return { action: "close-now", reason: "Multiple inbound signals in negotiation stage." };
  if (stage === "Proposal Sent") return { action: "book-counselling", reason: "Proposal shared — book a decision call within 48h." };
  if (stage === "Qualified" && lead.budgetSensitivity === "high") return { action: "offer-scholarship", reason: "Qualified but budget-sensitive — surface admin-approved scholarship." };
  if (stage === "Consulted") return { action: "send-proposal", reason: "Consultation done — send tailored proposal today." };
  return { action: "wait", reason: "No decisive signal — continue nurture." };
}

// -------------------------------------------------------------------------
// Revenue forecast
// -------------------------------------------------------------------------

export function forecastRevenue(leads: SalesLead[], commissionPercent = 70) {
  const totalPipeline = leads.reduce((n, l) => n + priceForProgram(l.program), 0);
  const weighted = leads.reduce((n, l) => {
    const stageProb: Record<string, number> = {
      New: 0.05, Contacted: 0.1, Qualified: 0.25, Consulted: 0.4, "Proposal Sent": 0.55, Negotiation: 0.7, Enrolled: 1, Lost: 0,
    };
    return n + priceForProgram(l.program) * (stageProb[l.stage] ?? 0.1);
  }, 0);
  const monthly = Math.round(weighted);
  const daily = Math.round(monthly / 22);
  const weekly = Math.round(monthly / 4);
  const commission = Math.round((monthly * commissionPercent) / 100);
  return { totalPipeline, daily, weekly, monthly, commission, commissionPercent };
}

// -------------------------------------------------------------------------
// Performance coach — per-partner recommendations
// -------------------------------------------------------------------------

export function performanceRecommendations(leads: SalesLead[]) {
  const untouched = leads.filter((l) => l.stage === "New").length;
  const slow = leads.filter((l) => Date.now() - l.updatedAt > 24 * 3600000 && l.stage !== "Enrolled" && l.stage !== "Lost").length;
  const items: Array<{ severity: "high" | "medium" | "low"; title: string; detail: string }> = [];
  if (untouched > 0) items.push({ severity: "high", title: "Respond within 30 minutes", detail: `${untouched} new leads haven't been contacted. Speed to lead is the #1 driver of conversion.` });
  if (slow > 0) items.push({ severity: "medium", title: "Increase follow-up frequency", detail: `${slow} leads went silent for 24h+. Trigger the Follow-Up AI cadence today.` });
  items.push({ severity: "low", title: "WhatsApp first", detail: "Open every new lead on WhatsApp — reply rates are 4× vs. email in the first 30 minutes." });
  items.push({ severity: "low", title: "Publish 1 LinkedIn post this week", detail: "Consistent LinkedIn presence lifts referral leads by 12–18% for education partners." });
  return items;
}

// -------------------------------------------------------------------------
// Command bar — deterministic NL routing
// -------------------------------------------------------------------------

export interface CommandAnswer {
  answer: string;
  action?: "generate-message" | "call-brief" | "proposal" | "forecast" | "prioritize";
  leadId?: string;
}

export function runCommand(q: string, leads: SalesLead[], admin: AdminControls): CommandAnswer {
  const s = q.toLowerCase();

  if (/who.*call.*first|call first|priority/.test(s)) {
    const ranked = [...leads].map((l) => ({ l, r: qualifyLead(l, admin) })).sort((a, b) => b.r.priority - a.r.priority);
    const top = ranked.slice(0, 3);
    return {
      answer: `Call these first today:\n${top.map((t, i) => `${i + 1}. ${t.l.name} — ${t.l.program} · score ${t.r.score} · ${t.r.intent.toUpperCase()} · est. ₹${t.r.expectedRevenue.toLocaleString()}`).join("\n")}`,
      action: "prioritize",
    };
  }

  if (/likely to convert|most likely/.test(s)) {
    const ranked = [...leads].map((l) => ({ l, r: qualifyLead(l, admin) })).sort((a, b) => b.r.score - a.r.score);
    const top = ranked[0];
    return top ? { answer: `Most likely to convert: ${top.l.name} — ${top.l.program} · score ${top.r.score}. Reasons: ${top.r.reasons.join(", ")}.`, leadId: top.l.id } : { answer: "No leads in pipeline." };
  }

  const nameMatch = leads.find((l) => s.includes(l.name.toLowerCase()) || s.includes(l.name.split(" ")[0].toLowerCase()));

  if (nameMatch && /whatsapp|message|dm|email|sms|linkedin|instagram|telegram/.test(s)) {
    const ch: MessageChannel = /email/.test(s) ? "email" : /sms/.test(s) ? "sms" : /linkedin/.test(s) ? "linkedin" : /instagram/.test(s) ? "instagram" : /telegram/.test(s) ? "telegram" : "whatsapp";
    const r = qualifyLead(nameMatch, admin);
    return { answer: generateMessage(nameMatch, ch, r.intent), action: "generate-message", leadId: nameMatch.id };
  }

  if (nameMatch && /prepare|next call|brief/.test(s)) {
    const brief = buildCallBrief(nameMatch);
    return { answer: `${brief.summary}\n\nLikely objections: ${brief.likelyObjections.join(", ")}\n\nSuggested script: ${brief.suggestedScript}`, action: "call-brief", leadId: nameMatch.id };
  }

  if (/proposal|quote/.test(s)) {
    const target = nameMatch ?? leads[0];
    if (!target) return { answer: "No leads to build a proposal for." };
    const p = buildProposal(target, admin);
    return { answer: `${p.headline}\n\nNet payable: ₹${p.feeBreakdown.at(-1)?.amount.toLocaleString()} · Scholarship ${p.scholarship.percent}%\n\nOpen the Proposal tab for the full PDF-ready view.`, action: "proposal", leadId: target.id };
  }

  if (/forecast|revenue|commission|summar/.test(s)) {
    const f = forecastRevenue(leads);
    return {
      answer: `Pipeline forecast\n\nDaily: ₹${f.daily.toLocaleString()}\nWeekly: ₹${f.weekly.toLocaleString()}\nMonthly: ₹${f.monthly.toLocaleString()}\nCommission (${f.commissionPercent}%): ₹${f.commission.toLocaleString()}`,
      action: "forecast",
    };
  }

  return {
    answer: "Try: 'Who should I call first today?', 'Generate WhatsApp message for {name}', 'Prepare me for my next call with {name}', or 'Forecast monthly revenue'.",
  };
}

// -------------------------------------------------------------------------
// helpers
// -------------------------------------------------------------------------

export function timeAgo(ts: number): string {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
