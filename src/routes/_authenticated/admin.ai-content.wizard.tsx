import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  ChevronRight, ChevronLeft, Sparkles, Wand2, CheckCircle2, AlertTriangle, Loader2,
  BookOpen, GitCompare, Route as RouteIcon, Map, Briefcase, MessageSquareQuote, HelpCircle, GraduationCap, FileText, LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateAiOutline, generateAiBody, saveAiDraft } from "@/lib/admin/ai-content.functions";
import type { ContentType } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/ai-content/wizard")({
  component: WizardPage,
});

const TYPE_OPTIONS: { type: ContentType; label: string; description: string; icon: any }[] = [
  { type: "learn_guide", label: "Learn Guide", description: "In-depth educational article.", icon: BookOpen },
  { type: "glossary", label: "Glossary Term", description: "Short definition-style entry.", icon: FileText },
  { type: "comparison", label: "Comparison", description: "X vs Y feature comparison.", icon: GitCompare },
  { type: "roadmap", label: "Roadmap", description: "Step-by-step path to master a topic.", icon: Map },
  { type: "career_guide", label: "Career Guide", description: "What the role is, salary, path to enter.", icon: Briefcase },
  { type: "interview_guide", label: "Interview Guide", description: "Questions + sample answers.", icon: MessageSquareQuote },
  { type: "faq", label: "FAQ", description: "Q&A on a focused topic.", icon: HelpCircle },
  { type: "cheat_sheet", label: "Cheat Sheet", description: "Compact quick-reference.", icon: FileText },
  { type: "learning_path", label: "Learning Path", description: "Sequential modules with goals.", icon: GraduationCap },
  { type: "program_support", label: "Program Support", description: "Help article for enrolled students.", icon: LifeBuoy },
];

const TOPIC_EXAMPLES = [
  "Artificial Intelligence", "ChatGPT", "Machine Learning", "VLSI", "Embedded Systems",
  "Medical Coding", "Financial Modeling", "Docker", "React", "Kubernetes",
  "Prompt Engineering", "Semiconductors", "Prompt Chaining", "Retrieval Augmented Generation",
];

const DEPTHS = [
  { key: "quick", label: "Quick Guide", words: "500–800 words", detail: "Great for glossary, short explainers." },
  { key: "standard", label: "Standard Guide", words: "900–1,400 words", detail: "The default for most learn guides." },
  { key: "comprehensive", label: "Comprehensive Guide", words: "1,500–2,200 words", detail: "Deep-dive topical authority." },
  { key: "master", label: "Master Guide", words: "2,400–3,600 words", detail: "Pillar content — links dozens of articles." },
] as const;

const AUDIENCES = ["beginner", "intermediate", "advanced", "professional"] as const;

