import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateContentDraft, upsertContent } from "@/lib/admin/content.functions";
import { CONTENT_TYPES, CONTENT_TYPE_LABEL, type ContentType } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/content/ai-writer")({
  component: AiWriterPage,
});

function AiWriterPage() {
  const navigate = useNavigate();
  const gen = useServerFn(generateContentDraft);
  const save = useServerFn(upsertContent);

  const [topic, setTopic] = useState("");
  const [type, setType] = useState<ContentType>("learn_guide");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [draft, setDraft] = useState<any | null>(null);

  const genMut = useMutation({
    mutationFn: () => gen({ data: { topic, type, audience: audience || undefined, tone: tone || undefined, keyPoints: keyPoints.split("\n").map((s) => s.trim()).filter(Boolean) } }),
    onSuccess: (d: any) => { setDraft(d); toast.success("Draft generated — review below before saving"); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("No draft");
      return save({ data: {
        type,
        title: draft.title,
        slug: draft.slug,
        summary: draft.summary,
        body_markdown: draft.body_markdown,
        seo_title: draft.seo_title,
        seo_description: draft.seo_description,
        focus_topic: draft.focus_topic,
        related_topics: draft.related_topics ?? [],
        outline: draft.outline ?? [],
        tag_slugs: [],
        metadata: { generated_by: "ai_writer", suggestions: {
          internal_links: draft.internal_link_suggestions,
          glossary: draft.glossary_suggestions,
          comparisons: draft.comparison_suggestions,
          learning_paths: draft.learning_path_suggestions,
        } },
      } as any });
    },
    onSuccess: (r: any) => {
      toast.success("Saved as draft — opening editor");
      navigate({ to: "/admin/content/articles/$id" as any, params: { id: r.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><Sparkles className="size-5 text-primary" /> AI Writer</h1>
        <p className="text-sm text-muted-foreground">Generate structured drafts. Human review is required before publishing.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Content type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONTENT_TYPES.map((t) => <SelectItem key={t} value={t}>{CONTENT_TYPE_LABEL[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Topic / working title</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. How to negotiate B2B SaaS deals" />
          </div>
          <div className="space-y-1.5">
            <Label>Audience (optional)</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Sales executives with 1–3 years of experience" />
          </div>
          <div className="space-y-1.5">
            <Label>Tone (optional)</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="clear, expert, friendly" />
          </div>
          <div className="space-y-1.5">
            <Label>Key points to cover (one per line, optional)</Label>
            <Textarea value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} rows={5} />
          </div>
          <Button onClick={() => genMut.mutate()} disabled={!topic.trim() || genMut.isPending}>
            <Wand2 className="size-4 mr-1.5" /> {genMut.isPending ? "Generating…" : "Generate draft"}
          </Button>
        </Card>

        <Card className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          {!draft ? (
            <div className="text-sm text-muted-foreground text-center py-16">Draft preview will appear here.</div>
          ) : (
            <>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Title</div>
                <div className="font-display font-semibold">{draft.title}</div>
                <div className="text-xs text-muted-foreground font-mono">/{draft.slug}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Summary</div>
                <p className="text-sm">{draft.summary}</p>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">SEO Title / Meta</div>
                <p className="text-sm">{draft.seo_title}</p>
                <p className="text-xs text-muted-foreground">{draft.seo_description}</p>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Outline</div>
                <ul className="text-sm list-disc pl-4 space-y-0.5">
                  {(draft.outline ?? []).map((s: any, i: number) => <li key={i}>{s.heading}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Related topics</div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {(draft.related_topics ?? []).map((t: string) => <span key={t} className="px-2 py-0.5 border border-border/60 rounded-full">{t}</span>)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Body preview</div>
                <div className="text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">{(draft.body_markdown ?? "").slice(0, 1500)}…</div>
              </div>
              <Button className="w-full" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Save as draft & open editor</Button>
            </>
          )}
        </Card>
      </div>

      <Card className="p-4 border-amber-500/40 bg-amber-50/40">
        <div className="text-sm">
          <strong>Editor review required.</strong> All AI-generated drafts start in Draft status. Fact-check, add examples, verify links and images, then move to In Review.
        </div>
      </Card>
    </div>
  );
}
