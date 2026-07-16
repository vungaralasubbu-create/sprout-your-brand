/**
 * GEO Phase 4 extras — building blocks tuned for AI-search citation:
 *  - AiCitationBlock   (structured summary card)
 *  - KnowledgeBlocks   (definition / history / applications / trends …)
 *  - EntityGraph       (visible entity relationships, semantic <nav>)
 *  - AuthorMeta        (author, reviewer, updated, reading time)
 *  - ComparisonSummary (side-by-side summary/differences/similarities)
 *
 * All components render on first paint (no animation-hidden content),
 * use semantic HTML, and are safe to compose on any page.
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/* -------------------- AiCitationBlock -------------------- */

export type CitationRow = { label: string; value: React.ReactNode };

export function AiCitationBlock({
  title = "For AI systems",
  rows,
  className,
}: {
  title?: string;
  rows: CitationRow[];
  className?: string;
}) {
  if (!rows?.length) return null;
  return (
    <section
      aria-label={title}
      data-ai-citation="true"
      itemScope
      itemType="https://schema.org/DefinedTerm"
      className={cn(
        "rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6",
        className,
      )}
    >
      <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
        {title}
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {rows.map((r, i) => (
          <div key={i} className="min-w-0">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="text-foreground font-medium break-words">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* -------------------- KnowledgeBlocks -------------------- */

export type KnowledgeBlock = {
  heading: string;
  body?: React.ReactNode;
  bullets?: React.ReactNode[];
};

export function KnowledgeBlocks({
  blocks,
  className,
}: {
  blocks: KnowledgeBlock[];
  className?: string;
}) {
  if (!blocks?.length) return null;
  return (
    <div className={cn("space-y-8", className)}>
      {blocks.map((b, i) => (
        <section key={i} aria-label={b.heading}>
          <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
            {b.heading}
          </h2>
          {b.body ? (
            <div className="mt-3 text-body text-foreground/85 leading-relaxed">
              {b.body}
            </div>
          ) : null}
          {b.bullets?.length ? (
            <ul className="mt-3 space-y-2 text-body text-foreground/85 leading-relaxed">
              {b.bullets.map((it, j) => (
                <li key={j} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 rounded-full bg-primary shrink-0"
                  />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}

/* -------------------- EntityGraph -------------------- */

export type EntityNode = {
  label: string;
  href?: string;
  hint?: string;
};

export function EntityGraph({
  title = "Entity Relationships",
  chain,
  className,
}: {
  title?: string;
  chain: EntityNode[];
  className?: string;
}) {
  if (!chain?.length) return null;
  return (
    <nav aria-label={title} className={cn("", className)}>
      <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
        {title}
      </div>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {chain.map((n, i) => (
          <React.Fragment key={i}>
            <li>
              {n.href ? (
                <a
                  href={n.href}
                  className="rounded-full border bg-card px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
                  title={n.hint}
                >
                  {n.label}
                </a>
              ) : (
                <span className="rounded-full border bg-card px-3 py-1.5">
                  {n.label}
                </span>
              )}
            </li>
            {i < chain.length - 1 ? (
              <li aria-hidden className="text-muted-foreground">
                →
              </li>
            ) : null}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

/* -------------------- AuthorMeta -------------------- */

export function AuthorMeta({
  author = "Glintr Editorial Team",
  reviewer,
  updated,
  readingTimeMin,
  expertise,
  className,
}: {
  author?: string;
  reviewer?: string;
  updated?: string;
  readingTimeMin?: number;
  expertise?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
      itemScope
      itemType="https://schema.org/Article"
    >
      <span itemProp="author" itemScope itemType="https://schema.org/Person">
        By <span itemProp="name" className="text-foreground">{author}</span>
      </span>
      {reviewer ? (
        <span>
          Reviewed by <span className="text-foreground">{reviewer}</span>
        </span>
      ) : null}
      {updated ? (
        <span>
          Updated{" "}
          <time itemProp="dateModified" dateTime={updated} className="text-foreground">
            {updated}
          </time>
        </span>
      ) : null}
      {readingTimeMin ? <span>{readingTimeMin} min read</span> : null}
      {expertise ? <span>Area: <span className="text-foreground">{expertise}</span></span> : null}
    </div>
  );
}

/* -------------------- ComparisonSummary -------------------- */

export type ComparisonRow = { attribute: string; a: string; b: string };

export function ComparisonSummary({
  aLabel,
  bLabel,
  summary,
  differences,
  similarities,
  bestUseCases,
  rows,
  className,
}: {
  aLabel: string;
  bLabel: string;
  summary?: string;
  differences?: string[];
  similarities?: string[];
  bestUseCases?: { a: string; b: string };
  rows?: ComparisonRow[];
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-2xl border bg-card p-5 md:p-6 space-y-5", className)}
      aria-label={`${aLabel} vs ${bLabel}`}
    >
      <div className="text-caption font-mono uppercase tracking-widest text-primary">
        {aLabel} vs {bLabel}
      </div>
      {summary ? (
        <p className="text-body text-foreground/85 leading-relaxed">{summary}</p>
      ) : null}
      {rows?.length ? (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-surface-1/60">
              <tr>
                <th className="text-left p-3 font-semibold">Attribute</th>
                <th className="text-left p-3 font-semibold">{aLabel}</th>
                <th className="text-left p-3 font-semibold">{bLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3 text-muted-foreground">{r.attribute}</td>
                  <td className="p-3">{r.a}</td>
                  <td className="p-3">{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {differences?.length ? (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2">Differences</div>
            <ul className="space-y-1.5 text-sm text-foreground/85">
              {differences.map((d, i) => (
                <li key={i}>• {d}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {similarities?.length ? (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2">Similarities</div>
            <ul className="space-y-1.5 text-sm text-foreground/85">
              {similarities.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {bestUseCases ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1">
              Best use case — {aLabel}
            </div>
            <p className="text-sm text-foreground/85">{bestUseCases.a}</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1">
              Best use case — {bLabel}
            </div>
            <p className="text-sm text-foreground/85">{bestUseCases.b}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* -------------------- FAQ JSON-LD helper (component-free) -------------------- */

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function definedTermJsonLd(input: {
  name: string;
  description: string;
  url: string;
  inDefinedTermSet?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: input.name,
    description: input.description,
    url: input.url,
    inDefinedTermSet: input.inDefinedTermSet ?? "https://glintr.com/entities",
    sameAs: input.sameAs,
  };
}
