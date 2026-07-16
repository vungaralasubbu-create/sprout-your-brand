import * as React from "react";
import { CheckCircle2, ShieldCheck, Sparkles, RefreshCw, GraduationCap, Compass, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContentBadge, EditorialMeta, Reference, ChangelogEntry } from "@/data/editorial";
import { getAuthor } from "@/data/authors";

const BADGE_ICON: Record<ContentBadge, React.ComponentType<{ className?: string }>> = {
  "Beginner Friendly": GraduationCap,
  "Expert Reviewed": ShieldCheck,
  "Updated Recently": RefreshCw,
  "AI Assisted": Sparkles,
  "Practical Guide": Compass,
  "Career Focused": Briefcase,
};

export function BadgeStrip({ badges, className }: { badges?: ContentBadge[]; className?: string }) {
  if (!badges?.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((b) => {
        const Icon = BADGE_ICON[b];
        return (
          <Badge key={b} variant="muted" className="gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {b}
          </Badge>
        );
      })}
    </div>
  );
}

export function ReviewMetaCard({ meta }: { meta: EditorialMeta }) {
  const reviewer = meta.reviewedBy ? getAuthor(meta.reviewedBy) : undefined;
  return (
    <div className="rounded-lg border bg-surface p-5 space-y-3 text-sm">
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-4 w-4" />
        <span className="font-medium">Editorial review</span>
        <Badge variant="outline" className="ml-auto">{meta.status}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
        <dt>Published</dt><dd className="text-foreground">{meta.publishedAt}</dd>
        <dt>Last updated</dt><dd className="text-foreground">{meta.updatedAt}</dd>
        {reviewer && (<><dt>Reviewed by</dt><dd className="text-foreground">{reviewer.name}</dd></>)}
        {meta.reviewDate && (<><dt>Review date</dt><dd className="text-foreground">{meta.reviewDate}</dd></>)}
        <dt>Version</dt><dd className="text-foreground">{meta.version}</dd>
        {typeof meta.qualityScore === "number" && (
          <><dt>Quality score</dt><dd className="text-foreground">{meta.qualityScore}/100</dd></>
        )}
      </dl>
      {meta.reasonForUpdate && (
        <p className="text-xs text-muted-foreground">Reason for last update: {meta.reasonForUpdate}</p>
      )}
    </div>
  );
}

export function Changelog({ entries }: { entries?: ChangelogEntry[] }) {
  if (!entries?.length) return null;
  return (
    <div className="rounded-lg border p-5">
      <h3 className="text-lg font-semibold mb-3">Changelog</h3>
      <ol className="space-y-3 text-sm">
        {entries.map((e) => (
          <li key={e.version} className="flex gap-3">
            <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface">v{e.version}</span>
                <span className="text-muted-foreground">{e.date}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{e.editor}</span>
              </div>
              <p className="mt-1">{e.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ReferenceList({ references }: { references?: Reference[] }) {
  if (!references?.length) return null;
  return (
    <div className="rounded-lg border p-5">
      <h3 className="text-lg font-semibold mb-3">References</h3>
      <ul className="space-y-3 text-sm">
        {references.map((r) => (
          <li key={r.id} className="flex flex-col">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
              {r.title}
            </a>
            <span className="text-muted-foreground text-xs">
              {r.publisher} · {r.publishedAt} · {r.category} · Reliability: {r.reliability}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
