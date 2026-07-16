import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Wand2, Loader2, Image as ImageIcon, CheckCircle2, AlertTriangle,
  RefreshCw, FileText, Search, Link2, Rocket, ClipboardCheck, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  generateCompleteDraft, saveFactoryDraft, aiEditText,
  regenerateFactoryImage, runFactoryQualityCheck, publishFactoryDraft,
} from "@/lib/admin/ai-factory.functions";

export const Route = createFileRoute("/_authenticated/admin/ai-content/factory")({
  component: FactoryPage,
});

const DEPTHS = [
  { key: "quick" as const, label: "Quick", detail: "500–900 words" },
  { key: "standard" as const, label: "Standard", detail: "1,000–1,600 words" },
  { key: "comprehensive" as const, label: "Comprehensive", detail: "1,800–2,600 words" },
  { key: "master" as const, label: "Master", detail: "2,800–4,000 words" },
];
const AUDIENCES = ["beginner", "intermediate", "advanced", "professional"] as const;

type Draft = any;

function FactoryPage() {
  const navigate = useNavigate();
  const genFn = useServerFn(generateCompleteDraft);
  const saveFn = useServerFn(saveFactoryDraft);
  const editFn = useServerFn(aiEditText);
  const imgFn = useServerFn(regenerateFactoryImage);
  const qaFn = useServerFn(runFactoryQualityCheck);
  const pubFn = useServerFn(publishFactoryDraft);

  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<(typeof DEPTHS)[number]["key"]>("comprehensive");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("intermediate");
  const [focusKeywords, setFocusKeywords] = useState("");
  const [notes, setNotes] = useState("");
  const [generateImages, setGenerateImages] = useState(true);

  const [draft, setDraft] = useState<Draft>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [qa, setQa] = useState<any>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [reviewerName, setReviewerName] = useState("");

  const gen = useMutation({
    mutationFn: () =>
      genFn({
        data: {
          topic,
          depth,
          audience,
          focusKeywords: focusKeywords.split(",").map((s) => s.trim()).filter(Boolean),
          notes: notes || undefined,
          generateImages,
        },
      }),
    onSuccess: (r: any) => {
      setDraft(r.draft);
      setImages(r.images ?? {});
      setSavedId(null);
      setQa(null);
      toast.success("Publication-ready draft generated");
    },
    onError: (e: any) => toast.error(e?.message || "Generation failed"),
  });

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          draft,
          images,
          focusKeywords: focusKeywords.split(",").map((s) => s.trim()).filter(Boolean),
        },
      }),
    onSuccess: (r: any) => {
      setSavedId(r.id);
      toast.success("Saved to review queue");
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  const runQa = useMutation({
    mutationFn: () => qaFn({ data: { id: savedId! } }),
    onSuccess: (r: any) => {
      setQa(r);
      toast.success(`Quality score: ${r.score}/100`);
    },
    onError: (e: any) => toast.error(e?.message || "QA failed"),
  });

  const publish = useMutation({
    mutationFn: () => pubFn({ data: { id: savedId! } }),
    onSuccess: (r: any) => {
      toast.success(`Published → ${r.url}`);
      navigate({ to: "/blog/$slug" as any, params: { slug: r.slug } as any });
    },
    onError: (e: any) => toast.error(e?.message || "Publish failed"),
  });

  const rewriteBody = useMutation({
    mutationFn: (mode: "expand" | "shorten" | "rewrite") =>
      editFn({ data: { mode, text: draft.body_markdown } }),
    onSuccess: (r: any) => {
      setDraft({ ...draft, body_markdown: r.text });
      toast.success("Body updated");
    },
    onError: (e: any) => toast.error(e?.message || "Edit failed"),
  });

  const regenImage = useMutation({
    mutationFn: async (vars: { kind: string; prompt: string; alt?: string }) => {
      if (!savedId) throw new Error("Save the draft first before regenerating images.");
      return imgFn({ data: { id: savedId, kind: vars.kind as any, prompt: vars.prompt, alt: vars.alt } });
    },
    onSuccess: (r: any, vars: any) => {
      setImages({ ...images, [vars.kind]: r.url });
      toast.success(`Regenerated ${vars.kind}`);
    },
    onError: (e: any) => toast.error(e?.message || "Image regen failed"),
  });

  return (
    <div className="space-y-4 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Wand2 className="size-5 text-primary" /> AI Content Factory
        </h1>
        <p className="text-sm text-muted-foreground">
          One click → complete article + images + SEO + internal links + FAQs. Editor reviews, then publishes.
        </p>
      </header>

      {/* BRIEF */}
      <Card className="p-5 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Topic</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Retrieval Augmented Generation for enterprise" />
          </div>
          <div>
            <Label>Depth</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {DEPTHS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDepth(d.key)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                    depth === d.key ? "border-primary bg-primary/5" : "border-border/60 hover:bg-surface-2/60",
                  )}
                >
                  <div className="font-medium">{d.label}</div>
                  <div className="text-muted-foreground text-[11px]">{d.detail}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Audience</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs capitalize transition-colors",
                    audience === a ? "border-primary bg-primary/5" : "border-border/60 hover:bg-surface-2/60",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Focus keywords (comma-separated)</Label>
            <Input value={focusKeywords} onChange={(e) => setFocusKeywords(e.target.value)} placeholder="rag, vector search, embeddings" />
          </div>
          <div>
            <Label>Editor notes (optional)</Label>
            <Textarea rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any angle, framing, or emphasis" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={generateImages} onChange={(e) => setGenerateImages(e.target.checked)} />
            Also generate all images (hero, thumbnail, social, sections, infographic, diagram)
          </label>
          <Button
            onClick={() => gen.mutate()}
            disabled={!topic.trim() || gen.isPending}
            className="ml-auto"
          >
            {gen.isPending ? (
              <><Loader2 className="size-4 mr-1.5 animate-spin" />Building publication-ready draft…</>
            ) : (
              <><Sparkles className="size-4 mr-1.5" />Generate AI Draft</>
            )}
          </Button>
        </div>
        {gen.isPending && (
          <div className="text-xs text-muted-foreground border-t border-border/60 pt-2">
            This takes 30–90 seconds. Writing article, generating hero/thumbnail/social/section images, planning SEO and internal links…
          </div>
        )}
      </Card>

      {/* RESULT */}
      {draft && (
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border/60 bg-surface-1/60 px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Draft</div>
              <div className="font-display font-semibold">{draft.title}</div>
              <div className="text-xs text-muted-foreground">
                {draft.word_count} words · {draft.reading_time_min} min read · slug: <code>{draft.slug}</code>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!savedId ? (
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Saving…</> : "Save to review"}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => runQa.mutate()} disabled={runQa.isPending}>
                    {runQa.isPending ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4 mr-1.5" />} Run QA
                  </Button>
                  <Button onClick={() => setChecklistOpen(true)} disabled={publish.isPending}>
                    {publish.isPending ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Publishing…</> : <><Rocket className="size-4 mr-1.5" />Review &amp; publish</>}
                  </Button>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="article">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="article"><FileText className="size-3.5 mr-1.5" />Article</TabsTrigger>
              <TabsTrigger value="media"><ImageIcon className="size-3.5 mr-1.5" />Media</TabsTrigger>
              <TabsTrigger value="seo"><Search className="size-3.5 mr-1.5" />SEO</TabsTrigger>
              <TabsTrigger value="links"><Link2 className="size-3.5 mr-1.5" />Linking</TabsTrigger>
              <TabsTrigger value="visuals">Visual blocks</TabsTrigger>
              <TabsTrigger value="qa">Quality check</TabsTrigger>
            </TabsList>

            <TabsContent value="article" className="p-5 space-y-3">
              {(draft.warnings ?? []).length > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-50/50 p-3 text-xs text-amber-800 flex gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <div>
                    <strong>Verify before publishing:</strong>
                    <ul className="list-disc pl-4 mt-1">
                      {(draft.warnings as string[]).map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => rewriteBody.mutate("expand")} disabled={rewriteBody.isPending}>Expand</Button>
                <Button size="sm" variant="outline" onClick={() => rewriteBody.mutate("shorten")} disabled={rewriteBody.isPending}>Shorten</Button>
                <Button size="sm" variant="outline" onClick={() => rewriteBody.mutate("rewrite")} disabled={rewriteBody.isPending}>Rewrite</Button>
                {rewriteBody.isPending && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="size-3 animate-spin" />Rewriting…</span>}
              </div>
              <Field label="SEO title">{draft.seo_title}</Field>
              <Field label="Meta description">{draft.seo_description}</Field>
              <Field label="Subtitle">{draft.subtitle}</Field>
              <Field label="Summary">{draft.short_summary}</Field>
              <div>
                <Label>Body markdown</Label>
                <Textarea
                  rows={24}
                  value={draft.body_markdown}
                  onChange={(e) => setDraft({ ...draft, body_markdown: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
              <details>
                <summary className="text-sm font-medium cursor-pointer">Preview rendered</summary>
                <article className="prose prose-sm max-w-none mt-2 border rounded-md p-4 max-h-[500px] overflow-y-auto">
                  <ReactMarkdown>{draft.body_markdown}</ReactMarkdown>
                </article>
              </details>
              <Field label="Conclusion">{draft.conclusion}</Field>
              <Field label="CTA">{draft.cta_headline} — {draft.cta_body}</Field>
              <div>
                <Label>FAQs</Label>
                <div className="space-y-1.5 mt-1">
                  {(draft.faqs ?? []).map((f: any, i: number) => (
                    <div key={i} className="rounded-md border border-border/60 p-2.5 text-xs">
                      <div className="font-medium">{f.question}</div>
                      <div className="text-muted-foreground mt-0.5">{f.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="p-5 space-y-4">
              {!savedId && (
                <div className="text-xs text-amber-700 bg-amber-50/50 border border-amber-300/40 rounded-md p-2">
                  Save the draft first to enable image regeneration.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {["hero", "thumbnail", "social", "section_1", "section_2", "section_3", "infographic", "diagram"].map((kind) => {
                  const url = images[kind];
                  const plan =
                    kind === "hero" ? draft.image_plan?.hero :
                    kind === "thumbnail" ? draft.image_plan?.thumbnail :
                    kind === "social" ? draft.image_plan?.social :
                    kind === "infographic" ? draft.image_plan?.infographic :
                    kind === "diagram" ? draft.image_plan?.diagram :
                    draft.image_plan?.sections?.[parseInt(kind.split("_")[1]) - 1];
                  return (
                    <div key={kind} className="rounded-md border border-border/60 overflow-hidden">
                      <div className="aspect-video bg-surface-2 flex items-center justify-center text-xs text-muted-foreground">
                        {url ? (
                          <img src={url} alt={plan?.alt ?? kind} className="w-full h-full object-cover" />
                        ) : (
                          <span>No image</span>
                        )}
                      </div>
                      <div className="p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium capitalize">{kind.replace("_", " ")}</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!savedId || regenImage.isPending}
                            onClick={() => regenImage.mutate({ kind, prompt: plan?.prompt || `Editorial illustration for ${draft.title}`, alt: plan?.alt })}
                          >
                            <RefreshCw className="size-3" />
                          </Button>
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2">{plan?.alt ?? ""}</div>
                        {plan?.caption && <div className="text-[10px] italic text-muted-foreground">{plan.caption}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="seo" className="p-5 space-y-3">
              <Field label="Canonical" mono>https://glintr.com/blog/{draft.slug}</Field>
              <Field label="SEO title">{draft.seo_title}</Field>
              <Field label="Meta description">{draft.seo_description}</Field>
              <Field label="Open Graph title">{draft.seo_title}</Field>
              <Field label="Twitter card">summary_large_image</Field>
              <div>
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(draft.keywords ?? []).map((k: string) => <Badge key={k} variant="outline" className="text-[11px]">{k}</Badge>)}
                </div>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(draft.tags ?? []).map((k: string) => <Badge key={k} variant="outline" className="text-[11px]">{k}</Badge>)}
                </div>
              </div>
              <details>
                <summary className="text-sm font-medium cursor-pointer">Article JSON-LD</summary>
                <pre className="text-[11px] bg-surface-2 rounded-md p-2 overflow-x-auto mt-2">{JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Article",
                  headline: draft.title,
                  description: draft.seo_description,
                }, null, 2)}</pre>
              </details>
              <details>
                <summary className="text-sm font-medium cursor-pointer">FAQ JSON-LD</summary>
                <pre className="text-[11px] bg-surface-2 rounded-md p-2 overflow-x-auto mt-2">{JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: (draft.faqs ?? []).map((f: any) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
                }, null, 2)}</pre>
              </details>
            </TabsContent>

            <TabsContent value="links" className="p-5 space-y-3">
              <div>
                <Label>Internal links (auto-suggested)</Label>
                <ul className="mt-1 text-xs space-y-1">
                  {(draft.internal_links ?? []).map((l: any, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <ExternalLink className="size-3 text-muted-foreground" />
                      <span className="font-medium">{l.anchor}</span>
                      <code className="text-muted-foreground">{l.path}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Label>Related courses</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(draft.related_course_slugs ?? []).map((s: string) => <Badge key={s} variant="outline" className="text-[11px]"><code>{s}</code></Badge>)}
                </div>
              </div>
              <div>
                <Label>Related blogs</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(draft.related_blog_slugs ?? []).map((s: string) => <Badge key={s} variant="outline" className="text-[11px]"><code>{s}</code></Badge>)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="visuals" className="p-5 space-y-3">
              {draft.visual_blocks?.comparison_table && (
                <div>
                  <div className="text-xs font-medium mb-1">{draft.visual_blocks.comparison_table.title}</div>
                  <div className="overflow-x-auto rounded-md border border-border/60">
                    <table className="w-full text-xs">
                      <thead className="bg-surface-2"><tr>{(draft.visual_blocks.comparison_table.columns ?? []).map((c: string) => <th key={c} className="p-2 text-left">{c}</th>)}</tr></thead>
                      <tbody>{(draft.visual_blocks.comparison_table.rows ?? []).map((r: string[], i: number) => (
                        <tr key={i} className="border-t">{r.map((cell, j) => <td key={j} className="p-2">{cell}</td>)}</tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {(draft.visual_blocks?.stats_cards ?? []).map((s: any, i: number) => (
                  <div key={i} className="rounded-md border p-3">
                    <div className="text-lg font-display font-semibold">{s.stat}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    {s.note && <div className="text-[10px] text-amber-700 mt-1">{s.note}</div>}
                  </div>
                ))}
              </div>
              {(draft.visual_blocks?.callouts ?? []).map((c: any, i: number) => (
                <div key={i} className={cn(
                  "rounded-md border-l-4 p-3 text-sm",
                  c.kind === "warning" ? "border-amber-500 bg-amber-50/50" : c.kind === "tip" ? "border-emerald-500 bg-emerald-50/50" : "border-primary bg-primary/5",
                )}>{c.body}</div>
              ))}
              {(draft.visual_blocks?.timeline ?? []).length > 0 && (
                <div>
                  <Label>Timeline</Label>
                  <ul className="mt-1 space-y-1 text-xs">
                    {draft.visual_blocks.timeline.map((t: any, i: number) => (
                      <li key={i}><strong>{t.year}</strong> — {t.event}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(draft.visual_blocks?.roadmap ?? []).length > 0 && (
                <div>
                  <Label>Roadmap</Label>
                  <div className="grid gap-2 sm:grid-cols-2 mt-1">
                    {draft.visual_blocks.roadmap.map((r: any, i: number) => (
                      <div key={i} className="rounded-md border p-2 text-xs">
                        <div className="font-medium">{r.phase}</div>
                        <ul className="list-disc pl-4 mt-0.5 text-muted-foreground">{(r.items ?? []).map((it: string, j: number) => <li key={j}>{it}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="qa" className="p-5 space-y-3">
              {!savedId && <div className="text-xs text-amber-700">Save the draft to enable quality checks.</div>}
              {qa ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-16 rounded-full flex items-center justify-center font-display text-xl font-semibold",
                      qa.score >= 80 ? "bg-emerald-100 text-emerald-800" : qa.score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800",
                    )}>{qa.score}</div>
                    <div className="text-sm">Overall quality score</div>
                  </div>
                  <ul className="text-xs space-y-1">
                    {qa.checks.map((c: any) => (
                      <li key={c.key} className="flex items-start gap-2">
                        {c.pass ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="size-4 text-amber-600 shrink-0" />}
                        <div><strong className="capitalize">{c.key.replace(/_/g, " ")}:</strong> {c.msg}</div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">Click <em>Run QA</em> to verify grammar, SEO, links, images, alt text and accessibility.</div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* PRE-PUBLISH EDITORIAL QA CHECKLIST */}
      <PrePublishChecklist
        open={checklistOpen}
        onOpenChange={setChecklistOpen}
        draft={draft}
        images={images}
        checks={checks}
        setChecks={setChecks}
        reviewerName={reviewerName}
        setReviewerName={setReviewerName}
        publishing={publish.isPending}
        onConfirm={() => {
          setChecklistOpen(false);
          publish.mutate();
        }}
      />
    </div>
  );
}

// ---------- Checklist ----------

const CHECKLIST_ITEMS: {
  key: string;
  label: string;
  detail: string;
  verify: (d: any, images: Record<string, string>) => { ok: boolean; hint: string };
}[] = [
  {
    key: "seo_title",
    label: "SEO title is compelling and 40–65 characters",
    detail: "Concise, keyword-forward, matches the article's promise.",
    verify: (d) => {
      const n = (d?.seo_title ?? "").length;
      return { ok: n >= 40 && n <= 65, hint: `${n} chars` };
    },
  },
  {
    key: "meta_description",
    label: "Meta description is 130–158 characters",
    detail: "Reads as a natural summary; includes the primary keyword once.",
    verify: (d) => {
      const n = (d?.seo_description ?? "").length;
      return { ok: n >= 130 && n <= 158, hint: `${n} chars` };
    },
  },
  {
    key: "slug",
    label: "Slug is clean, lowercase, and unique",
    detail: "kebab-case, no dates or filler words. Confirm it doesn't clash with an existing blog post.",
    verify: (d) => {
      const s = d?.slug ?? "";
      const ok = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length >= 3 && s.length <= 90;
      return { ok, hint: s || "(missing)" };
    },
  },
  {
    key: "faqs",
    label: "FAQs answer real user questions (at least 4)",
    detail: "Each answer is factual, self-contained, and 2–4 sentences.",
    verify: (d) => {
      const n = (d?.faqs ?? []).length;
      return { ok: n >= 4, hint: `${n} FAQ${n === 1 ? "" : "s"}` },
    },
  },
  {
    key: "internal_links",
    label: "Internal links point to real Glintr pages (at least 3)",
    detail: "Anchor text is descriptive; every path resolves in the catalog.",
    verify: (d) => {
      const n = (d?.internal_links ?? []).length;
      return { ok: n >= 3, hint: `${n} link${n === 1 ? "" : "s"}` };
    },
  },
  {
    key: "cta",
    label: "Call-to-action is on-brand and actionable",
    detail: "Points to a relevant program or next step, not a generic 'learn more'.",
    verify: (d) => {
      const h = (d?.cta_headline ?? "").trim();
      const b = (d?.cta_body ?? "").trim();
      return { ok: h.length >= 4 && b.length >= 20, hint: h ? "present" : "missing" };
    },
  },
  {
    key: "hero_image",
    label: "Hero image is set and on-brand",
    detail: "Visually strong, no faces/logos, matches the article topic.",
    verify: (_d, images) => ({ ok: !!images?.hero, hint: images?.hero ? "set" : "missing" }),
  },
  {
    key: "facts_verified",
    label: "All statistics, quotes, and claims are verified",
    detail: "Any AI-flagged warnings above have been checked or removed.",
    verify: () => ({ ok: true, hint: "editor confirms" }),
  },
];

function PrePublishChecklist({
  open, onOpenChange, draft, images, checks, setChecks,
  reviewerName, setReviewerName, publishing, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: any;
  images: Record<string, string>;
  checks: Record<string, boolean>;
  setChecks: (v: Record<string, boolean>) => void;
  reviewerName: string;
  setReviewerName: (v: string) => void;
  publishing: boolean;
  onConfirm: () => void;
}) {
  const allChecked = CHECKLIST_ITEMS.every((i) => checks[i.key]);
  const canPublish = allChecked && reviewerName.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-primary" />
            Editor pre-publish checklist
          </DialogTitle>
          <DialogDescription>
            Confirm each item before this draft goes live at <code>/blog/{draft?.slug}</code>. Nothing publishes until every box is ticked.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const status = item.verify(draft, images);
            const ticked = !!checks[item.key];
            return (
              <li
                key={item.key}
                className={cn(
                  "rounded-md border p-3 transition-colors",
                  ticked ? "border-emerald-500/40 bg-emerald-50/40" : "border-border/60 bg-white",
                )}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={ticked}
                    onCheckedChange={(v) => setChecks({ ...checks, [item.key]: !!v })}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          status.ok ? "border-emerald-500/50 text-emerald-700" : "border-amber-500/50 text-amber-700",
                        )}
                      >
                        {status.ok ? <CheckCircle2 className="size-2.5 mr-1" /> : <AlertTriangle className="size-2.5 mr-1" />}
                        {status.hint}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.detail}</div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="rounded-md border border-border/60 p-3">
          <Label htmlFor="reviewer-name" className="text-xs">Reviewer name (for the audit trail)</Label>
          <Input
            id="reviewer-name"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Your full name"
            className="mt-1"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={publishing}>
            Back to draft
          </Button>
          <Button onClick={onConfirm} disabled={!canPublish || publishing}>
            {publishing ? (
              <><Loader2 className="size-4 mr-1.5 animate-spin" />Publishing…</>
            ) : (
              <><Rocket className="size-4 mr-1.5" />Confirm &amp; publish</>
            )}
          </Button>
        </DialogFooter>
        {!canPublish && (
          <p className="text-[11px] text-muted-foreground text-right -mt-2">
            {allChecked ? "Add your reviewer name to publish." : `Tick all ${CHECKLIST_ITEMS.length} items to enable publishing.`}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, mono }: { label: string; children: any; mono?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className={cn("text-sm mt-0.5", mono && "font-mono text-xs")}>{children || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
