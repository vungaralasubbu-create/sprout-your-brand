import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { useCustomAgents, type CustomAgent } from "@/lib/aios/marketplace";
import type { AgentPermission } from "@/lib/aios/agents";

export const Route = createFileRoute("/_authenticated/admin/ai-agents/new")({
  component: CustomAgentsPage,
});

const AUDIENCES: AgentPermission[] = ["student", "partner", "brand", "editor", "admin", "public"];
const DEPTS = ["Learning", "Career", "Sales", "Marketing", "Content", "Support", "Operations", "Analytics"] as const;
const KNOWLEDGE = ["Programs", "Learn Guides", "Glossary", "Knowledge Graph", "Blogs", "Roadmaps", "CRM", "Support Articles", "Documentation", "Policies"];
const TOOLS = ["Search", "CRM", "Analytics", "Student Progress", "Course Data", "Marketing Assets", "Blog CMS", "Media Library", "Notifications", "Calendar", "Reports"];

const BLANK: Omit<CustomAgent, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  tagline: "",
  instructions: "",
  greeting: "How can I help today?",
  starters: [],
  knowledge: [],
  tools: [],
  audience: ["public"],
  color: "oklch(66% 0.14 260)",
  department: "Operations",
};

function CustomAgentsPage() {
  const { items, save, remove } = useCustomAgents();
  const [draft, setDraft] = useState<Partial<CustomAgent>>(BLANK);
  const [startersText, setStartersText] = useState("");

  const submit = () => {
    if (!draft.name || !draft.instructions) return;
    const starters = startersText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6);
    save({
      ...(BLANK as any),
      ...draft,
      starters,
    } as any);
    setDraft(BLANK);
    setStartersText("");
  };

  const toggle = <K extends keyof CustomAgent>(field: K, value: any) => {
    const cur = (draft[field] as any) ?? [];
    setDraft({ ...draft, [field]: cur.includes(value) ? cur.filter((x: any) => x !== value) : [...cur, value] });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><Sparkles className="size-3" /> Custom Agents</p>
        <h1 className="mt-1 text-2xl font-semibold">Create a custom agent</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">Custom agents follow the same AIOS guardrails and never override policy protections.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-white p-5 space-y-3">
          <Field label="Agent name">
            <input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full rounded border border-border/60 px-3 py-2 text-sm" placeholder="Faculty Assistant" />
          </Field>
          <Field label="Tagline">
            <input value={draft.tagline ?? ""} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} className="w-full rounded border border-border/60 px-3 py-2 text-sm" placeholder="Helps faculty prepare course sessions" />
          </Field>
          <Field label="Instructions">
            <textarea value={draft.instructions ?? ""} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} className="w-full min-h-[120px] rounded border border-border/60 px-3 py-2 text-sm font-mono" placeholder="Describe what this agent does, its tone and its constraints." />
          </Field>
          <Field label="Greeting">
            <input value={draft.greeting ?? ""} onChange={(e) => setDraft({ ...draft, greeting: e.target.value })} className="w-full rounded border border-border/60 px-3 py-2 text-sm" />
          </Field>
          <Field label="Suggested questions (one per line)">
            <textarea value={startersText} onChange={(e) => setStartersText(e.target.value)} className="w-full min-h-[80px] rounded border border-border/60 px-3 py-2 text-sm" placeholder={"Prepare a session outline\nDraft a rubric for..."}></textarea>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Department">
              <select value={draft.department ?? "Operations"} onChange={(e) => setDraft({ ...draft, department: e.target.value as any })} className="w-full rounded border border-border/60 px-3 py-2 text-sm">
                {DEPTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Theme color">
              <input value={draft.color ?? ""} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="w-full rounded border border-border/60 px-3 py-2 text-sm font-mono" />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-white p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Knowledge sources</p>
            <div className="flex flex-wrap gap-1.5">
              {KNOWLEDGE.map((k) => {
                const on = draft.knowledge?.includes(k);
                return <button key={k} type="button" onClick={() => toggle("knowledge", k)} className={"rounded-full border px-3 py-1 text-[11px] " + (on ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground hover:bg-muted")}>{k}</button>;
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Tools</p>
            <div className="flex flex-wrap gap-1.5">
              {TOOLS.map((k) => {
                const on = draft.tools?.includes(k);
                return <button key={k} type="button" onClick={() => toggle("tools", k)} className={"rounded-full border px-3 py-1 text-[11px] " + (on ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground hover:bg-muted")}>{k}</button>;
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Role permissions</p>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCES.map((k) => {
                const on = draft.audience?.includes(k);
                return <button key={k} type="button" onClick={() => toggle("audience", k)} className={"rounded-full border px-3 py-1 text-[11px] capitalize " + (on ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground hover:bg-muted")}>{k}</button>;
              })}
            </div>
          </div>
          <button type="button" onClick={submit} className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40" disabled={!draft.name || !draft.instructions}>
            <Plus className="size-3.5" /> Save agent
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">Your custom agents ({items.length})</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {items.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
          {items.map((a) => (
            <div key={a.id} className="rounded-lg border border-border/60 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{a.tagline}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/80 mt-1">{a.department} · {a.audience.join(", ")}</p>
                </div>
                <button type="button" onClick={() => remove(a.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
