// Marketplace metadata + install/pin/favorite/custom agent storage.
import { useEffect, useState, useCallback } from "react";
import { AGENTS, getAgent, type AgentDef, type AgentPermission } from "./agents";

export type AgentMeta = {
  id: string;
  department: "Learning" | "Career" | "Sales" | "Marketing" | "Content" | "Support" | "Operations" | "Analytics";
  capabilities: string[];
  tools: string[];
  languages: string[];
  version: string;
  updatedAt: string;
  featured?: boolean;
};

const META: Record<string, AgentMeta> = {
  "learning-mentor":       { id: "learning-mentor",       department: "Learning",   capabilities: ["Explain","Study plan","Quiz","Summarize","Recommend"], tools: ["Search","Course Data","Student Progress","Calendar"], languages: ["English","Hindi"], version: "1.0", updatedAt: "2026-07-01", featured: true },
  "career-coach":          { id: "career-coach",          department: "Career",     capabilities: ["Career map","Skill map","Interview prep","Roadmap"], tools: ["Search","Course Data","Reports"], languages: ["English","Hindi"], version: "1.0", updatedAt: "2026-07-05", featured: true },
  "coding-mentor":         { id: "coding-mentor",         department: "Learning",   capabilities: ["Debug","Explain code","Concepts","Recommend"], tools: ["Search","Course Data"], languages: ["English"], version: "1.0", updatedAt: "2026-07-10", featured: true },
  "sales-assistant":       { id: "sales-assistant",       department: "Sales",      capabilities: ["Objection handling","Lead reply","Program pitch"], tools: ["CRM","Course Data","Marketing Assets"], languages: ["English","Hindi"], version: "1.0", updatedAt: "2026-07-02", featured: true },
  "marketing-assistant":   { id: "marketing-assistant",   department: "Marketing",  capabilities: ["Social","Email","Landing","Blog ideas","Calendar"], tools: ["Marketing Assets","Blog CMS","Media Library"], languages: ["English","Hindi"], version: "1.0", updatedAt: "2026-07-06", featured: true },
  "seo-geo-assistant":     { id: "seo-geo-assistant",     department: "Marketing",  capabilities: ["Meta rewrite","Internal links","Entity coverage","Gap ideas"], tools: ["Blog CMS","Search","Reports"], languages: ["English"], version: "1.0", updatedAt: "2026-07-08", featured: true },
  "content-assistant":     { id: "content-assistant",     department: "Content",    capabilities: ["Outlines","Glossary","FAQs","Comparisons","Paths"], tools: ["Blog CMS","Media Library","Search"], languages: ["English"], version: "1.0", updatedAt: "2026-07-04", featured: true },
  "support-assistant":     { id: "support-assistant",     department: "Support",    capabilities: ["FAQ","Policy lookup","Docs","Escalate"], tools: ["Support Articles","Notifications"], languages: ["English","Hindi"], version: "1.0", updatedAt: "2026-07-03", featured: true },
  "partner-assistant":     { id: "partner-assistant",     department: "Sales",      capabilities: ["Lead tracking","Dashboard help","Payout status"], tools: ["CRM","Reports","Notifications"], languages: ["English","Hindi"], version: "1.0", updatedAt: "2026-07-05", featured: true },
  "white-label-assistant": { id: "white-label-assistant", department: "Operations", capabilities: ["Branding","LMS","Domain","Certificates"], tools: ["Reports","Media Library"], languages: ["English"], version: "1.0", updatedAt: "2026-07-07", featured: true },
  "analytics-assistant":   { id: "analytics-assistant",   department: "Analytics",  capabilities: ["Trend spotting","Report summary","Insight draft"], tools: ["Analytics","Reports"], languages: ["English"], version: "1.0", updatedAt: "2026-07-09", featured: true },
  "administrator-assistant":{id: "administrator-assistant",department: "Operations",capabilities: ["Ops summary","Anomaly flagging","Playbook draft"], tools: ["Reports","Analytics","Notifications"], languages: ["English"], version: "1.0", updatedAt: "2026-07-06", featured: true },
};

export function getAgentMeta(id: string): AgentMeta | undefined { return META[id]; }

export type CustomAgent = {
  id: string;
  name: string;
  tagline: string;
  instructions: string;
  greeting: string;
  starters: string[];
  knowledge: string[];
  tools: string[];
  audience: AgentPermission[];
  color: string;
  department: AgentMeta["department"];
  createdAt: number;
  updatedAt: number;
};

