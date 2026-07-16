/**
 * Marketplace storage — brand-scoped presentation state for installed apps,
 * enabled agents, granted permissions, and audit log. Real capability
 * execution and sandboxing ship in a follow-up phase.
 */

import { useEffect, useState } from "react";
import type { AppPermission } from "./catalog";

const isBrowser = () => typeof window !== "undefined";
const BRAND_KEY = "glintr_active_brand_id";
const APPS_KEY = "glintr_marketplace_apps_v1";
const AGENTS_KEY = "glintr_marketplace_agents_v1";
const AUDIT_KEY = "glintr_marketplace_audit_v1";
const REVIEWS_KEY = "glintr_marketplace_reviews_v1";

export interface AppInstallState {
  installed: boolean;
  enabled: boolean;
  installedAt?: number;
  version: string;
  permissionsGranted: AppPermission[];
  usage?: number;
}

export interface AgentEnableState {
  enabled: boolean;
  activatedAt?: number;
  conversations: number;
  actionsRun: number;
  timeSavedMinutes: number;
  settings: {
    autonomy: "read-only" | "suggest" | "act";
    reviewRequired: boolean;
    schedule: "on-demand" | "hourly" | "daily";
  };
}

export interface AuditEvent {
  id: string;
  at: number;
  kind: "install" | "uninstall" | "enable" | "disable" | "permission" | "agent-enable" | "agent-disable" | "workflow-run";
  target: string;
  detail?: string;
}

export interface AppReview {
  id: string;
  appId: string;
  rating: number;
  author: string;
  body: string;
  at: number;
}

function activeBrand(): string {
  if (!isBrowser()) return "default";
  return localStorage.getItem(BRAND_KEY) || "default";
}

function readMap<T>(key: string): Record<string, Record<string, T>> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}
function writeMap<T>(key: string, value: Record<string, Record<string, T>>, event: string) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(event));
}

// --- Apps -----------------------------------------------------------------

export function getAppState(id: string, brand = activeBrand()): AppInstallState | undefined {
  return readMap<AppInstallState>(APPS_KEY)[brand]?.[id];
}
export function listAppStates(brand = activeBrand()): Record<string, AppInstallState> {
  return readMap<AppInstallState>(APPS_KEY)[brand] ?? {};
}
export function setAppState(id: string, patch: Partial<AppInstallState>, brand = activeBrand()) {
  const all = readMap<AppInstallState>(APPS_KEY);
  const b = all[brand] ?? {};
  const prev = b[id] ?? {
    installed: false,
    enabled: false,
    version: "0.0.0",
    permissionsGranted: [],
  };
  b[id] = { ...prev, ...patch };
  all[brand] = b;
  writeMap(APPS_KEY, all, "glintr:marketplace-apps-changed");
}

export function installApp(id: string, version: string, permissions: AppPermission[], brand = activeBrand()) {
  setAppState(id, { installed: true, enabled: true, installedAt: Date.now(), version, permissionsGranted: permissions }, brand);
  addAudit({ kind: "install", target: id, detail: `v${version}` }, brand);
}
export function uninstallApp(id: string, brand = activeBrand()) {
  setAppState(id, { installed: false, enabled: false, permissionsGranted: [] }, brand);
  addAudit({ kind: "uninstall", target: id }, brand);
}
export function toggleApp(id: string, enabled: boolean, brand = activeBrand()) {
  setAppState(id, { enabled }, brand);
  addAudit({ kind: enabled ? "enable" : "disable", target: id }, brand);
}
export function updateAppPermissions(id: string, permissions: AppPermission[], brand = activeBrand()) {
  setAppState(id, { permissionsGranted: permissions }, brand);
  addAudit({ kind: "permission", target: id, detail: permissions.join(", ") }, brand);
}

// --- Agents ---------------------------------------------------------------

