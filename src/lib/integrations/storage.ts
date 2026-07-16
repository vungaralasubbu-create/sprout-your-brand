/**
 * Integration Hub — client-side storage
 *
 * Presentation-layer state for connections and API keys, scoped by brand
 * (multi-tenant academy partners). Credentials themselves are NEVER real —
 * we only persist metadata (connected/disconnected, chosen default, health
 * snapshot, masked field hints). Graduating to real credential storage
 * belongs to a follow-up phase using App User Connectors + encrypted
 * server-side rows.
 */

import { useEffect, useState } from "react";

const isBrowser = () => typeof window !== "undefined";
const BRAND_KEY = "glintr_active_brand_id";
const STATE_KEY = "glintr_integrations_v1";
const APIKEY_KEY = "glintr_dev_api_keys_v1";
const APPS_KEY = "glintr_marketplace_v1";

export interface ConnectionState {
  connected: boolean;
  connectedAt?: number;
  fieldHints: Record<string, string>; // masked/partial values for display only
  isDefault?: boolean; // for categories that support a default (payments, AI)
  lastSyncAt?: number;
  errorCount?: number;
  usage?: number; // rolling counter
}

export interface DevApiKey {
  id: string;
  label: string;
  prefix: string; // e.g. glr_live_ab12
  scopes: string[];
  createdAt: number;
  lastUsedAt?: number;
  mode: "live" | "sandbox";
}

export type BrandStore = Record<string, ConnectionState>; // providerId -> state

function getActiveBrandId(): string {
  if (!isBrowser()) return "default";
  return localStorage.getItem(BRAND_KEY) || "default";
}

export function setActiveBrandId(id: string) {
  if (!isBrowser()) return;
  localStorage.setItem(BRAND_KEY, id);
  window.dispatchEvent(new CustomEvent("glintr:brand-changed", { detail: id }));
}

function readAllBrands(): Record<string, BrandStore> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAllBrands(data: Record<string, BrandStore>) {
  if (!isBrowser()) return;
  localStorage.setItem(STATE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("glintr:integrations-changed"));
}

export function getConnections(brandId = getActiveBrandId()): BrandStore {
  return readAllBrands()[brandId] ?? {};
}

export function getConnection(providerId: string, brandId = getActiveBrandId()): ConnectionState | undefined {
  return getConnections(brandId)[providerId];
}

export function setConnection(providerId: string, patch: Partial<ConnectionState>, brandId = getActiveBrandId()) {
  const all = readAllBrands();
  const brand = all[brandId] ?? {};
  const prev = brand[providerId] ?? { connected: false, fieldHints: {} };
  brand[providerId] = { ...prev, ...patch, fieldHints: { ...prev.fieldHints, ...(patch.fieldHints ?? {}) } };
  all[brandId] = brand;
  writeAllBrands(all);
}

export function disconnect(providerId: string, brandId = getActiveBrandId()) {
  const all = readAllBrands();
  const brand = all[brandId] ?? {};
  delete brand[providerId];
  all[brandId] = brand;
  writeAllBrands(all);
}

export function setDefaultInCategory(providerIds: string[], defaultId: string, brandId = getActiveBrandId()) {
  const all = readAllBrands();
  const brand = all[brandId] ?? {};
  for (const id of providerIds) {
    if (brand[id]) brand[id].isDefault = id === defaultId;
  }
  all[brandId] = brand;
  writeAllBrands(all);
}

export function maskValue(value: string): string {
  if (!value) return "";
  if (value.length <= 6) return "•".repeat(value.length);
  return value.slice(0, 3) + "…" + value.slice(-3);
}

// --- React hook -------------------------------------------------------------

