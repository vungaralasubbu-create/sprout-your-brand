import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listBrandKits,
  getBrandKit,
  saveBrandKit,
  deleteBrandKit,
  addBrandAsset,
  deleteBrandAsset,
  saveBrandTemplate,
  deleteBrandTemplate,
  restoreBrandVersion,
} from "@/lib/marketing-os/brand-kit.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Palette,
  Plus,
  Save,
  Trash2,
  Star,
  History,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Check,
  Shield,
  Type,
  Users,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/brand-kit")({
  component: BrandKitPage,
});

const PERSONALITY_OPTS = [
  "Professional", "Friendly", "Luxury", "Corporate", "Minimal", "Playful",
  "Bold", "Innovative", "Educational", "Technical", "Premium", "Youthful", "Modern",
];
const TONE_OPTS = [
  "Professional", "Conversational", "Technical", "Inspirational",
  "Friendly", "Authoritative", "Simple", "Corporate", "Confident",
];
const STYLE_OPTS = [
  "Short", "Medium", "Long", "Storytelling", "Educational",
  "Persuasive", "Sales", "Technical", "SEO",
];
const READING_LEVELS = ["School", "College", "Professional", "Executive"];
const AUDIENCE_OPTS = [
  "Students", "Freshers", "Professionals", "HR", "Recruiters",
  "Companies", "Parents", "Universities",
];
const CHANNELS = [
  "instagram", "linkedin", "facebook", "thread", "x", "blog", "email", "landing", "youtube", "tiktok",
];

type BrandKitRow = {
  id: string;
  name: string;
  is_default: boolean;
  updated_at: string;
  business_name: string | null;
  tagline: string | null;
};

