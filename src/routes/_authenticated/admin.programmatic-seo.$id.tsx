import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Save, Send, CalendarClock, CheckCircle2, Undo2, Trash2, Sparkles, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { pseoStore } from "@/lib/pseo/store";
import type { PseoPage, PseoStatus } from "@/lib/pseo/types";
import { pageQualityCheck } from "@/lib/pseo/generator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/programmatic-seo/$id")({
  component: PseoEditorPage,
});

function PseoEditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<PseoPage | null>(null);

  useEffect(() => {
    const p = pseoStore.get(id);
    if (!p) navigate({ to: "/admin/programmatic-seo" as any });
    else setPage(p);
  }, [id, navigate]);

  const issues = useMemo(() => (page ? pageQualityCheck(page, pseoStore.list()) : []), [page]);
  const hasErrors = issues.some((i) => i.level === "error");

  if (!page) return null;

  const save = () => {
    pseoStore.upsert(page);
    alert("Saved.");
  };
  const setStatus = (status: PseoStatus, note?: string) => {
    if (status === "approved" || status === "scheduled" || status === "published") {
      if (hasErrors) {
        alert("Fix quality errors before promoting this page.");
        return;
      }
    }
    pseoStore.upsert(page);
    pseoStore.updateStatus(page.id, status, note);
    setPage(pseoStore.get(page.id) ?? page);
  };

  const update = <K extends keyof PseoPage>(k: K, v: PseoPage[K]) => setPage((p) => (p ? { ...p, [k]: v } : p));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to={"/admin/programmatic-seo" as any} className="inline-flex items-center gap-1 hover:text-foreground">
          <ChevronLeft className="size-4" /> Back
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold truncate flex items-center gap-2">
            <Sparkles className="size-5 text-primary shrink-0" />
            {page.title || "Untitled"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="capitalize">{page.status}</Badge>
            <span>/p/{page.slug}</span>
            <span>·</span>
            <span>{page.readingTimeMin} min read</span>
            <span>·</span>
            <span>{page.author}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={save} className="gap-1.5"><Save className="size-4" /> Save</Button>
          {page.status === "draft" && (
            <Button variant="outline" onClick={() => setStatus("review")} className="gap-1.5"><Send className="size-4" /> Send to review</Button>
          )}
          {page.status === "review" && (
            <>
              <Button variant="outline" onClick={() => setStatus("draft", "Sent back for edits")} className="gap-1.5"><Undo2 className="size-4" /> Back to draft</Button>
              <Button onClick={() => setStatus("approved")} className="gap-1.5"><CheckCircle2 className="size-4" /> Approve</Button>
            </>
          )}
          {page.status === "approved" && (
            <>
              <Button variant="outline" onClick={() => setStatus("scheduled")} className="gap-1.5"><CalendarClock className="size-4" /> Schedule</Button>
              <Button onClick={() => setStatus("published")} className="gap-1.5"><CheckCircle2 className="size-4" /> Publish</Button>
            </>
          )}
          {page.status === "scheduled" && (
            <Button onClick={() => setStatus("published")} className="gap-1.5"><CheckCircle2 className="size-4" /> Publish now</Button>
          )}
          {page.status === "published" && (
            <Button variant="outline" onClick={() => setStatus("draft", "Unpublished")} className="gap-1.5"><Undo2 className="size-4" /> Unpublish</Button>
          )}
          <Button
            variant="ghost"
            className="text-destructive gap-1.5"
            onClick={() => {
              if (confirm("Delete this page?")) {
                pseoStore.remove(page.id);
                navigate({ to: "/admin/programmatic-seo" as any });
              }
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </header>

      {issues.length > 0 && (
        <Card className={cn(hasErrors ? "border-destructive/50" : "border-amber-500/40")}>
          <CardContent className="p-3">
            <div className={cn("text-sm font-medium flex items-center gap-1.5", hasErrors ? "text-destructive" : "text-amber-600")}>
              <AlertTriangle className="size-4" /> Quality check
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              {issues.map((i, idx) => (
                <li key={idx} className={cn("flex gap-1.5", i.level === "error" ? "text-destructive" : "text-amber-600")}>
                  <Info className="size-3.5 shrink-0 mt-0.5" /> {i.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={page.title} onChange={(e) => update("title", e.target.value)} className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">{page.title.length} / 70</p>
              </div>
              <div>
                <Label>H1</Label>
                <Input value={page.h1} onChange={(e) => update("h1", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={page.description} onChange={(e) => update("description", e.target.value)} rows={3} className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">{page.description.length} / 170</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Slug</Label>
                  <Input value={page.slug} onChange={(e) => update("slug", e.target.value)} className="mt-1 font-mono text-xs" />
                </div>
                <div>
                  <Label>Canonical</Label>
                  <Input value={page.canonical} onChange={(e) => update("canonical", e.target.value)} className="mt-1 font-mono text-xs" />
                </div>
              </div>
              <div>
                <Label>Keywords</Label>
                <Input
                  value={page.keywords.join(", ")}
                  onChange={(e) => update("keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-sm font-medium">Sections</div>
              {page.sections.map((s, i) => (
                <div key={i} className="rounded-md border p-3 space-y-2">
                  <Input
                    value={s.heading}
                    onChange={(e) => {
                      const next = [...page.sections];
                      next[i] = { ...next[i], heading: e.target.value };
                      update("sections", next);
                    }}
                    className="font-medium"
                  />
                  <Textarea
                    rows={4}
                    value={s.body}
                    onChange={(e) => {
                      const next = [...page.sections];
                      next[i] = { ...next[i], body: e.target.value };
                      update("sections", next);
                    }}
                  />
                  {s.bullets && s.bullets.length > 0 && (
                    <Textarea
                      rows={s.bullets.length + 1}
                      value={s.bullets.join("\n")}
                      onChange={(e) => {
                        const next = [...page.sections];
                        next[i] = { ...next[i], bullets: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) };
                        update("sections", next);
                      }}
                      className="font-mono text-xs"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-sm font-medium">FAQs</div>
              {page.faqs.map((f, i) => (
                <div key={i} className="rounded-md border p-3 space-y-2">
                  <Input
                    value={f.q}
                    onChange={(e) => {
                      const next = [...page.faqs];
                      next[i] = { ...next[i], q: e.target.value };
                      update("faqs", next);
                    }}
                    className="font-medium"
                  />
                  <Textarea
                    rows={3}
                    value={f.a}
                    onChange={(e) => {
                      const next = [...page.faqs];
                      next[i] = { ...next[i], a: e.target.value };
                      update("faqs", next);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-sm font-medium">Related content</div>
              <Textarea
                rows={4}
                value={page.related.map((r) => `${r.label} | ${r.href}`).join("\n")}
                onChange={(e) => {
                  const next = e.target.value
                    .split("\n")
                    .map((line) => {
                      const [label, href] = line.split("|").map((x) => x.trim());
                      return label && href ? { label, href } : null;
                    })
                    .filter((x): x is { label: string; href: string } => x !== null);
                  update("related", next);
                }}
                placeholder="One per line — Label | /url"
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="text-sm font-medium mb-2">Editorial</div>
              <Row k="Template" v={page.templateId} />
              <Row k="Type" v={page.pageType} />
              <Row k="Category" v={page.category} />
              <Row k="Reading time" v={`${page.readingTimeMin} min`} />
              <Row k="Created" v={new Date(page.createdAt).toLocaleString()} />
              <Row k="Updated" v={new Date(page.updatedAt).toLocaleString()} />
              {page.publishedAt && <Row k="Published" v={new Date(page.publishedAt).toLocaleString()} />}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-sm font-medium">Analytics</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat k="Impressions" v={page.analytics?.impressions ?? 0} />
                <Stat k="Clicks" v={page.analytics?.clicks ?? 0} />
                <Stat k="CTR" v={`${((page.analytics?.ctr ?? 0) * 100).toFixed(1)}%`} />
                <Stat k="Avg pos" v={(page.analytics?.avgPosition ?? 0).toFixed(1)} />
                <Stat k="Organic" v={page.analytics?.organicTraffic ?? 0} />
                <Stat k="Internal clicks" v={page.analytics?.internalClicks ?? 0} />
              </div>
              <p className="text-[11px] text-muted-foreground">Numbers sync from Search Console + Analytics after publish.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm font-medium">Review notes</div>
              <Textarea rows={5} value={page.reviewNotes ?? ""} onChange={(e) => update("reviewNotes", e.target.value)} />
            </CardContent>
          </Card>

          {page.status === "published" && (
            <a
              href={`/p/${page.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View published page <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium truncate max-w-[180px]" title={v}>{v}</span>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="text-sm font-semibold tabular-nums">{v}</div>
    </div>
  );
}
