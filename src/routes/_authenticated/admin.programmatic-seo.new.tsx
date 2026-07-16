import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Sparkles, Plus, Trash2, ShieldCheck, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PSEO_TEMPLATES } from "@/lib/pseo/templates";
import { generatePseoBatch, pageQualityCheck } from "@/lib/pseo/generator";
import { pseoStore } from "@/lib/pseo/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/programmatic-seo/new")({
  component: NewPseoPage,
});

function NewPseoPage() {
  const navigate = useNavigate();
  const [templateId, setTemplateId] = useState<string>(PSEO_TEMPLATES[0].id);
  const template = useMemo(() => PSEO_TEMPLATES.find((t) => t.id === templateId)!, [templateId]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("Glintr Editorial");

  const setValue = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const matrix = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const v of template.variables) {
      const raw = (values[v.key] ?? "").trim();
      if (!raw) continue;
      m[v.key] = raw.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
    }
    return m;
  }, [values, template]);

  const preview = useMemo(() => {
    if (Object.keys(matrix).length === 0) return [];
    try {
      return generatePseoBatch({ templateId, variableMatrix: matrix, category: category || template.pageType, author });
    } catch {
      return [];
    }
  }, [matrix, templateId, category, template.pageType, author]);

  const existing = pseoStore.list();
  const previewIssues = useMemo(() => preview.map((p) => ({ page: p, issues: pageQualityCheck(p, existing) })), [preview, existing]);

  const canGenerate = preview.length > 0 && preview.length <= 200;

  function commit() {
    const clean = preview.filter((p) => !pageQualityCheck(p, existing).some((i) => i.level === "error"));
    if (clean.length === 0) {
      alert("All previewed pages failed quality checks. Adjust variables and try again.");
      return;
    }
    pseoStore.upsertMany(clean);
    navigate({ to: "/admin/programmatic-seo" as any });
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to={"/admin/programmatic-seo" as any} className="inline-flex items-center gap-1 hover:text-foreground">
          <ChevronLeft className="size-4" /> Back to Programmatic SEO
        </Link>
      </div>

      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="size-5 text-primary" /> Generate pages
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Pick a template, provide one or more values for each variable (separated by commas or new lines), and Glintr will generate every combination as a draft.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Template</Label>
              <select
                value={templateId}
                onChange={(e) => { setTemplateId(e.target.value); setValues({}); }}
                className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
              >
                {PSEO_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
            </div>

            {template.variables.map((v) => (
              <div key={v.key}>
                <Label>
                  {v.label} {v.required && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  rows={2}
                  value={values[v.key] ?? ""}
                  onChange={(e) => setValue(v.key, e.target.value)}
                  placeholder={v.placeholder ? `${v.placeholder}\n(one per line, or comma-separated)` : "One per line, or comma-separated"}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            ))}

            <div>
              <Label>Category (optional)</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. AI, Data Science" className="mt-1" />
            </div>
            <div>
              <Label>Author</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1" />
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground flex gap-2">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>
                Each generated page starts in <strong>Draft</strong>. Editors must approve before it can move to review, schedule, or publish.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Preview ({preview.length} pages)</div>
                <div className="text-xs text-muted-foreground">
                  {Object.keys(matrix).length === 0 ? "Fill in variables to preview generated pages." : `Cartesian product of ${Object.entries(matrix).map(([k, v]) => `${k}: ${v.length}`).join(" × ")}`}
                </div>
              </div>
              <Button onClick={commit} disabled={!canGenerate} className="gap-1.5">
                <Plus className="size-4" /> Generate {preview.length || ""} drafts
              </Button>
            </div>

            {preview.length > 200 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 text-xs p-3 text-amber-700 flex gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                Batch is above 200 pages. Break it up so editors can review meaningfully.
              </div>
            )}

            <div className="max-h-[560px] overflow-y-auto divide-y rounded-md border">
              {previewIssues.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">No pages yet.</div>
              )}
              {previewIssues.map(({ page, issues }) => {
                const errors = issues.filter((i) => i.level === "error");
                const warns = issues.filter((i) => i.level === "warn");
                return (
                  <div key={page.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{page.title}</div>
                        <div className="text-xs text-muted-foreground truncate">/p/{page.slug}</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        {errors.length > 0 && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/40 text-[10px]">{errors.length} errors</Badge>}
                        {warns.length > 0 && <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/40 text-[10px]">{warns.length} warnings</Badge>}
                        {errors.length + warns.length === 0 && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/40 text-[10px]">Clean</Badge>}
                      </div>
                    </div>
                    {(errors.length > 0 || warns.length > 0) && (
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {[...errors, ...warns].map((i, idx) => (
                          <li key={idx} className={cn("flex gap-1.5", i.level === "error" ? "text-destructive" : "text-amber-600")}>
                            <Info className="size-3.5 shrink-0 mt-0.5" /> {i.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keep = Trash2;