function BrandKitPage() {
  const list = useServerFn(listBrandKits);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["brand-kits"],
    queryFn: () => list(),
  });

  const kits = (data?.kits ?? []) as BrandKitRow[];
  const activeId = selectedId ?? kits.find((k) => k.is_default)?.id ?? kits[0]?.id ?? null;

  const createNew = () => setSelectedId("__new__");

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar */}
      <aside className="col-span-12 md:col-span-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="size-4 text-primary" />
            <h2 className="font-semibold">Brand Kits</h2>
          </div>
          <Button size="sm" onClick={createNew} className="w-full mb-3">
            <Plus className="size-4 mr-1" /> New Brand Kit
          </Button>
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Loading…</div>
          ) : kits.length === 0 && selectedId !== "__new__" ? (
            <div className="text-xs text-muted-foreground">No brand kits yet.</div>
          ) : (
            <ul className="space-y-1">
              {kits.map((k) => (
                <li key={k.id}>
                  <button
                    onClick={() => setSelectedId(k.id)}
                    className={cn(
                      "w-full text-left px-2 py-2 rounded-md text-sm hover:bg-muted flex items-center justify-between",
                      activeId === k.id && "bg-muted",
                    )}
                  >
                    <span className="truncate">
                      <span className="font-medium">{k.name}</span>
                      {k.tagline ? <span className="text-muted-foreground"> — {k.tagline}</span> : null}
                    </span>
                    {k.is_default && <Star className="size-3 text-amber-500 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t text-[10px] text-muted-foreground leading-relaxed">
            Every AI module — Marketing OS, SEO, Blogs, Emails, and future
            Image/Video/Ad/Chat generators — automatically uses your default
            Brand Kit through the central AI Router.
          </div>
        </Card>
      </aside>

      {/* Editor */}
      <main className="col-span-12 md:col-span-9">
        {activeId ? (
          <BrandKitEditor
            key={activeId}
            kitId={activeId === "__new__" ? null : activeId}
            onSaved={(id) => {
              setSelectedId(id);
              qc.invalidateQueries({ queryKey: ["brand-kits"] });
            }}
            onDeleted={() => {
              setSelectedId(null);
              qc.invalidateQueries({ queryKey: ["brand-kits"] });
            }}
          />
        ) : (
          <Card className="p-10 text-center text-muted-foreground">
            <Sparkles className="size-8 mx-auto mb-3 text-primary" />
            <div className="font-medium mb-1">Create your first Brand Kit</div>
            <div className="text-sm">
              Every AI generation across Glintr will automatically follow this Brand Kit.
            </div>
            <Button onClick={createNew} className="mt-4">
              <Plus className="size-4 mr-1" /> New Brand Kit
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Editor
// -----------------------------------------------------------------------------

type FormState = {
  id: string | null;
  name: string;
  is_default: boolean;
  business_name: string;
  tagline: string;
  description: string;
  mission: string;
  vision: string;
  core_values: string; // csv
  industry: string;
  website: string;
  support_email: string;
  phone: string;
  address: string;
  social_links: Record<string, string>;
  personality: string[];
  tone_of_voice: string[];
  writing_style: string[];
  reading_level: string;
  audience: string[];
  colors: Record<string, string>;
  typography: Record<string, string>;
  logos: Record<string, string>;
  guidelines: Record<string, string>;
  writing_rules: {
    preferred_words: string;
    avoid_words: string;
    mandatory_cta: string;
    mandatory_disclaimer: string;
    emoji_rules: string;
    capitalization: string;
    hashtag_rules: string;
  };
  content_rules: {
    min_length: string;
    max_length: string;
    paragraph_length: string;
    sentence_length: string;
    cta_rules: string;
    hashtag_rules: string;
    seo_rules: string;
  };
  compliance: Record<string, string>;
  approval_policy: Record<string, boolean>;
  ai_rules: { global_prompt: string; extra_instructions: string };
  keywords: { primary: string; secondary: string; industry: string; seo: string; negative: string };
};

function emptyForm(): FormState {
  return {
    id: null,
    name: "",
    is_default: true,
    business_name: "",
    tagline: "",
    description: "",
    mission: "",
    vision: "",
    core_values: "",
    industry: "",
    website: "",
    support_email: "",
    phone: "",
    address: "",
    social_links: { instagram: "", linkedin: "", facebook: "", x: "", youtube: "" },
    personality: [],
    tone_of_voice: [],
    writing_style: [],
    reading_level: "",
    audience: [],
    colors: { primary: "#0ea5e9", secondary: "#6366f1", accent: "#84cc16", success: "#10b981", warning: "#f59e0b", error: "#ef4444", neutral: "#64748b", dark: "#0f172a", light: "#f8fafc" },
    typography: { primary: "Inter", secondary: "Inter", heading: "Inter", body: "Inter", button: "Inter", fallback: "system-ui, sans-serif" },
    logos: { primary: "", dark: "", light: "", icon: "", favicon: "" },
    guidelines: { logo_usage: "", spacing: "", color_usage: "", typography_rules: "", illustration_style: "", photography_style: "", icon_style: "", background_style: "" },
    writing_rules: { preferred_words: "", avoid_words: "", mandatory_cta: "", mandatory_disclaimer: "", emoji_rules: "", capitalization: "", hashtag_rules: "" },
    content_rules: { min_length: "", max_length: "", paragraph_length: "", sentence_length: "", cta_rules: "", hashtag_rules: "", seo_rules: "" },
    compliance: { legal: "", privacy: "", education: "", financial: "", medical: "", custom: "" },
    approval_policy: { brand_review: false, marketing_review: false, legal_review: false, auto_approval: true },
    ai_rules: { global_prompt: "", extra_instructions: "" },
    keywords: { primary: "", secondary: "", industry: "", seo: "", negative: "" },
  };
}

function fromKit(k: any): FormState {
  const f = emptyForm();
  f.id = k.id;
  f.name = k.name ?? "";
  f.is_default = !!k.is_default;
  f.business_name = k.business_name ?? "";
  f.tagline = k.tagline ?? "";
  f.description = k.description ?? "";
  f.mission = k.mission ?? "";
  f.vision = k.vision ?? "";
  f.core_values = (k.core_values ?? []).join(", ");
  f.industry = k.industry ?? "";
  f.website = k.website ?? "";
  f.support_email = k.support_email ?? "";
  f.phone = k.phone ?? "";
  f.address = k.address ?? "";
  f.social_links = { ...f.social_links, ...(k.social_links ?? {}) };
  f.personality = k.personality ?? [];
  f.tone_of_voice = k.tone_of_voice ?? [];
  f.writing_style = k.writing_style ?? [];
  f.reading_level = k.reading_level ?? "";
  f.audience = (k.target_audience?.segments ?? []) as string[];
  f.colors = { ...f.colors, ...(k.colors ?? {}) };
  f.typography = { ...f.typography, ...(k.typography ?? {}) };
  f.logos = { ...f.logos, ...(k.logos ?? {}) };
  f.guidelines = { ...f.guidelines, ...(k.guidelines ?? {}) };
  f.writing_rules = {
    preferred_words: (k.writing_rules?.preferred_words ?? []).join?.(", ") ?? k.writing_rules?.preferred_words ?? "",
    avoid_words: (k.writing_rules?.avoid_words ?? []).join?.(", ") ?? k.writing_rules?.avoid_words ?? "",
    mandatory_cta: k.writing_rules?.mandatory_cta ?? "",
    mandatory_disclaimer: k.writing_rules?.mandatory_disclaimer ?? "",
    emoji_rules: k.writing_rules?.emoji_rules ?? "",
    capitalization: k.writing_rules?.capitalization ?? "",
    hashtag_rules: k.writing_rules?.hashtag_rules ?? "",
  };
  f.content_rules = { ...f.content_rules, ...(k.content_rules ?? {}) };
  f.compliance = { ...f.compliance, ...(k.compliance ?? {}) };
  f.approval_policy = { ...f.approval_policy, ...(k.approval_policy ?? {}) };
  f.ai_rules = { ...f.ai_rules, ...(k.ai_rules ?? {}) };
  const kw = k.keywords ?? {};
  f.keywords = {
    primary: (kw.primary ?? []).join?.(", ") ?? "",
    secondary: (kw.secondary ?? []).join?.(", ") ?? "",
    industry: (kw.industry ?? []).join?.(", ") ?? "",
    seo: (kw.seo ?? []).join?.(", ") ?? "",
    negative: (kw.negative ?? []).join?.(", ") ?? "",
  };
  return f;
}

function toPayload(f: FormState) {
  const csv = (s: string) => s.split(",").map((v) => v.trim()).filter(Boolean);
  return {
    id: f.id ?? undefined,
    name: f.name || "Untitled Brand",
    is_default: f.is_default,
    business_name: f.business_name || null,
    tagline: f.tagline || null,
    description: f.description || null,
    mission: f.mission || null,
    vision: f.vision || null,
    core_values: csv(f.core_values),
    industry: f.industry || null,
    website: f.website || null,
    support_email: f.support_email || null,
    phone: f.phone || null,
    address: f.address || null,
    social_links: Object.fromEntries(Object.entries(f.social_links).filter(([, v]) => v)),
    personality: f.personality,
    tone_of_voice: f.tone_of_voice,
    writing_style: f.writing_style,
    reading_level: f.reading_level || null,
    target_audience: { segments: f.audience },
    colors: f.colors,
    typography: f.typography,
    logos: Object.fromEntries(Object.entries(f.logos).filter(([, v]) => v)),
    guidelines: f.guidelines,
    writing_rules: {
      preferred_words: csv(f.writing_rules.preferred_words),
      avoid_words: csv(f.writing_rules.avoid_words),
      mandatory_cta: f.writing_rules.mandatory_cta,
      mandatory_disclaimer: f.writing_rules.mandatory_disclaimer,
      emoji_rules: f.writing_rules.emoji_rules,
      capitalization: f.writing_rules.capitalization,
      hashtag_rules: f.writing_rules.hashtag_rules,
    },
    content_rules: f.content_rules,
    compliance: f.compliance,
    approval_policy: f.approval_policy,
    ai_rules: f.ai_rules,
    keywords: {
      primary: csv(f.keywords.primary),
      secondary: csv(f.keywords.secondary),
      industry: csv(f.keywords.industry),
      seo: csv(f.keywords.seo),
      negative: csv(f.keywords.negative),
    },
  };
}

function BrandKitEditor({
  kitId,
  onSaved,
  onDeleted,
}: {
  kitId: string | null;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}) {
  const get = useServerFn(getBrandKit);
  const save = useServerFn(saveBrandKit);
  const del = useServerFn(deleteBrandKit);
  const addAsset = useServerFn(addBrandAsset);
  const delAsset = useServerFn(deleteBrandAsset);
  const saveTpl = useServerFn(saveBrandTemplate);
  const delTpl = useServerFn(deleteBrandTemplate);
  const restore = useServerFn(restoreBrandVersion);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["brand-kit", kitId],
    queryFn: () => (kitId ? get({ data: { id: kitId } }) : Promise.resolve(null as any)),
    enabled: !!kitId,
  });

  const initial = useMemo(
    () => (data?.kit ? fromKit(data.kit) : emptyForm()),
    [data?.kit],
  );
  const [form, setForm] = useState<FormState>(initial);

  // reset when kitId changes
  useMemo(() => setForm(initial), [initial]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: "personality" | "tone_of_voice" | "writing_style" | "audience", v: string) =>
    setForm((f) => {
      const arr = f[k];
      return { ...f, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  const mSave = useMutation({
    mutationFn: (note?: string) => save({ data: { ...toPayload(form), note } as any }),
    onSuccess: (r: any) => {
      toast.success("Brand Kit saved");
      qc.invalidateQueries({ queryKey: ["brand-kit", r.id] });
      onSaved(r.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelete = useMutation({
    mutationFn: () => del({ data: { id: kitId! } }),
    onSuccess: () => { toast.success("Deleted"); onDeleted(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>;

  const assets = (data?.assets ?? []) as any[];
  const templates = (data?.templates ?? []) as any[];
  const versions = (data?.versions ?? []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Brand Kit</div>
          <h1 className="text-2xl font-semibold">{form.name || "New Brand Kit"}</h1>
          {form.is_default && (
            <Badge className="mt-1" variant="secondary">
              <Star className="size-3 mr-1" /> Default — used by all AI modules
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {kitId && (
            <Button variant="outline" size="sm" onClick={() => {
              if (confirm("Delete this Brand Kit? Assets, templates, and history will be removed.")) mDelete.mutate();
            }}>
              <Trash2 className="size-4 mr-1" /> Delete
            </Button>
          )}
          <Button size="sm" onClick={() => mSave.mutate(undefined)} disabled={mSave.isPending}>
            <Save className="size-4 mr-1" /> {mSave.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="profile"><Sparkles className="size-3 mr-1" />Profile</TabsTrigger>
          <TabsTrigger value="voice"><Type className="size-3 mr-1" />Voice & Style</TabsTrigger>
          <TabsTrigger value="visuals"><Palette className="size-3 mr-1" />Visuals</TabsTrigger>
          <TabsTrigger value="rules"><Shield className="size-3 mr-1" />Rules & Compliance</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="size-3 mr-1" />AI Instructions</TabsTrigger>
          <TabsTrigger value="keywords"><Hash className="size-3 mr-1" />Keywords</TabsTrigger>
          <TabsTrigger value="assets"><ImageIcon className="size-3 mr-1" />Media Library</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="size-3 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="versions"><History className="size-3 mr-1" />Versions</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile" className="mt-4">
          <Card className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Kit name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Business name"><Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} /></Field>
              <Field label="Tagline"><Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
              <Field label="Industry"><Input value={form.industry} onChange={(e) => set("industry", e.target.value)} /></Field>
              <Field label="Website"><Input value={form.website} onChange={(e) => set("website", e.target.value)} /></Field>
              <Field label="Support email"><Input value={form.support_email} onChange={(e) => set("support_email", e.target.value)} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Address"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
            </div>
            <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Mission"><Textarea rows={3} value={form.mission} onChange={(e) => set("mission", e.target.value)} /></Field>
              <Field label="Vision"><Textarea rows={3} value={form.vision} onChange={(e) => set("vision", e.target.value)} /></Field>
            </div>
            <Field label="Core values (comma separated)"><Input value={form.core_values} onChange={(e) => set("core_values", e.target.value)} /></Field>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Social links</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {Object.keys(form.social_links).map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs uppercase w-20 text-muted-foreground">{k}</span>
                    <Input value={form.social_links[k]} onChange={(e) => set("social_links", { ...form.social_links, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_default} onChange={(e) => set("is_default", e.target.checked)} />
              Set as default (used by all AI modules automatically)
            </label>
          </Card>
        </TabsContent>

        {/* VOICE */}
        <TabsContent value="voice" className="mt-4">
          <Card className="p-6 space-y-6">
            <MultiSelect label="Brand personality" options={PERSONALITY_OPTS} value={form.personality} onToggle={(v) => toggle("personality", v)} />
            <MultiSelect label="Tone of voice" options={TONE_OPTS} value={form.tone_of_voice} onToggle={(v) => toggle("tone_of_voice", v)} />
            <MultiSelect label="Writing style" options={STYLE_OPTS} value={form.writing_style} onToggle={(v) => toggle("writing_style", v)} />
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Reading level</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {READING_LEVELS.map((l) => (
                  <Chip key={l} active={form.reading_level === l} onClick={() => set("reading_level", form.reading_level === l ? "" : l)}>{l}</Chip>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Users className="size-3" />Target audience</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {AUDIENCE_OPTS.map((a) => (
                  <Chip key={a} active={form.audience.includes(a)} onClick={() => toggle("audience", a)}>{a}</Chip>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* VISUALS */}
        <TabsContent value="visuals" className="mt-4">
          <Card className="p-6 space-y-6">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Colors</Label>
              <div className="grid md:grid-cols-3 gap-3 mt-2">
                {Object.entries(form.colors).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <input type="color" value={v || "#000000"} onChange={(e) => set("colors", { ...form.colors, [k]: e.target.value })} className="size-10 rounded border" />
                    <div className="flex-1">
                      <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                      <Input value={v} onChange={(e) => set("colors", { ...form.colors, [k]: e.target.value })} className="h-8 text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Typography</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {Object.entries(form.typography).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">{k}</div>
                    <Input value={v} onChange={(e) => set("typography", { ...form.typography, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Logos & marks (URLs)</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {Object.entries(form.logos).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">{k}</div>
                    <Input placeholder="https://…" value={v} onChange={(e) => set("logos", { ...form.logos, [k]: e.target.value })} />
                    {v && <img src={v} alt={k} className="mt-2 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Brand guidelines</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {Object.entries(form.guidelines).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">{k.replace(/_/g, " ")}</div>
                    <Textarea rows={2} value={v} onChange={(e) => set("guidelines", { ...form.guidelines, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* RULES */}
        <TabsContent value="rules" className="mt-4">
          <Card className="p-6 space-y-6">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Writing rules</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                <Field label="Preferred words (comma)"><Input value={form.writing_rules.preferred_words} onChange={(e) => set("writing_rules", { ...form.writing_rules, preferred_words: e.target.value })} /></Field>
                <Field label="Avoid words (comma)"><Input value={form.writing_rules.avoid_words} onChange={(e) => set("writing_rules", { ...form.writing_rules, avoid_words: e.target.value })} /></Field>
                <Field label="Mandatory CTA"><Input value={form.writing_rules.mandatory_cta} onChange={(e) => set("writing_rules", { ...form.writing_rules, mandatory_cta: e.target.value })} /></Field>
                <Field label="Mandatory disclaimer"><Input value={form.writing_rules.mandatory_disclaimer} onChange={(e) => set("writing_rules", { ...form.writing_rules, mandatory_disclaimer: e.target.value })} /></Field>
                <Field label="Emoji rules"><Input value={form.writing_rules.emoji_rules} onChange={(e) => set("writing_rules", { ...form.writing_rules, emoji_rules: e.target.value })} /></Field>
                <Field label="Capitalization"><Input value={form.writing_rules.capitalization} onChange={(e) => set("writing_rules", { ...form.writing_rules, capitalization: e.target.value })} /></Field>
                <Field label="Hashtag rules"><Input value={form.writing_rules.hashtag_rules} onChange={(e) => set("writing_rules", { ...form.writing_rules, hashtag_rules: e.target.value })} /></Field>
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Content length rules</Label>
              <div className="grid md:grid-cols-3 gap-3 mt-2">
                {Object.entries(form.content_rules).map(([k, v]) => (
                  <Field key={k} label={k.replace(/_/g, " ")}>
                    <Input value={v as string} onChange={(e) => set("content_rules", { ...form.content_rules, [k]: e.target.value })} />
                  </Field>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Compliance & disclaimers</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {Object.entries(form.compliance).map(([k, v]) => (
                  <Field key={k} label={k}>
                    <Textarea rows={2} value={v as string} onChange={(e) => set("compliance", { ...form.compliance, [k]: e.target.value })} />
                  </Field>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Approval policy</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {Object.entries(form.approval_policy).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!v} onChange={(e) => set("approval_policy", { ...form.approval_policy, [k]: e.target.checked })} />
                    {k.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai" className="mt-4">
          <Card className="p-6 space-y-4">
            <div className="text-sm text-muted-foreground">
              These instructions are injected automatically into every AI request across Glintr —
              alongside your tone, voice, keywords, and compliance rules — via the central AI Router.
              You never have to paste them into individual generations.
            </div>
            <Field label="Global AI prompt (added to every request)">
              <Textarea rows={4} value={form.ai_rules.global_prompt} onChange={(e) => set("ai_rules", { ...form.ai_rules, global_prompt: e.target.value })} placeholder="Example: Always write as Glintr, an edtech platform helping sales professionals become entrepreneurs. Prefer Indian English, active voice, and outcome-driven language." />
            </Field>
            <Field label="Additional instructions">
              <Textarea rows={4} value={form.ai_rules.extra_instructions} onChange={(e) => set("ai_rules", { ...form.ai_rules, extra_instructions: e.target.value })} />
            </Field>
          </Card>
        </TabsContent>

        {/* KEYWORDS */}
        <TabsContent value="keywords" className="mt-4">
          <Card className="p-6 space-y-3">
            {Object.keys(form.keywords).map((k) => (
              <Field key={k} label={`${k} keywords (comma separated)`}>
                <Textarea rows={2} value={(form.keywords as any)[k]} onChange={(e) => set("keywords", { ...form.keywords, [k]: e.target.value })} />
              </Field>
            ))}
          </Card>
        </TabsContent>

        {/* ASSETS */}
        <TabsContent value="assets" className="mt-4">
          <AssetsPanel kitId={kitId} assets={assets} onAdd={addAsset} onDelete={delAsset} onChange={() => qc.invalidateQueries({ queryKey: ["brand-kit", kitId] })} />
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="mt-4">
          <TemplatesPanel kitId={kitId} templates={templates} onSave={saveTpl} onDelete={delTpl} onChange={() => qc.invalidateQueries({ queryKey: ["brand-kit", kitId] })} />
        </TabsContent>

        {/* VERSIONS */}
        <TabsContent value="versions" className="mt-4">
          <Card className="p-6">
            {versions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No versions yet. Every save creates a new version.</div>
            ) : (
              <ul className="divide-y">
                {versions.map((v: any) => (
                  <li key={v.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">v{v.version}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleString()} {v.note ? `— ${v.note}` : ""}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!kitId) return;
                        await restore({ data: { brand_kit_id: kitId, version_id: v.id } });
                        toast.success(`Restored v${v.version}`);
                        qc.invalidateQueries({ queryKey: ["brand-kit", kitId] });
                      }}
                    >
                      Restore
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Assets panel
// -----------------------------------------------------------------------------

function AssetsPanel({ kitId, assets, onAdd, onDelete, onChange }: any) {
  const [folder, setFolder] = useState("general");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"image" | "video" | "document" | "logo" | "icon" | "illustration">("image");

  if (!kitId) return <Card className="p-6 text-sm text-muted-foreground">Save the Brand Kit first to add assets.</Card>;

  const folders = Array.from(new Set(["general", "brand-images", "product", "course", "team", "illustrations", "icons", "videos", "documents", ...(assets ?? []).map((a: any) => a.folder)]));
  const filtered = (assets ?? []).filter((a: any) => a.folder === folder);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {folders.map((f) => (
          <Chip key={f} active={folder === f} onClick={() => setFolder(f)}>{f}</Chip>
        ))}
      </div>
      <div className="border-t pt-4">
        <div className="text-xs uppercase text-muted-foreground mb-2">Add asset (paste CDN URL)</div>
        <div className="grid md:grid-cols-4 gap-2">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="border rounded-md px-2 text-sm">
            {["image", "video", "document", "logo", "icon", "illustration"].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={async () => {
            if (!url) return toast.error("URL required");
            await onAdd({ data: { brand_kit_id: kitId, folder, kind, title: title || null, url } });
            setUrl(""); setTitle("");
            onChange();
          }}><Plus className="size-4 mr-1" />Add</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {filtered.map((a: any) => (
          <div key={a.id} className="border rounded-md overflow-hidden group relative">
            {a.kind === "image" || a.kind === "logo" || a.kind === "icon" || a.kind === "illustration" ? (
              <img src={a.url} alt={a.title ?? ""} className="w-full h-32 object-cover bg-muted" />
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-muted"><FileText className="size-8 text-muted-foreground" /></div>
            )}
            <div className="p-2 text-xs">
              <div className="truncate">{a.title ?? a.url.split("/").pop()}</div>
              <div className="text-muted-foreground">{a.kind}</div>
            </div>
            <button onClick={async () => { await onDelete({ data: { id: a.id } }); onChange(); }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white/90 border rounded p-1">
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-sm text-muted-foreground">No assets in this folder yet.</div>}
      </div>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Templates panel
// -----------------------------------------------------------------------------

function TemplatesPanel({ kitId, templates, onSave, onDelete, onChange }: any) {
  const [channel, setChannel] = useState<string>("instagram");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  if (!kitId) return <Card className="p-6 text-sm text-muted-foreground">Save the Brand Kit first to add templates.</Card>;

  return (
    <Card className="p-6 space-y-4">
      <div className="border-b pb-4">
        <div className="text-xs uppercase text-muted-foreground mb-2">New template</div>
        <div className="grid md:grid-cols-3 gap-2">
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="border rounded-md px-2 text-sm">
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} className="md:col-span-2" />
        </div>
        <Textarea rows={4} className="mt-2" placeholder="Template body — use {{variables}}" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button className="mt-2" size="sm" onClick={async () => {
          if (!name || !body) return toast.error("Name and body required");
          await onSave({ data: { brand_kit_id: kitId, channel, name, body } });
          setName(""); setBody("");
          onChange();
        }}><Plus className="size-4 mr-1" />Add template</Button>
      </div>
      <ul className="divide-y">
        {templates.length === 0 && <li className="text-sm text-muted-foreground">No templates yet.</li>}
        {templates.map((t: any) => (
          <li key={t.id} className="py-3 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t.channel}</Badge>
                <div className="font-medium text-sm">{t.name}</div>
              </div>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">{t.body}</pre>
            </div>
            <Button variant="outline" size="sm" onClick={async () => { await onDelete({ data: { id: t.id } }); onChange(); }}><Trash2 className="size-3" /></Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Little primitives
// -----------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-muted",
      )}
    >
      {active && <Check className="size-3 inline mr-1" />}
      {children}
    </button>
  );
}

function MultiSelect({ label, options, value, onToggle }: { label: string; options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((o) => (
          <Chip key={o} active={value.includes(o)} onClick={() => onToggle(o)}>{o}</Chip>
        ))}
      </div>
    </div>
  );
}