function WizardPage() {
  const navigate = useNavigate();
  const outlineFn = useServerFn(generateAiOutline);
  const bodyFn = useServerFn(generateAiBody);
  const saveFn = useServerFn(saveAiDraft);

  const [step, setStep] = useState(1);
  const [type, setType] = useState<ContentType>("learn_guide");
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<typeof DEPTHS[number]["key"]>("standard");
  const [audience, setAudience] = useState<typeof AUDIENCES[number]>("intermediate");
  const [focusKeywords, setFocusKeywords] = useState("");
  const [notes, setNotes] = useState("");
  const [outline, setOutline] = useState<any>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [body, setBody] = useState<any>(null);

  const outlineMut = useMutation({
    mutationFn: () => outlineFn({ data: {
      type, topic, depth, audience,
      focusKeywords: focusKeywords.split(",").map((s) => s.trim()).filter(Boolean),
      notes: notes || undefined,
    } }),
    onSuccess: (r: any) => {
      setOutline(r.outline);
      setDuplicates(r.duplicates ?? []);
      setStep(5);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bodyMut = useMutation({
    mutationFn: () => bodyFn({ data: {
      type, topic, depth, audience, outline,
      focusKeywords: focusKeywords.split(",").map((s) => s.trim()).filter(Boolean),
    } }),
    onSuccess: (r: any) => setBody(r),
    onError: (e: any) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: {
      type, depth, audience,
      outline,
      body_markdown: body?.body_markdown ?? "",
      warnings: body?.warnings ?? [],
    } }),
    onSuccess: (r: any) => {
      toast.success("Saved as draft — opening editor");
      navigate({ to: "/admin/content/articles/$id" as any, params: { id: r.id } as any });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><Wand2 className="size-5 text-primary" /> Content Wizard</h1>
        <p className="text-sm text-muted-foreground">Generate a factual, structured draft in five guided steps. A human reviews before anything ships.</p>
      </header>

      <Stepper step={step} />

      {step === 1 && (
        <Card className="p-5 space-y-3">
          <h2 className="font-display font-semibold">Step 1 · Content type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((t) => {
              const Icon = t.icon;
              const active = type === t.type;
              return (
                <button key={t.type} onClick={() => setType(t.type)}
                  className={cn("text-left rounded-lg border p-3 transition-colors", active ? "border-primary bg-primary/5" : "border-border/60 hover:bg-surface-2/60")}
                >
                  <div className="flex items-center gap-2 text-sm font-medium"><Icon className="size-4" /> {t.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end"><Button onClick={() => setStep(2)}>Next <ChevronRight className="size-4 ml-1" /></Button></div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-5 space-y-3">
          <h2 className="font-display font-semibold">Step 2 · Topic</h2>
          <div>
            <Label>Topic or working title</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Prompt engineering fundamentals" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOPIC_EXAMPLES.map((t) => (
              <button key={t} onClick={() => setTopic(t)} className="text-xs px-2.5 py-1 rounded-full border border-border/60 hover:bg-surface-2">{t}</button>
            ))}
          </div>
          <div>
            <Label>Focus keywords (optional, comma-separated)</Label>
            <Input value={focusKeywords} onChange={(e) => setFocusKeywords(e.target.value)} placeholder="prompt engineering, chain of thought" />
          </div>
          <div>
            <Label>Editor notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any angle you want the writer to hit" />
          </div>
          <NavRow onBack={() => setStep(1)} onNext={() => setStep(3)} disableNext={!topic.trim()} />
        </Card>
      )}

      {step === 3 && (
        <Card className="p-5 space-y-3">
          <h2 className="font-display font-semibold">Step 3 · Depth</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {DEPTHS.map((d) => {
              const active = depth === d.key;
              return (
                <button key={d.key} onClick={() => setDepth(d.key)}
                  className={cn("text-left rounded-lg border p-3 transition-colors", active ? "border-primary bg-primary/5" : "border-border/60 hover:bg-surface-2/60")}
                >
                  <div className="font-medium text-sm">{d.label}</div>
                  <div className="text-xs text-muted-foreground">{d.words} · {d.detail}</div>
                </button>
              );
            })}
          </div>
          <NavRow onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </Card>
      )}

      {step === 4 && (
        <Card className="p-5 space-y-3">
          <h2 className="font-display font-semibold">Step 4 · Audience</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {AUDIENCES.map((a) => {
              const active = audience === a;
              return (
                <button key={a} onClick={() => setAudience(a)}
                  className={cn("rounded-lg border py-3 capitalize text-sm transition-colors", active ? "border-primary bg-primary/5 text-primary font-medium" : "border-border/60 hover:bg-surface-2/60")}
                >{a}</button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="size-4 mr-1" /> Back</Button>
            <Button onClick={() => outlineMut.mutate()} disabled={outlineMut.isPending}>
              {outlineMut.isPending ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Thinking…</> : <><Sparkles className="size-4 mr-1.5" />Generate outline</>}
            </Button>
          </div>
        </Card>
      )}

      {step === 5 && outline && (
        <div className="space-y-4">
          {duplicates.length > 0 && (
            <Card className="p-4 border-amber-500/40 bg-amber-50/40">
              <div className="text-sm font-medium flex items-center gap-2 text-amber-800"><AlertTriangle className="size-4" /> Similar content already exists</div>
              <ul className="mt-1 text-xs text-amber-800 space-y-0.5">
                {duplicates.map((d: any) => <li key={d.id}>• <strong>{d.title}</strong> ({d.status}) — consider updating that instead of creating a duplicate.</li>)}
              </ul>
            </Card>
          )}

          <Card className="p-5 space-y-3">
            <h2 className="font-display font-semibold">Step 5 · Review outline</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-[10px] uppercase tracking-wide text-muted-foreground">Title</span><div className="font-display font-semibold">{outline.title}</div></div>
              <div><span className="text-[10px] uppercase tracking-wide text-muted-foreground">SEO Title</span><div>{outline.seo_title}</div></div>
              <div><span className="text-[10px] uppercase tracking-wide text-muted-foreground">Meta Description</span><div className="text-muted-foreground">{outline.seo_description}</div></div>
              <div><span className="text-[10px] uppercase tracking-wide text-muted-foreground">Summary</span><div>{outline.summary}</div></div>
              <div>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Outline</span>
                <ol className="mt-1 space-y-1 pl-4 list-decimal">
                  {(outline.outline ?? []).map((s: any, i: number) => (
                    <li key={i}>
                      <div className="font-medium">{s.heading} {s.needs_verification && <Badge variant="outline" className="text-[10px] ml-1">Verify</Badge>}</div>
                      {s.points?.length ? <div className="text-xs text-muted-foreground">{s.points.slice(0, 4).join(" · ")}</div> : null}
                    </li>
                  ))}
                </ol>
              </div>
              <SuggestionBlock title="FAQs" items={(outline.faqs ?? []).map((f: any) => f.question)} />
              <SuggestionBlock title="Glossary suggestions" items={outline.glossary_suggestions ?? []} />
              <SuggestionBlock title="Comparison opportunities" items={outline.comparison_opportunities ?? []} />
              <SuggestionBlock title="Roadmap suggestions" items={outline.roadmap_suggestions ?? []} />
              <SuggestionBlock title="Related programs" items={outline.related_program_slugs_or_names ?? []} />
              <SuggestionBlock title="Related blogs" items={outline.related_blog_topics ?? []} />
              <SuggestionBlock title="Visual suggestions" items={(outline.visual_suggestions ?? []).map((v: any) => `${v.type}: ${v.description}`)} />
              <SuggestionBlock title="External reference types" items={outline.external_reference_ideas ?? []} />
              {(outline.content_quality_notes ?? []).length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wide text-amber-700">Editor cautions</span>
                  <ul className="text-xs text-amber-800 list-disc pl-4 mt-0.5">{outline.content_quality_notes.map((n: string, i: number) => <li key={i}>{n}</li>)}</ul>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-2 border-t border-border/60">
              <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="size-4 mr-1" />Adjust brief</Button>
              <Button onClick={() => bodyMut.mutate()} disabled={bodyMut.isPending}>
                {bodyMut.isPending ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Writing full article…</> : <><Sparkles className="size-4 mr-1.5" />Generate full article</>}
              </Button>
            </div>
          </Card>

          {body && (
            <Card className="p-5 space-y-3">
              <h2 className="font-display font-semibold flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /> Full draft ready</h2>
              {(body.warnings ?? []).length > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-50/40 p-3 text-xs text-amber-800">
                  <strong>Verify before publishing:</strong>
                  <ul className="list-disc pl-4 mt-1">{body.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              <div className="prose prose-sm max-w-none dark:prose-invert border border-border/60 rounded-md p-4 max-h-[500px] overflow-y-auto">
                <ReactMarkdown>{body.body_markdown}</ReactMarkdown>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">The draft opens in the Content Studio editor. Publishing requires editor approval.</div>
                <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                  {saveMut.isPending ? "Saving…" : "Save draft & open editor"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Type", "Topic", "Depth", "Audience", "Outline"];
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex items-center gap-1.5">
            <div className={cn(
              "size-5 rounded-full flex items-center justify-center text-[10px] font-mono",
              done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground",
            )}>{n}</div>
            <span className={cn(active ? "font-medium" : "text-muted-foreground")}>{l}</span>
            {i < labels.length - 1 && <ChevronRight className="size-3 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

function NavRow({ onBack, onNext, disableNext }: any) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button variant="outline" onClick={onBack}><ChevronLeft className="size-4 mr-1" /> Back</Button>
      <Button onClick={onNext} disabled={disableNext}>Next <ChevronRight className="size-4 ml-1" /></Button>
    </div>
  );
}

function SuggestionBlock({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {items.slice(0, 12).map((s, i) => <Badge key={i} variant="outline" className="text-[11px] font-normal">{s}</Badge>)}
      </div>
    </div>
  );
}