export function getAgentState(id: string, brand = activeBrand()): AgentEnableState | undefined {
  return readMap<AgentEnableState>(AGENTS_KEY)[brand]?.[id];
}
export function listAgentStates(brand = activeBrand()): Record<string, AgentEnableState> {
  return readMap<AgentEnableState>(AGENTS_KEY)[brand] ?? {};
}
export function setAgentState(id: string, patch: Partial<AgentEnableState>, brand = activeBrand()) {
  const all = readMap<AgentEnableState>(AGENTS_KEY);
  const b = all[brand] ?? {};
  const prev: AgentEnableState = b[id] ?? {
    enabled: false,
    conversations: 0,
    actionsRun: 0,
    timeSavedMinutes: 0,
    settings: { autonomy: "suggest", reviewRequired: true, schedule: "on-demand" },
  };
  b[id] = {
    ...prev,
    ...patch,
    settings: { ...prev.settings, ...(patch.settings ?? {}) },
  };
  all[brand] = b;
  writeMap(AGENTS_KEY, all, "glintr:marketplace-agents-changed");
}
export function enableAgent(id: string, brand = activeBrand()) {
  setAgentState(id, { enabled: true, activatedAt: Date.now() }, brand);
  addAudit({ kind: "agent-enable", target: id }, brand);
}
export function disableAgent(id: string, brand = activeBrand()) {
  setAgentState(id, { enabled: false }, brand);
  addAudit({ kind: "agent-disable", target: id }, brand);
}

// --- Audit ----------------------------------------------------------------

function readAudit(): Record<string, AuditEvent[]> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || "{}");
  } catch {
    return {};
  }
}
export function listAudit(brand = activeBrand()): AuditEvent[] {
  return readAudit()[brand] ?? [];
}
export function addAudit(evt: Omit<AuditEvent, "id" | "at">, brand = activeBrand()) {
  if (!isBrowser()) return;
  const all = readAudit();
  const list = all[brand] ?? [];
  const next: AuditEvent = { ...evt, id: (crypto as Crypto).randomUUID?.() ?? String(Date.now()), at: Date.now() };
  all[brand] = [next, ...list].slice(0, 200);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("glintr:marketplace-audit-changed"));
}

// --- Reviews --------------------------------------------------------------

export function listReviews(appId: string, brand = activeBrand()): AppReview[] {
  if (!isBrowser()) return [];
  try {
    const all: Record<string, AppReview[]> = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
    return (all[brand] ?? []).filter((r) => r.appId === appId);
  } catch {
    return [];
  }
}
export function addReview(review: Omit<AppReview, "id" | "at">, brand = activeBrand()) {
  if (!isBrowser()) return;
  const all: Record<string, AppReview[]> = (() => {
    try { return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}"); } catch { return {}; }
  })();
  const list = all[brand] ?? [];
  const next: AppReview = { ...review, id: (crypto as Crypto).randomUUID?.() ?? String(Date.now()), at: Date.now() };
  all[brand] = [next, ...list].slice(0, 500);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("glintr:marketplace-reviews-changed"));
}

// --- Hooks ----------------------------------------------------------------

export function useMarketplaceApps(): Record<string, AppInstallState> {
  const [state, setState] = useState<Record<string, AppInstallState>>(() => listAppStates());
  useEffect(() => {
    const refresh = () => setState(listAppStates());
    window.addEventListener("glintr:marketplace-apps-changed", refresh);
    window.addEventListener("glintr:brand-changed", refresh);
    return () => {
      window.removeEventListener("glintr:marketplace-apps-changed", refresh);
      window.removeEventListener("glintr:brand-changed", refresh);
    };
  }, []);
  return state;
}
export function useMarketplaceAgents(): Record<string, AgentEnableState> {
  const [state, setState] = useState<Record<string, AgentEnableState>>(() => listAgentStates());
  useEffect(() => {
    const refresh = () => setState(listAgentStates());
    window.addEventListener("glintr:marketplace-agents-changed", refresh);
    window.addEventListener("glintr:brand-changed", refresh);
    return () => {
      window.removeEventListener("glintr:marketplace-agents-changed", refresh);
      window.removeEventListener("glintr:brand-changed", refresh);
    };
  }, []);
  return state;
}
export function useMarketplaceAudit(): AuditEvent[] {
  const [state, setState] = useState<AuditEvent[]>(() => listAudit());
  useEffect(() => {
    const refresh = () => setState(listAudit());
    window.addEventListener("glintr:marketplace-audit-changed", refresh);
    window.addEventListener("glintr:brand-changed", refresh);
    return () => {
      window.removeEventListener("glintr:marketplace-audit-changed", refresh);
      window.removeEventListener("glintr:brand-changed", refresh);
    };
  }, []);
  return state;
}
