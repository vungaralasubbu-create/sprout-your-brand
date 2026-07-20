import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Star, Clock, Zap, ArrowLeft, Sparkles, Check, Heart, Share2, Loader2,
  FileText, Image as ImageIcon, Video, Mail, Layout, ClipboardList, GitBranch, LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTemplate, toggleFavorite, useTemplate, submitReview } from "@/lib/templates/templates.functions";

export const Route = createFileRoute("/_authenticated/templates/$slug")({
  component: TemplateDetail,
});

const ASSET_ICONS: Record<string, any> = {
  strategy: FileText, posts: ClipboardList, images: ImageIcon, videos: Video,
  emails: Mail, landing: Layout, forms: ClipboardList, automation: GitBranch,
  calendar: FileText, analytics: LineChart, workflow: GitBranch,
};

function TemplateDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);

  const gt = useServerFn(getTemplate);
  const tf = useServerFn(toggleFavorite);
  const ut = useServerFn(useTemplate);
  const sr = useServerFn(submitReview);

  const q = useQuery({ queryKey: ["tpl", slug], queryFn: () => gt({ data: { slug } }) });
  const t = q.data?.template as any;
  const reviews = q.data?.reviews ?? [];

  const favMut = useMutation({
    mutationFn: () => tf({ data: { templateId: t.id } }),
    onSuccess: (r) => toast.success(r.favorited ? "Saved to favorites" : "Removed from favorites"),
  });

  const useMut = useMutation({
    mutationFn: (values: Record<string, any>) => ut({ data: { templateId: t.id, values } }),
    onSuccess: (r) => {
      toast.success("AI is generating your project…");
      navigate({ to: "/workspace/project/$projectId", params: { projectId: r.projectId } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to generate"),
  });

  const reviewMut = useMutation({
    mutationFn: (v: { rating: number; body: string }) => sr({ data: { templateId: t.id, rating: v.rating, body: v.body } }),
    onSuccess: () => {
      toast.success("Review submitted");
      qc.invalidateQueries({ queryKey: ["tpl", slug] });
    },
  });

  if (q.isLoading) return <div className="mx-auto max-w-6xl px-4 py-10"><div className="h-96 animate-pulse rounded-3xl bg-muted/40" /></div>;
  if (!t) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="text-2xl font-semibold">Template not found</div>
        <Button asChild className="mt-4"><Link to="/templates">Back to marketplace</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/templates" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All templates
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          {/* Cover */}
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/20 via-fuchsia-500/10 to-blue-500/10">
            {t.cover_image_url ? (
              <img src={t.cover_image_url} alt={t.title} className="h-72 w-full object-cover" />
            ) : (
              <div className="flex h-72 items-center justify-center">
                <Sparkles className="h-16 w-16 text-primary/30" />
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              {t.is_verified && <Badge cls="bg-blue-500/10 text-blue-600">Verified</Badge>}
              {t.is_editors_choice && <Badge cls="bg-amber-500/10 text-amber-600">Editor's Choice</Badge>}
              {t.is_enterprise_ready && <Badge cls="bg-emerald-500/10 text-emerald-600">Enterprise</Badge>}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{t.title}</h1>
            {t.tagline && <p className="mt-2 text-lg text-muted-foreground">{t.tagline}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {t.rating_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">{Number(t.rating_avg).toFixed(1)}</span>
                  ({t.rating_count} reviews)
                </span>
              )}
              <span>· {t.downloads_count.toLocaleString()} uses</span>
              <span>· by {t.author_display_name ?? "Glintr Team"}</span>
            </div>
          </div>

          {t.description && (
            <div className="mt-6">
              <div className="text-sm font-semibold">Overview</div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{t.description}</p>
            </div>
          )}

          {/* Included assets */}
          {t.included_assets?.length > 0 && (
            <div className="mt-8">
              <div className="text-sm font-semibold">What you'll generate</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {t.included_assets.map((a: string) => {
                  const Icon = ASSET_ICONS[a] ?? Sparkles;
                  return (
                    <div key={a} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
                      <div className="rounded-md bg-primary/10 p-1.5 text-primary"><Icon className="h-4 w-4" /></div>
                      <span className="capitalize">{a.replace(/_/g, " ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-10">
            <div className="text-sm font-semibold">Reviews</div>
            <ReviewForm onSubmit={(v) => reviewMut.mutate(v)} pending={reviewMut.isPending} />
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? (
                <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">Be the first to review.</div>
              ) : (
                reviews.map((r: any) => (
                  <div key={r.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                        {r.is_verified && <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Verified user</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.title && <div className="mt-2 font-medium">{r.title}</div>}
                    {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-2xl border bg-card p-6">
            <Button className="w-full" onClick={() => setWizardOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> Use this template
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => favMut.mutate()}>
                <Heart className="mr-1 h-4 w-4" /> Save
              </Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>
                <Share2 className="mr-1 h-4 w-4" /> Share
              </Button>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <Row icon={Clock} label="Est. time" value={`${t.estimated_time_minutes} min`} />
              <Row icon={Zap} label="AI credits" value={`~${t.estimated_credits}`} />
              <Row icon={FileText} label="Difficulty" value={<span className="capitalize">{t.difficulty}</span>} />
              {t.campaign_length_days && <Row icon={ClipboardList} label="Campaign length" value={`${t.campaign_length_days} days`} />}
            </div>

            {t.channels?.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Channels</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.channels.map((c: string) => (
                    <span key={c} className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] capitalize">{c.replace(/-/g, " ")}</span>
                  ))}
                </div>
              </div>
            )}
            {t.ai_agents?.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Agents</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.ai_agents.map((c: string) => (
                    <span key={c} className="rounded-full border bg-primary/5 px-2 py-0.5 text-[11px] capitalize text-primary">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {wizardOpen && (
        <UseWizard
          template={t}
          onClose={() => setWizardOpen(false)}
          onSubmit={(values) => useMut.mutate(values)}
          pending={useMut.isPending}
        />
      )}
    </div>
  );
}

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", cls)}>{children}</span>;
}
function Row({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /> {label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ---------- Wizard ----------
function UseWizard({ template, onClose, onSubmit, pending }: { template: any; onClose: () => void; onSubmit: (v: Record<string, any>) => void; pending: boolean }) {
  const vars: any[] = template.variables ?? [];
  const defaultVars = vars.length > 0 ? vars : [
    { key: "business_name", label: "Business Name", required: true },
    { key: "target_audience", label: "Target Audience", required: true },
    { key: "primary_cta", label: "Primary CTA", required: false, default: "Get started" },
  ];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    defaultVars.forEach((v) => (init[v.key] = v.default ?? ""));
    return init;
  });

  const canSubmit = defaultVars.filter((v) => v.required).every((v) => (values[v.key] ?? "").trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="border-b p-5">
          <div className="text-sm font-semibold">Personalize your template</div>
          <p className="mt-1 text-xs text-muted-foreground">AI will use these details to customize every asset.</p>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          {defaultVars.map((v) => (
            <div key={v.key}>
              <label className="text-sm font-medium">
                {v.label ?? v.key.replace(/_/g, " ")} {v.required && <span className="text-red-500">*</span>}
              </label>
              {(v.key.includes("audience") || v.key.includes("description")) ? (
                <textarea
                  value={values[v.key] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [v.key]: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              ) : (
                <input
                  type="text"
                  value={values[v.key] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [v.key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              )}
              {v.help && <div className="mt-1 text-xs text-muted-foreground">{v.help}</div>}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t bg-muted/20 p-4">
          <div className="text-xs text-muted-foreground">
            <Zap className="mr-1 inline h-3 w-3" /> ~{template.estimated_credits} credits
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!canSubmit || pending} onClick={() => onSubmit(values)}>
              {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Check className="mr-2 h-4 w-4" /> Generate project</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Review form ----------
function ReviewForm({ onSubmit, pending }: { onSubmit: (v: { rating: number; body: string }) => void; pending: boolean }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  return (
    <div className="mt-3 rounded-xl border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Leave a review</div>
      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} onClick={() => setRating(i + 1)}>
            <Star className={cn("h-5 w-5 transition", i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 hover:text-amber-300")} />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share what worked well…"
        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="mt-2 flex justify-end">
        <Button size="sm" disabled={!rating || pending} onClick={() => onSubmit({ rating, body })}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
        </Button>
      </div>
    </div>
  );
}
