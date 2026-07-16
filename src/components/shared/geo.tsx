/**
 * GEO (Generative Engine Optimization) primitives.
 *
 * Small, semantic building blocks designed so AI search systems
 * (Google AI Overviews, ChatGPT, Gemini, Claude, Perplexity, Copilot)
 * can easily parse, summarise and cite Glintr content.
 *
 * Design rules:
 * - Semantic HTML (article / section / dl / ul / h2 / h3).
 * - Answer-first — the short answer sits in the first paragraph.
 * - No animation-hidden content; everything renders on first paint.
 * - Compact styling that layers over any existing page background.
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/* -------------------- QuickAnswer -------------------- */

export function QuickAnswer({
  term,
  question,
  answer,
  className,
}: {
  term: string;
  question?: string;
  answer: React.ReactNode;
  className?: string;
}) {
  const q = question ?? `What is ${term}?`;
  return (
    <article
      itemScope
      itemType="https://schema.org/DefinedTerm"
      className={cn(
        "rounded-2xl border bg-card/60 backdrop-blur-sm p-6 md:p-7",
        className,
      )}
      aria-label={`Quick answer: ${q}`}
    >
      <div className="text-caption font-mono uppercase tracking-widest text-primary mb-2">
        Quick Answer
      </div>
      <h2
        itemProp="name"
        className="font-display font-semibold tracking-tight text-2xl md:text-3xl leading-tight"
      >
        {q}
      </h2>
      <div
        itemProp="description"
        className="mt-3 text-body md:text-body-lg text-foreground/85 leading-relaxed"
      >
        {answer}
      </div>
    </article>
  );
}

/* -------------------- KeyTakeaways -------------------- */

export function KeyTakeaways({
  items,
  title = "Key Takeaways",
  className,
}: {
  items: React.ReactNode[];
  title?: string;
  className?: string;
}) {
  if (!items?.length) return null;
  return (
    <aside
      className={cn(
        "rounded-2xl border bg-surface-2/50 p-6 md:p-7",
        className,
      )}
      aria-label={title}
    >
      <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
        {title}
      </div>
      <ul className="space-y-2.5 text-body text-foreground/85 leading-relaxed">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden
              className="mt-2 size-1.5 rounded-full bg-primary shrink-0"
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* -------------------- QuickFact -------------------- */

export type QuickFactRow = { label: string; value: React.ReactNode };

export function QuickFact({
  title,
  rows,
  className,
}: {
  title: string;
  rows: QuickFactRow[];
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-2xl border bg-card p-5 md:p-6", className)}
      aria-label={`${title} — quick facts`}
    >
      <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
        Quick Facts
      </div>
      <h3 className="font-display font-semibold text-xl">{title}</h3>
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {rows.map((r, i) => (
          <div key={i} className="min-w-0">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="text-foreground font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* -------------------- PeopleAlsoAsk -------------------- */

export function PeopleAlsoAsk({
  items,
  title = "People Also Ask",
  className,
}: {
  items: Array<{ question: string; answer: string }>;
  title?: string;
  className?: string;
}) {
  if (!items?.length) return null;
  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
        {title}
      </div>
      <div className="rounded-2xl border divide-y bg-card">
        {items.map((it, i) => (
          <details key={i} className="group p-5 open:bg-surface-1/40">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
              <span className="font-display font-semibold text-lg leading-snug">
                {it.question}
              </span>
              <span
                aria-hidden
                className="mt-1 text-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-body text-foreground/80 leading-relaxed">
              {it.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* -------------------- LearningPath -------------------- */

export type LearningPathStep = { title: string; description?: string };

export function LearningPath({
  steps,
  title = "Learning Pathway",
  className,
}: {
  steps: LearningPathStep[];
  title?: string;
  className?: string;
}) {
  if (!steps?.length) return null;
  return (
    <section className={cn("", className)} aria-label={title}>
      <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
        {title}
      </div>
      <ol className="relative border-l border-border/70 pl-6 space-y-6">
        {steps.map((s, i) => (
          <li key={i} className="relative">
            <span
              aria-hidden
              className="absolute -left-[31px] top-1.5 grid place-items-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
            >
              {i + 1}
            </span>
            <h4 className="font-display font-semibold text-lg leading-tight">
              {s.title}
            </h4>
            {s.description ? (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {s.description}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

/* -------------------- GlossaryLink -------------------- */

/**
 * Optional inline link to a glossary entry. Renders as regular text
 * with a subtle underline; does not interrupt reading flow.
 */
export function GlossaryLink({
  slug,
  children,
  className,
}: {
  slug: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/glossary/$slug"
      params={{ slug }}
      className={cn(
        "underline decoration-dotted decoration-muted-foreground/40 underline-offset-4 hover:decoration-primary hover:text-primary transition-colors",
        className,
      )}
    >
      {children}
    </Link>
  );
}