export function useConnections(): { brand: string; connections: BrandStore } {
  const [state, setState] = useState<{ brand: string; connections: BrandStore }>({
    brand: getActiveBrandId(),
    connections: getConnections(),
  });

  useEffect(() => {
    const refresh = () => setState({ brand: getActiveBrandId(), connections: getConnections() });
    window.addEventListener("glintr:integrations-changed", refresh);
    window.addEventListener("glintr:brand-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("glintr:integrations-changed", refresh);
      window.removeEventListener("glintr:brand-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return state;
}

// --- Dev API keys -----------------------------------------------------------

function randomHex(len: number): string {
  if (isBrowser() && typeof crypto !== "undefined") {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
  }
  return Math.random().toString(16).slice(2, 2 + len);
}

export function listApiKeys(brandId = getActiveBrandId()): DevApiKey[] {
  if (!isBrowser()) return [];
  try {
    const all: Record<string, DevApiKey[]> = JSON.parse(localStorage.getItem(APIKEY_KEY) || "{}");
    return all[brandId] ?? [];
  } catch {
    return [];
  }
}

export function createApiKey(input: { label: string; scopes: string[]; mode: "live" | "sandbox" }, brandId = getActiveBrandId()) {
  const all: Record<string, DevApiKey[]> = (() => {
    try { return JSON.parse(localStorage.getItem(APIKEY_KEY) || "{}"); } catch { return {}; }
  })();
  const list = all[brandId] ?? [];
  const key: DevApiKey = {
    id: crypto?.randomUUID?.() ?? String(Date.now()),
    label: input.label,
    scopes: input.scopes,
    mode: input.mode,
    prefix: `glr_${input.mode === "live" ? "live" : "test"}_${randomHex(6)}`,
    createdAt: Date.now(),
  };
  all[brandId] = [key, ...list];
  localStorage.setItem(APIKEY_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("glintr:apikeys-changed"));
  return key;
}

export function revokeApiKey(id: string, brandId = getActiveBrandId()) {
  const all: Record<string, DevApiKey[]> = (() => {
    try { return JSON.parse(localStorage.getItem(APIKEY_KEY) || "{}"); } catch { return {}; }
  })();
  all[brandId] = (all[brandId] ?? []).filter((k) => k.id !== id);
  localStorage.setItem(APIKEY_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("glintr:apikeys-changed"));
}

export function useApiKeys(): DevApiKey[] {
  const [keys, setKeys] = useState<DevApiKey[]>(() => listApiKeys());
  useEffect(() => {
    const refresh = () => setKeys(listApiKeys());
    window.addEventListener("glintr:apikeys-changed", refresh);
    window.addEventListener("glintr:brand-changed", refresh);
    return () => {
      window.removeEventListener("glintr:apikeys-changed", refresh);
      window.removeEventListener("glintr:brand-changed", refresh);
    };
  }, []);
  return keys;
}

// --- Marketplace ------------------------------------------------------------

export function listInstalledApps(brandId = getActiveBrandId()): Record<string, boolean> {
  if (!isBrowser()) return {};
  try {
    const all: Record<string, Record<string, boolean>> = JSON.parse(localStorage.getItem(APPS_KEY) || "{}");
    return all[brandId] ?? {};
  } catch {
    return {};
  }
}

export function setAppInstalled(appId: string, installed: boolean, brandId = getActiveBrandId()) {
  const all: Record<string, Record<string, boolean>> = (() => {
    try { return JSON.parse(localStorage.getItem(APPS_KEY) || "{}"); } catch { return {}; }
  })();
  all[brandId] = { ...(all[brandId] ?? {}), [appId]: installed };
  localStorage.setItem(APPS_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("glintr:apps-changed"));
}

export function useInstalledApps(): Record<string, boolean> {
  const [apps, setApps] = useState<Record<string, boolean>>(() => listInstalledApps());
  useEffect(() => {
    const refresh = () => setApps(listInstalledApps());
    window.addEventListener("glintr:apps-changed", refresh);
    window.addEventListener("glintr:brand-changed", refresh);
    return () => {
      window.removeEventListener("glintr:apps-changed", refresh);
      window.removeEventListener("glintr:brand-changed", refresh);
    };
  }, []);
  return apps;
}
