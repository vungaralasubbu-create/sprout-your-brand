/**
 * Sales AI OS — brand-scoped presentation state.
 * Persists demo leads, timelines, agent settings, and admin controls in
 * localStorage. Real DB persistence graduates in a follow-up phase.
 */

import { useEffect, useState } from "react";
import { DEFAULT_ADMIN_CONTROLS, type AdminControls, type LeadStage, type SalesAgentId } from "./catalog";

const isBrowser = () => typeof window !== "undefined";
const BRAND = "glintr_active_brand_id";
const LEADS_KEY = "glintr_sales_ai_leads_v1";
const AGENTS_KEY = "glintr_sales_ai_agents_v1";
const ADMIN_KEY = "glintr_sales_ai_admin_v1";
const HISTORY_KEY = "glintr_sales_ai_history_v1";

export type LeadChannel = "whatsapp" | "email" | "call" | "sms" | "linkedin" | "instagram" | "telegram" | "meeting" | "system";
export type LeadEventKind =
  | "source"
  | "contact"
  | "message"
  | "call"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "admission"
  | "note"
  | "task"
  | "stage";

export interface LeadEvent {
  id: string;
  at: number;
  kind: LeadEventKind;
  channel?: LeadChannel;
  summary: string;
  detail?: string;
  by?: "partner" | "lead" | "ai" | "system";
}

export interface SalesLead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  program: string;
  source: string; // e.g. Website, WhatsApp, Referral
  createdAt: number;
  updatedAt: number;
  stage: LeadStage;
  score: number; // 0..100
  intent: "hot" | "warm" | "cold";
  expectedRevenue: number;
  bestTimeToContact: string;
  city?: string;
  role?: string; // current job / student
  budgetSensitivity: "low" | "medium" | "high";
  employer?: string;
  parentInvolved?: boolean;
  notes?: string;
  timeline: LeadEvent[];
  ownerId?: string;
}

export interface AgentState {
  enabled: boolean;
  autonomy: "read-only" | "suggest" | "act";
  runs: number;
  timeSavedMinutes: number;
  lastRunAt?: number;
}

export interface CommandHistoryItem {
  id: string;
  at: number;
  q: string;
  a: string;
}

// --- helpers ----------------------------------------------------------------

function activeBrand(): string {
  if (!isBrowser()) return "default";
  return localStorage.getItem(BRAND) || "default";
}
function uid() {
  return (crypto as Crypto).randomUUID?.() ?? String(Date.now() + Math.random());
}
function read<T>(key: string): Record<string, T> {
  if (!isBrowser()) return {};
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}
function write<T>(key: string, value: Record<string, T>, evt: string) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(evt));
}

// --- Leads ------------------------------------------------------------------

export function listLeads(brand = activeBrand()): SalesLead[] {
  const all = read<SalesLead[]>(LEADS_KEY);
  const list = all[brand];
  if (list && list.length) return list;
  // First-load seed for the active brand only.
  const seed = seedLeads();
  all[brand] = seed;
  write(LEADS_KEY, all, "glintr:sales-ai-leads-changed");
  return seed;
}
export function upsertLead(lead: SalesLead, brand = activeBrand()) {
  const all = read<SalesLead[]>(LEADS_KEY);
  const list = all[brand] ?? [];
  const idx = list.findIndex((l) => l.id === lead.id);
  const next = { ...lead, updatedAt: Date.now() };
  if (idx >= 0) list[idx] = next; else list.unshift(next);
  all[brand] = list;
  write(LEADS_KEY, all, "glintr:sales-ai-leads-changed");
}
export function addLeadEvent(leadId: string, evt: Omit<LeadEvent, "id" | "at">, brand = activeBrand()) {
  const all = read<SalesLead[]>(LEADS_KEY);
  const list = all[brand] ?? [];
  const idx = list.findIndex((l) => l.id === leadId);
  if (idx < 0) return;
  const event: LeadEvent = { ...evt, id: uid(), at: Date.now() };
  list[idx] = { ...list[idx], updatedAt: Date.now(), timeline: [event, ...list[idx].timeline].slice(0, 50) };
  all[brand] = list;
  write(LEADS_KEY, all, "glintr:sales-ai-leads-changed");
}
export function setLeadStage(leadId: string, stage: LeadStage, brand = activeBrand()) {
  const all = read<SalesLead[]>(LEADS_KEY);
  const list = all[brand] ?? [];
  const idx = list.findIndex((l) => l.id === leadId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], stage, updatedAt: Date.now() };
  all[brand] = list;
  write(LEADS_KEY, all, "glintr:sales-ai-leads-changed");
  addLeadEvent(leadId, { kind: "stage", channel: "system", by: "ai", summary: `Stage → ${stage}` }, brand);
}

// --- Agent settings ---------------------------------------------------------

export function listAgentStates(brand = activeBrand()): Record<SalesAgentId, AgentState> {
  return (read<Record<SalesAgentId, AgentState>>(AGENTS_KEY)[brand] ?? {}) as Record<SalesAgentId, AgentState>;
}
export function setAgentState(id: SalesAgentId, patch: Partial<AgentState>, brand = activeBrand()) {
  const all = read<Record<SalesAgentId, AgentState>>(AGENTS_KEY);
  const brandMap = all[brand] ?? ({} as Record<SalesAgentId, AgentState>);
  const prev: AgentState = brandMap[id] ?? { enabled: true, autonomy: "suggest", runs: 0, timeSavedMinutes: 0 };
  brandMap[id] = { ...prev, ...patch };
  all[brand] = brandMap;
  write(AGENTS_KEY, all, "glintr:sales-ai-agents-changed");
}
export function bumpAgent(id: SalesAgentId, timeSavedMinutes = 2, brand = activeBrand()) {
  const state = listAgentStates(brand)[id] ?? { enabled: true, autonomy: "suggest", runs: 0, timeSavedMinutes: 0 };
  setAgentState(id, {
    runs: state.runs + 1,
    timeSavedMinutes: state.timeSavedMinutes + timeSavedMinutes,
    lastRunAt: Date.now(),
  }, brand);
}

