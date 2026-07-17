import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Save, RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_PARTNER_EARNINGS_COPY,
  interpolatePartnerEarningsCopy,
  partnerEarningsCopySchema,
  resolvePartnerEarningsCopy,
  type PartnerEarningsCopy,
} from "@/data/partner-earnings-copy";
import {
  fetchPartnerEarningsCopy,
  savePartnerEarningsCopy,
} from "@/lib/partner-earnings-copy.functions";

export const Route = createFileRoute("/_authenticated/admin/marketing-copy")({
  component: MarketingCopyPage,
  head: () => ({
    meta: [
      { title: "Marketing Copy · Admin · Glintr" },
      {
        name: "description",
        content:
          "Update partner earnings marketing copy site-wide — percentages, CTAs, labels and taglines — without code changes.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Field =
  | { path: [keyof PartnerEarningsCopy]; label: string; help?: string; kind: "number" }
  | {
      path: ["cta" | "labels" | "taglines", string];
      label: string;
      help?: string;
      kind: "text" | "textarea";
    };

const FIELDS: { section: string; help: string; fields: Field[] }[] = [
  {
    section: "Percentages",
    help:
      "Change once here and every {share}/{supported} token in the strings below updates site-wide.",
    fields: [
      { path: ["primarySharePct"], label: "Primary share %", kind: "number" },
      { path: ["supportedSharePct"], label: "Supported share %", kind: "number" },
    ],
  },
  {
    section: "Call-to-action buttons",
    help: "Use {share} for the primary percentage.",
    fields: [
      { path: ["cta", "primary"], label: "Primary CTA", kind: "text" },
      { path: ["cta", "short"], label: "Short CTA (nav / cards)", kind: "text" },
      { path: ["cta", "apply"], label: "Apply CTA", kind: "text" },
    ],
  },
  {
    section: "Nav & rate labels",
    help: "Used in header, footer, comparison tables and pricing tiles.",
    fields: [
      { path: ["labels", "partnerNav"], label: "Nav / footer label", kind: "text" },
      { path: ["labels", "revenueShare"], label: "Revenue share headline", kind: "text" },
      { path: ["labels", "revenueShareValue"], label: "Rate value", kind: "text" },
      { path: ["labels", "revenueModel"], label: "Revenue model label", kind: "text" },
      {
        path: ["labels", "supportedModel"],
        label: "Supported model label (comparisons only)",
        kind: "text",
      },
    ],
  },
  {
    section: "Taglines & SEO",
    help: "Powers hero copy, meta description and OG title.",
    fields: [
      { path: ["taglines", "hero"], label: "Hero tagline", kind: "text" },
      { path: ["taglines", "subtitle"], label: "Subtitle", kind: "textarea" },
      { path: ["taglines", "meta"], label: "Meta description", kind: "textarea" },
      { path: ["taglines", "ogTitle"], label: "OG title", kind: "text" },
    ],
  },
];

function getPath(copy: PartnerEarningsCopy, path: readonly string[]): string | number {
  // @ts-expect-error runtime traversal
  return path.reduce((acc, k) => acc?.[k], copy);
}
function setPath(
  copy: PartnerEarningsCopy,
  path: readonly string[],
  value: string | number,
): PartnerEarningsCopy {
  const next: any = structuredClone(copy);
  let cursor: any = next;
  for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]];
  cursor[path[path.length - 1]] = value;
  return next;
}

function MarketingCopyPage() {
  const fetcher = useServerFn(fetchPartnerEarningsCopy);
  const saver = useServerFn(savePartnerEarningsCopy);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "partner_earnings_copy"],
    queryFn: () => fetcher(),
    staleTime: 0,
  });

  const [draft, setDraft] = useState<PartnerEarningsCopy>(DEFAULT_PARTNER_EARNINGS_COPY);
  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: PartnerEarningsCopy) => saver({ data: payload }),
    onSuccess: (saved) => {
      qc.setQueryData(["marketing", "partner_earnings_copy"], saved);
      qc.invalidateQueries({ queryKey: ["marketing", "partner_earnings_copy"] });
      toast.success("Marketing copy updated site-wide");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    },
  });

  const preview = resolvePartnerEarningsCopy(draft);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label mb-2">CMS · Marketing</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Partner Earnings Copy
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Single source of truth for every partner-earning string on the public
            site. Changes here update the header, footer, hero, /earn,
            comparison pages and SEO tags — no code deploy required.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDraft(DEFAULT_PARTNER_EARNINGS_COPY)}
            disabled={mutation.isPending}
          >
            <RotateCcw className="mr-2 size-3.5" />
            Reset to defaults
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const parsed = partnerEarningsCopySchema.safeParse(draft);
              if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
                return;
              }
              mutation.mutate(parsed.data);
            }}
            disabled={mutation.isPending || isLoading}
          >
            <Save className="mr-2 size-3.5" />
            {mutation.isPending ? "Saving…" : "Save & publish"}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {FIELDS.map((group) => (
            <Card key={group.section} className="p-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold">{group.section}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{group.help}</p>
              </div>
              <div className="space-y-4">
                {group.fields.map((f) => {
                  const id = f.path.join(".");
                  const raw = getPath(draft, f.path);
                  return (
                    <div key={id} className="space-y-1.5">
                      <Label htmlFor={id} className="text-xs font-medium">
                        {f.label}
                      </Label>
                      {f.kind === "textarea" ? (
                        <Textarea
                          id={id}
                          value={String(raw ?? "")}
                          onChange={(e) =>
                            setDraft((prev) => setPath(prev, f.path, e.target.value))
                          }
                          rows={2}
                        />
                      ) : f.kind === "number" ? (
                        <Input
                          id={id}
                          type="number"
                          min={1}
                          max={100}
                          value={Number(raw)}
                          onChange={(e) =>
                            setDraft((prev) =>
                              setPath(
                                prev,
                                f.path,
                                Math.max(1, Math.min(100, Number(e.target.value) || 0)),
                              ),
                            )
                          }
                        />
                      ) : (
                        <Input
                          id={id}
                          value={String(raw ?? "")}
                          onChange={(e) =>
                            setDraft((prev) => setPath(prev, f.path, e.target.value))
                          }
                        />
                      )}
                      {typeof raw === "string" && /\{share\}|\{supported\}/.test(raw) && (
                        <p className="text-xs text-muted-foreground">
                          Renders as{" "}
                          <span className="font-medium text-foreground">
                            {interpolatePartnerEarningsCopy(raw, draft)}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="size-4" />
              <h2 className="text-sm font-semibold">Live preview</h2>
              <Badge variant="muted" className="ml-auto text-[10px]">
                {preview.primarySharePct}%
              </Badge>
            </div>
            <div className="space-y-4 text-sm">
              <PreviewLine label="Primary CTA" value={preview.cta.primary} />
              <PreviewLine label="Short CTA" value={preview.cta.short} />
              <PreviewLine label="Apply CTA" value={preview.cta.apply} />
              <Separator />
              <PreviewLine label="Nav label" value={preview.labels.partnerNav} />
              <PreviewLine label="Revenue share" value={preview.labels.revenueShare} />
              <PreviewLine label="Rate value" value={preview.labels.revenueShareValue} />
              <PreviewLine label="Revenue model" value={preview.labels.revenueModel} />
              <PreviewLine label="Supported model" value={preview.labels.supportedModel} />
              <Separator />
              <PreviewLine label="Hero tagline" value={preview.taglines.hero} />
              <PreviewLine label="Subtitle" value={preview.taglines.subtitle} />
              <PreviewLine label="Meta" value={preview.taglines.meta} />
              <PreviewLine label="OG title" value={preview.taglines.ogTitle} />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 leading-snug">{value}</p>
    </div>
  );
}
