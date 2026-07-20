import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Save, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { upsertTemplate, listCategories } from "@/lib/templates/templates.functions";

export const Route = createFileRoute("/_authenticated/template-builder")({
  component: TemplateBuilder,
});

const PROMPT_KEYS: { key: string; label: string; ph: string }[] = [
  { key: "strategy", label: "Strategy prompt", ph: "Design a 30-day launch strategy for {{business_name}} …" },
  { key: "content", label: "Content prompt", ph: "Write 20 LinkedIn posts introducing {{business_name}} …" },
  { key: "image", label: "Image prompt", ph: "Create hero visuals using brand colors {{brand_colors}} …" },
  { key: "video", label: "Video prompt", ph: "Reels script — hook-first, 30 seconds …" },
  { key: "email", label: "Email prompt", ph: "Write a 5-part email sequence …" },
  { key: "landing", label: "Landing page prompt", ph: "Design a conversion landing page …" },
  { key: "workflow", label: "Workflow prompt", ph: "Automate: signup → welcome → nurture …" },
  { key: "analytics", label: "Analytics prompt", ph: "Weekly report: opens, CTR, conversions …" },
];

const ASSETS = ["strategy", "posts", "images", "videos", "emails", "landing", "forms", "automation", "calendar", "analytics"];

function TemplateBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [credits, setCredits] = useState(500);
  const [minutes, setMinutes] = useState(5);
  const [industry, setIndustry] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [included, setIncluded] = useState<string[]>(["strategy", "posts", "emails"]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [tags, setTags] = useState("");

  const lc = useServerFn(listCategories);
  const catsQ = useQuery({ queryKey: ["tpl-cats"], queryFn: () => lc({}) });
  const cats = catsQ.data?.categories ?? [];
  const industries = cats.filter((c: any) => c.kind === "industry");
  const goalCats = cats.filter((c: any) => c.kind === "goal");
  const channelCats = cats.filter((c: any) => c.kind === "channel");

  const up = useServerFn(upsertTemplate);
  const mut = useMutation({
    mutationFn: (submit: boolean) =>
      up({
        data: {
          slug: slug || slugify(title),
          title,
          tagline,
          description,
          difficulty,
          estimated_credits: credits,
          estimated_time_minutes: minutes,
          industry,
          goals,
          channels,
          included_assets: included,
          prompts,
          variables: [],
          tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
          submit_for_review: submit,
          ai_agents: [],
        },
      }),
    onSuccess: (r, submit) => {
      toast.success(submit ? "Submitted for review" : "Draft saved");
      navigate({ to: "/my-templates" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const canSave = title.trim().length > 3 && Object.values(prompts).some((p) => (p ?? "").trim().length > 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Template Builder</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Design a template</h1>
          <p className="mt-1 text-sm text-muted-foreground">Compose reusable prompts and variables that generate a complete AI marketing project.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!canSave || mut.isPending} onClick={() => mut.mutate(false)}>
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save draft
          </Button>
          <Button disabled={!canSave || mut.isPending} onClick={() => mut.mutate(true)}>
            <Send className="mr-2 h-4 w-4" /> Publish for review
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Editor */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Basics">
            <Field label="Title" value={title} onChange={setTitle} placeholder="SaaS Launch — 30-Day Blitz" />
            <Field label="Slug (URL)" value={slug} onChange={setSlug} placeholder={title ? slugify(title) : "saas-launch-30day"} />
            <Field label="Tagline" value={tagline} onChange={setTagline} placeholder="Full 30-day launch campaign for a new SaaS product" />
            <Textarea label="Description" value={description} onChange={setDescription} rows={4} />
          </Section>

          <Section title="AI prompts" hint="Use {{variable}} placeholders. AI will fill them from user input.">
            {PROMPT_KEYS.map((p) => (
              <Textarea
                key={p.key}
                label={p.label}
                value={prompts[p.key] ?? ""}
                onChange={(v) => setPrompts((s) => ({ ...s, [p.key]: v }))}
                placeholder={p.ph}
                rows={3}
              />
            ))}
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Section title="Metadata">
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Difficulty"
                value={difficulty}
                onChange={(v) => setDifficulty(v as any)}
                options={[{ v: "beginner", l: "Beginner" }, { v: "intermediate", l: "Intermediate" }, { v: "advanced", l: "Advanced" }]}
              />
              <NumField label="Est. minutes" value={minutes} onChange={setMinutes} />
              <NumField label="AI credits" value={credits} onChange={setCredits} />
            </div>
            <Field label="Tags (comma-separated)" value={tags} onChange={setTags} placeholder="saas, launch, b2b" />
          </Section>

          <Section title="Assets included">
            <div className="flex flex-wrap gap-2">
              {ASSETS.map((a) => (
                <ChipToggle key={a} label={a} active={included.includes(a)} onClick={() =>
                  setIncluded((s) => s.includes(a) ? s.filter((x) => x !== a) : [...s, a])} />
              ))}
            </div>
          </Section>

          <Section title="Industries">
            <MultiChips items={industries} value={industry} onChange={setIndustry} />
          </Section>
          <Section title="Goals">
            <MultiChips items={goalCats} value={goals} onChange={setGoals} />
          </Section>
          <Section title="Channels">
            <MultiChips items={channelCats} value={channels} onChange={setChannels} />
          </Section>

          <div className="rounded-2xl border border-dashed bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Publishing</div>
            <p className="mt-1 text-xs text-muted-foreground">Templates go through review before appearing in the public marketplace. Approved templates carry a Verified badge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- primitives ----------
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3">
        <div className="text-sm font-semibold">{title}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder, rows = 3 }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary" />
    </div>
  );
}
function NumField({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value || "0"))}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </div>
  );
}
function SelectField({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
        {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
function ChipToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize transition",
        active ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted")}>
      {label.replace(/_/g, " ")}
    </button>
  );
}
function MultiChips({ items, value, onChange }: { items: any[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c: any) => (
        <ChipToggle key={c.slug} label={c.name} active={value.includes(c.slug)}
          onClick={() => onChange(value.includes(c.slug) ? value.filter((v) => v !== c.slug) : [...value, c.slug])} />
      ))}
    </div>
  );
}