const KEY_INSTALL = "glintr.aios.market.install.v1";
const KEY_CUSTOM = "glintr.aios.market.custom.v1";

type InstallState = { enabled: string[]; pinned: string[]; favorites: string[]; defaultAgent: string | null };
const DEFAULT_INSTALL: InstallState = {
  enabled: AGENTS.map((a) => a.id),
  pinned: ["learning-mentor", "career-coach"],
  favorites: [],
  defaultAgent: "learning-mentor",
};

function read<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = window.localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : fb; } catch { return fb; }
}
function write<T>(k: string, v: T) { if (typeof window !== "undefined") try { window.localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

export function useAgentInstall() {
  const [state, setState] = useState<InstallState>(DEFAULT_INSTALL);
  useEffect(() => { setState(read(KEY_INSTALL, DEFAULT_INSTALL)); }, []);
  const persist = (next: InstallState) => { setState(next); write(KEY_INSTALL, next); };
  const toggle = (list: keyof InstallState, id: string) => {
    const cur = state[list];
    if (!Array.isArray(cur)) return;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    persist({ ...state, [list]: next } as InstallState);
  };
  return {
    state,
    toggleEnabled: (id: string) => toggle("enabled", id),
    togglePinned: (id: string) => toggle("pinned", id),
    toggleFavorite: (id: string) => toggle("favorites", id),
    setDefault: (id: string) => persist({ ...state, defaultAgent: id }),
  };
}

export function useCustomAgents() {
  const [items, setItems] = useState<CustomAgent[]>([]);
  useEffect(() => { setItems(read<CustomAgent[]>(KEY_CUSTOM, [])); }, []);
  const persist = (next: CustomAgent[]) => { setItems(next); write(KEY_CUSTOM, next); };
  const save = useCallback((a: Omit<CustomAgent, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const all = read<CustomAgent[]>(KEY_CUSTOM, []);
    if (a.id) {
      const next = all.map((x) => x.id === a.id ? { ...x, ...a, updatedAt: Date.now() } : x);
      persist(next);
      return next.find((x) => x.id === a.id)!;
    }
    const created: CustomAgent = { ...a, id: "custom-" + uid(), createdAt: Date.now(), updatedAt: Date.now() };
    persist([created, ...all]);
    return created;
  }, []);
  const remove = useCallback((id: string) => { persist(read<CustomAgent[]>(KEY_CUSTOM, []).filter((x) => x.id !== id)); }, []);
  return { items, save, remove };
}

// Orchestrator: pick agent from a question + page path.
export function suggestAgent(question: string, path: string = "/"): string {
  const q = question.toLowerCase();
  if (/interview|career|role|resume|salary/.test(q)) return "career-coach";
  if (/code|python|javascript|bug|error|function|class/.test(q)) return "coding-mentor";
  if (/lead|pitch|objection|prospect|whatsapp reply|close deal/.test(q)) return "sales-assistant";
  if (/social|instagram|email|campaign|blog idea|linkedin|caption/.test(q)) return "marketing-assistant";
  if (/seo|meta description|internal link|glossary term|entity/.test(q)) return "seo-geo-assistant";
  if (/outline|article|faq|comparison|guide|glossary entry/.test(q)) return "content-assistant";
  if (/refund|policy|password|certificate|payout status|invoice/.test(q)) return "support-assistant";
  if (/dashboard|kpi|trend|anomaly|report|conversion rate/.test(q)) return "analytics-assistant";
  if (/brand|white label|domain|lms setting|logo/.test(q)) return "white-label-assistant";
  if (path.startsWith("/admin")) return "administrator-assistant";
  if (path.startsWith("/partner")) return "partner-assistant";
  if (path.startsWith("/brand")) return "white-label-assistant";
  return "learning-mentor";
}

export function agentToDef(a: CustomAgent): AgentDef {
  const RULES = "You are a specialized Glintr AI assistant. Never invent Glintr policies, guarantees or partnerships. Respect user permissions. Be honest about uncertainty. No em-dashes. No hype.";
  return {
    id: a.id,
    name: a.name,
    tagline: a.tagline,
    icon: (getAgent("learning-mentor")!.icon),
    color: a.color,
    audience: a.audience,
    responsibilities: a.knowledge,
    knowledge: a.knowledge,
    systemPrompt: `${RULES}\nRole: ${a.name}. ${a.instructions}`,
    starters: a.starters,
  };
}

export { AGENTS, getAgent };
export type { AgentDef, AgentPermission };