// --- Admin controls ---------------------------------------------------------

export function getAdminControls(brand = activeBrand()): AdminControls {
  const all = read<AdminControls>(ADMIN_KEY);
  return all[brand] ?? DEFAULT_ADMIN_CONTROLS;
}
export function setAdminControls(patch: Partial<AdminControls>, brand = activeBrand()) {
  const all = read<AdminControls>(ADMIN_KEY);
  const prev = all[brand] ?? DEFAULT_ADMIN_CONTROLS;
  all[brand] = { ...prev, ...patch };
  write(ADMIN_KEY, all, "glintr:sales-ai-admin-changed");
}

// --- Command history --------------------------------------------------------

export function listCommandHistory(brand = activeBrand()): CommandHistoryItem[] {
  return read<CommandHistoryItem[]>(HISTORY_KEY)[brand] ?? [];
}
export function pushCommandHistory(item: Omit<CommandHistoryItem, "id" | "at">, brand = activeBrand()) {
  const all = read<CommandHistoryItem[]>(HISTORY_KEY);
  const list = all[brand] ?? [];
  const next: CommandHistoryItem = { ...item, id: uid(), at: Date.now() };
  all[brand] = [next, ...list].slice(0, 25);
  write(HISTORY_KEY, all, "glintr:sales-ai-history-changed");
  return next;
}

// --- Hooks ------------------------------------------------------------------

function useKey<T>(loader: () => T, event: string): T {
  const [state, setState] = useState<T>(() => loader());
  useEffect(() => {
    const refresh = () => setState(loader());
    window.addEventListener(event, refresh);
    window.addEventListener("glintr:brand-changed", refresh);
    return () => {
      window.removeEventListener(event, refresh);
      window.removeEventListener("glintr:brand-changed", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return state;
}
export const useSalesLeads = () => useKey<SalesLead[]>(() => listLeads(), "glintr:sales-ai-leads-changed");
export const useSalesAgents = () => useKey<Record<SalesAgentId, AgentState>>(() => listAgentStates(), "glintr:sales-ai-agents-changed");
export const useAdminControls = () => useKey<AdminControls>(() => getAdminControls(), "glintr:sales-ai-admin-changed");
export const useCommandHistory = () => useKey<CommandHistoryItem[]>(() => listCommandHistory(), "glintr:sales-ai-history-changed");

// --- Seed -------------------------------------------------------------------

function seedLeads(): SalesLead[] {
  const now = Date.now();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  const base: Array<Partial<SalesLead> & { name: string; program: string }> = [
    { name: "Rahul Verma", program: "AI Engineering Bootcamp", source: "Website", city: "Bengaluru", role: "SDE II @ Fintech", budgetSensitivity: "low", stage: "Consulted" },
    { name: "Priya Sharma", program: "Data Science with Python", source: "Instagram Ad", city: "Delhi", role: "Business Analyst", budgetSensitivity: "medium", stage: "Contacted" },
    { name: "Ankit Iyer", program: "VLSI Design Program", source: "College Referral", city: "Chennai", role: "Final year B.Tech", parentInvolved: true, budgetSensitivity: "high", stage: "Qualified" },
    { name: "Sneha Nair", program: "Full Stack Development", source: "WhatsApp Broadcast", city: "Kochi", role: "Fresher", budgetSensitivity: "high", stage: "New" },
    { name: "Kartik Rao", program: "Cloud DevOps Program", source: "LinkedIn", city: "Pune", role: "DevOps Engineer", employer: "Nexus IT", budgetSensitivity: "low", stage: "Proposal Sent" },
    { name: "Meera Kapoor", program: "UX Design Immersive", source: "Referral", city: "Mumbai", role: "Marketing Manager", budgetSensitivity: "medium", stage: "Negotiation" },
  ];
  return base.map((b, i) => {
    const id = uid();
    const createdAt = now - (i + 1) * (6 * hour);
    return {
      id,
      name: b.name,
      program: b.program,
      source: b.source ?? "Website",
      city: b.city,
      role: b.role,
      employer: b.employer,
      parentInvolved: b.parentInvolved,
      budgetSensitivity: b.budgetSensitivity ?? "medium",
      phone: `+91 9${String(100000000 + i * 13579).slice(0, 9)}`,
      email: `${b.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      createdAt,
      updatedAt: createdAt + hour,
      stage: (b.stage ?? "New") as LeadStage,
      score: 0,
      intent: "warm",
      expectedRevenue: 0,
      bestTimeToContact: "",
      timeline: [
        { id: uid(), at: createdAt, kind: "source", channel: "system", summary: `Source: ${b.source}` },
        { id: uid(), at: createdAt + 30 * min, kind: "contact", channel: "whatsapp", by: "partner", summary: "Introduction message sent" },
        { id: uid(), at: createdAt + 2 * hour, kind: "message", channel: "whatsapp", by: "lead", summary: "Replied: 'Send fee details please'" },
      ],
    } satisfies SalesLead;
  });
}
