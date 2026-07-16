import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity, AlertTriangle, ArrowRight, Building2, CheckCircle2, ChevronDown,
  ClipboardList, FileText, GraduationCap, Heart, LayoutDashboard,
  Megaphone, Plus, Save, Search, Settings2, Sparkles, Star,
  Target, Trash2, TrendingUp, Users, Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getPartnerKpis } from "@/lib/partner/business-os.functions";
import {
  activeBrand, computeHealthScore, loadOs, saveOs, settingsCompleteness,
  updateOs, useOsListener,
  type BrandProfile, type BusinessDocument, type BusinessTask, type OsState, type TaskCenter,
} from "@/lib/business-os/storage";

/* ---------- shared hook ---------- */
export function useOs() {
  const [state, setState] = useState<OsState>(() => loadOs());
  useEffect(() => useOsListener(() => setState(loadOs())), []);
  return state;
}

/* ---------- brand switcher ---------- */
export function BrandSwitcher() {
  const state = useOs();
  const active = activeBrand(state);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const createBrand = () => {
    if (!name.trim()) return;
    const id = `b_${Date.now()}`;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    updateOs((s) => {
      s.brands.push({ id, name: name.trim(), slug, color: "#22d3ee", createdAt: new Date().toISOString() });
      s.activeBrandId = id;
    });
    setName(""); setCreating(false); setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left hover:border-cyan-400/40"
      >
        <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold text-slate-950" style={{ background: active.color ?? "#22d3ee" }}>
          {active.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="pr-1">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Active brand</div>
          <div className="text-sm font-medium text-white">{active.name}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-white/10 bg-[#0a0f1e] p-2 shadow-xl">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-slate-500">Switch brand</div>
          {state.brands.map((b) => (
            <button
              key={b.id}
              onClick={() => { updateOs((s) => { s.activeBrandId = b.id; }); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5",
                b.id === state.activeBrandId && "bg-cyan-500/10 text-cyan-200",
              )}
            >
              <div className="grid h-6 w-6 place-items-center rounded text-[10px] font-semibold text-slate-950" style={{ background: b.color ?? "#22d3ee" }}>
                {b.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="flex-1">{b.name}</span>
              {b.id === state.activeBrandId && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />}
            </button>
          ))}
          <div className="my-2 h-px bg-white/5" />
          {creating ? (
            <div className="space-y-2 p-2">
              <Input placeholder="New brand name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 text-white" />
              <div className="flex gap-2">
                <Button size="sm" onClick={createBrand} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">Create</Button>
                <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-cyan-300 hover:bg-cyan-500/5">
              <Plus className="h-3.5 w-3.5" /> Add another brand
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- business home (health score + KPIs + advisor + task summary) ---------- */
export function BusinessHome() {
  const state = useOs();
  const fetchKpis = useServerFn(getPartnerKpis);
  const { data: kpis } = useQuery({ queryKey: ["partner-kpis-home"], queryFn: () => fetchKpis(), staleTime: 60_000 });

  const now = Date.now();
  const tasksOpen = state.tasks.filter((t) => t.status !== "done").length;
  const tasksOverdue = state.tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate).getTime() < now).length;
  const settingsCompl = settingsCompleteness(state.settings);
  const health = useMemo(
    () => computeHealthScore({
      leadsMonth: kpis?.leadsMonth as number | undefined,
      unreadMessages: kpis?.unreadMessages as number | undefined,
      followUpsPending: kpis?.followUpsPending as number | undefined,
      tasksOpen,
      tasksOverdue,
      settingsComplete: settingsCompl,
    }),
    [kpis, tasksOpen, tasksOverdue, settingsCompl],
  );

  const bandColor = {
    excellent: "text-emerald-300", good: "text-cyan-300", fair: "text-amber-300", low: "text-rose-300",
  }[health.band];

  const KPIS = [
    { icon: Wallet, label: "Revenue MTD", value: "₹4,82,450", delta: "+14%" },
    { icon: Users, label: "Students", value: kpis?.students ?? 128, delta: "+6" },
    { icon: GraduationCap, label: "Active courses", value: kpis?.activeCourses ?? 12 },
    { icon: TrendingUp, label: "Admissions", value: kpis?.leadsMonth ?? 34, delta: "+9" },
    { icon: Target, label: "Lead conversion", value: `${kpis?.conversionRate ?? 18}%` },
    { icon: Activity, label: "Website visits", value: kpis?.websiteVisits ?? "2.1k", delta: "+22%" },
    { icon: Search, label: "SEO score", value: "78/100" },
    { icon: Megaphone, label: "Marketing score", value: "84/100" },
    { icon: ClipboardList, label: "Support tickets", value: kpis?.openTickets ?? 4 },
    { icon: CheckCircle2, label: "Pending tasks", value: tasksOpen },
    { icon: Sparkles, label: "AI recos", value: 6 },
    { icon: Star, label: "Growth score", value: "72/100" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Health score + settings completeness */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm text-cyan-200"><Heart className="h-4 w-4" /> Business health score</CardTitle>
              <p className="mt-1 text-xs text-slate-400">Composite score from revenue, leads, tasks, and setup completeness.</p>
            </div>
            <Badge className={cn("capitalize", bandColor, "bg-white/5")}>{health.band}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className={cn("font-display text-6xl font-semibold tabular-nums", bandColor)}>{health.score}</div>
              <div className="pb-2 text-xs text-slate-400">/ 100</div>
            </div>
            <Progress value={health.score} className="mt-4 h-2 bg-white/5" />
            {health.hints.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                {health.hints.slice(0, 4).map((h, i) => (
                  <li key={i} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />{h}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-sm text-cyan-200">Setup completeness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">{Math.round(settingsCompl * 100)}%</div>
            <Progress value={settingsCompl * 100} className="mt-2 h-2 bg-white/5" />
            <p className="mt-3 text-xs text-slate-400">Complete your brand, support, payment gateway, and legal pages.</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI grid */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
          <LayoutDashboard className="h-4 w-4 text-cyan-300" /> Real-time business metrics
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-cyan-400/30">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  {"delta" in k && k.delta && <span className="text-[10px] font-medium text-emerald-300">{k.delta}</span>}
                </div>
                <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">{k.label}</div>
                <div className="mt-1 text-xl font-semibold text-white">{k.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI recommendations + top tasks */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-cyan-200"><Sparkles className="h-4 w-4" /> AI recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "Increase pricing on your top course — +12% at current conversion.",
              "Launch a WhatsApp re-engagement flow for 42 cold leads.",
              "Publish 2 blogs this week to stay above the SEO cadence line.",
              "Contact 3 dormant students in Python module 4 — dropout risk high.",
              "Hire 1 mentor for the AI cohort — attendance dropping.",
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-sm text-slate-200">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
                <span className="flex-1">{r}</span>
                <button className="text-xs text-cyan-300 hover:underline">Act</button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm text-cyan-200"><ClipboardList className="h-4 w-4" /> Top pending tasks</CardTitle>
            <span className="text-[10px] text-slate-500">{tasksOpen} open · {tasksOverdue} overdue</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.tasks.filter((t) => t.status !== "done").slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-sm">
                <PriorityDot p={t.priority} />
                <div className="flex-1">
                  <div className="text-slate-100">{t.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">{t.center} · {t.source === "ai" ? "AI generated" : "manual"}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </div>
            ))}
            {tasksOpen === 0 && <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">All caught up — nice.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PriorityDot({ p }: { p: BusinessTask["priority"] }) {
  const cls = p === "high" ? "bg-rose-400" : p === "med" ? "bg-amber-400" : "bg-slate-500";
  return <span className={cn("inline-block h-2 w-2 rounded-full", cls)} />;
}

/* ---------- task center ---------- */
export function TaskCenter() {
  const state = useOs();
  const [filter, setFilter] = useState<"all" | "open" | "done" | "overdue">("all");
  const [title, setTitle] = useState("");
  const [center, setCenter] = useState<TaskCenter>("general");
  const [priority, setPriority] = useState<BusinessTask["priority"]>("med");

  const add = () => {
    if (!title.trim()) return;
    updateOs((s) => {
      s.tasks.unshift({
        id: `t_${Date.now()}`, title: title.trim(), center, status: "open",
        priority, source: "manual", createdAt: new Date().toISOString(),
      });
    });
    setTitle("");
  };
  const toggle = (id: string) => updateOs((s) => {
    const t = s.tasks.find((x) => x.id === id); if (!t) return;
    t.status = t.status === "done" ? "open" : "done";
    t.completedAt = t.status === "done" ? new Date().toISOString() : undefined;
  });
  const remove = (id: string) => updateOs((s) => { s.tasks = s.tasks.filter((t) => t.id !== id); });

  const now = Date.now();
  const filtered = state.tasks.filter((t) => {
    if (filter === "open") return t.status !== "done";
    if (filter === "done") return t.status === "done";
    if (filter === "overdue") return t.status !== "done" && t.dueDate && new Date(t.dueDate).getTime() < now;
    return true;
  });

  const CENTERS: TaskCenter[] = ["operations", "finance", "marketing", "sales", "content", "website", "lms", "communication", "hr", "analytics", "general"];

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader><CardTitle className="text-sm text-cyan-200">Add task</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/5 text-white placeholder:text-slate-500" />
          <div className="flex flex-wrap gap-2">
            {CENTERS.map((c) => (
              <button key={c} onClick={() => setCenter(c)}
                className={cn("rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors",
                  center === c ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-slate-400 hover:border-white/20")}>{c}</button>
            ))}
            <span className="mx-2 h-6 w-px bg-white/10" />
            {(["low", "med", "high"] as const).map((p) => (
              <button key={p} onClick={() => setPriority(p)}
                className={cn("rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors",
                  priority === p ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-slate-400 hover:border-white/20")}>{p}</button>
            ))}
          </div>
          <Button onClick={add} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Plus className="mr-1.5 h-4 w-4" />Add task</Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1">
        {(["all", "open", "done", "overdue"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-full border px-3 py-1 text-xs capitalize",
              filter === f ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-slate-400")}>{f} ({f === "all" ? state.tasks.length : f === "open" ? state.tasks.filter((t) => t.status !== "done").length : f === "done" ? state.tasks.filter((t) => t.status === "done").length : state.tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate).getTime() < now).length})</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No tasks here.</div>}
        {filtered.map((t) => (
          <div key={t.id} className={cn("flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3", t.status === "done" && "opacity-50")}>
            <button onClick={() => toggle(t.id)}
              className={cn("grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors",
                t.status === "done" ? "border-cyan-400 bg-cyan-500 text-slate-950" : "border-white/20 hover:border-cyan-400")}>
              {t.status === "done" && <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
            <div className="flex-1">
              <div className={cn("text-sm text-slate-100", t.status === "done" && "line-through")}>{t.title}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                <PriorityDot p={t.priority} />
                <span>{t.center}</span>
                <span>·</span>
                <span>{t.source === "ai" ? "AI" : "manual"}</span>
                {t.dueDate && <><span>·</span><span>due {new Date(t.dueDate).toLocaleDateString()}</span></>}
              </div>
            </div>
            <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- document center ---------- */
export function DocumentCenter() {
  const state = useOs();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<BusinessDocument["kind"]>("brand");

  const add = () => {
    if (!name.trim()) return;
    updateOs((s) => {
      s.documents.unshift({ id: `d_${Date.now()}`, name: name.trim(), kind, addedAt: new Date().toISOString() });
    });
    setName("");
  };
  const remove = (id: string) => updateOs((s) => { s.documents = s.documents.filter((d) => d.id !== id); });

  const KINDS: BusinessDocument["kind"][] = ["certificate", "invoice", "agreement", "marketing", "training", "brand", "other"];
  const groups = KINDS.map((k) => ({ k, items: state.documents.filter((d) => d.kind === k) }));

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader><CardTitle className="text-sm text-cyan-200">Add document reference</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Document name (e.g. Diwali flyer, Cohort 12 agreement)" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 text-white placeholder:text-slate-500" />
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button key={k} onClick={() => setKind(k)}
                className={cn("rounded-full border px-2.5 py-1 text-[11px] capitalize",
                  kind === k ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-slate-400")}>{k}</button>
            ))}
          </div>
          <Button onClick={add} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Plus className="mr-1.5 h-4 w-4" />Add reference</Button>
          <p className="text-[10px] text-slate-500">Uploads coming next phase — for now this stores references so nothing is lost.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ k, items }) => (
          <Card key={k} className="border-white/10 bg-white/[0.03]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm capitalize text-cyan-200">{k}</CardTitle>
              <Badge className="bg-white/5 text-[10px]">{items.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {items.length === 0 && <div className="text-xs text-slate-500">No {k} documents yet.</div>}
              {items.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="flex-1 truncate text-slate-200">{d.name}</span>
                  <button onClick={() => remove(d.id)} className="text-slate-500 hover:text-rose-300"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- settings center ---------- */
export function SettingsCenter() {
  const state = useOs();
  const [draft, setDraft] = useState(state.settings);
  useEffect(() => setDraft(state.settings), [state.activeBrandId]);

  const save = () => updateOs((s) => { s.settings = draft; });

  const F = (label: string, key: keyof typeof draft, placeholder = "") => (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-slate-400">{label}</label>
      <Input value={(draft[key] as string) ?? ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} placeholder={placeholder} className="mt-1 bg-white/5 text-white placeholder:text-slate-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Business settings</h3>
          <p className="text-xs text-slate-400">Brand, support, payments, and legal — all in one place.</p>
        </div>
        <Button onClick={save} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Save className="mr-1.5 h-4 w-4" />Save</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-cyan-200"><Building2 className="h-4 w-4" /> Brand</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {F("Brand name", "brandName")}
            {F("Domain", "domain", "myacademy.com")}
            {F("Business hours", "businessHours")}
            {F("Address", "address")}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader><CardTitle className="text-sm text-cyan-200">Support & contact</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {F("Support email", "supportEmail")}
            {F("Support phone", "supportPhone")}
            {F("WhatsApp number", "whatsappNumber")}
            {F("GST number", "gstNumber")}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader><CardTitle className="text-sm text-cyan-200">Payment gateway</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(["razorpay", "stripe", "paddle", "cashfree", "none"] as const).map((g) => (
                <button key={g} onClick={() => setDraft({ ...draft, paymentGateway: g })}
                  className={cn("rounded-full border px-3 py-1 text-xs capitalize",
                    draft.paymentGateway === g ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-slate-400")}>{g}</button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader><CardTitle className="text-sm text-cyan-200">Social handles</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(["instagram", "linkedin", "youtube", "facebook", "x"] as const).map((s) => (
              <div key={s}>
                <label className="text-[10px] uppercase tracking-widest text-slate-400">{s}</label>
                <Input value={draft.socials[s]} onChange={(e) => setDraft({ ...draft, socials: { ...draft.socials, [s]: e.target.value } })} className="mt-1 bg-white/5 text-white" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] lg:col-span-2">
          <CardHeader><CardTitle className="text-sm text-cyan-200">Legal pages</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(["privacy", "terms", "refund", "cookies"] as const).map((l) => (
              <label key={l} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs">
                <input type="checkbox" checked={draft.legalPages[l]}
                  onChange={(e) => setDraft({ ...draft, legalPages: { ...draft.legalPages, [l]: e.target.checked } })}
                  className="accent-cyan-500" />
                <span className="capitalize text-slate-200">{l} page published</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------- multi-brand overview ---------- */
export function MultiBrandCenter() {
  const state = useOs();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#22d3ee");

  const create = () => {
    if (!name.trim()) return;
    const id = `b_${Date.now()}`;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    updateOs((s) => { s.brands.push({ id, name: name.trim(), slug, color, createdAt: new Date().toISOString() }); s.activeBrandId = id; });
    setName("");
  };
  const remove = (id: string) => updateOs((s) => {
    if (s.brands.length <= 1) return;
    s.brands = s.brands.filter((b) => b.id !== id);
    if (s.activeBrandId === id) s.activeBrandId = s.brands[0].id;
  });

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader><CardTitle className="text-sm text-cyan-200">Create a new brand</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
            <Input placeholder="Brand name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 text-white placeholder:text-slate-500" />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full cursor-pointer rounded-md border border-white/10 bg-white/5" />
            <Button onClick={create} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Plus className="mr-1.5 h-4 w-4" />Add</Button>
          </div>
          <p className="text-[10px] text-slate-500">Each brand has its own analytics, students, marketing, and website — switch anytime from the top-right.</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.brands.map((b: BrandProfile) => (
          <Card key={b.id} className={cn("border-white/10 bg-white/[0.03]", b.id === state.activeBrandId && "ring-1 ring-cyan-400/60")}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold text-slate-950" style={{ background: b.color ?? "#22d3ee" }}>{b.name.slice(0, 2).toUpperCase()}</div>
              <div className="flex-1">
                <div className="font-semibold text-white">{b.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">{b.slug}</div>
              </div>
              {b.id === state.activeBrandId && <Badge className="bg-cyan-500/10 text-cyan-200">Active</Badge>}
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              {b.id !== state.activeBrandId && (
                <Button size="sm" variant="outline" onClick={() => updateOs((s) => { s.activeBrandId = b.id; })} className="border-white/10 bg-transparent text-slate-200 hover:bg-white/5">Switch</Button>
              )}
              {state.brands.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => remove(b.id)} className="text-slate-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-cyan-200"><Settings2 className="h-4 w-4" /> White-label features (per brand)</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            {["Custom branding", "Custom domain", "Custom support email", "Custom certificates", "Custom LMS theme", "Custom website", "Mobile app (roadmap)", "Isolated analytics"].map((f) => (
              <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />{f}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
