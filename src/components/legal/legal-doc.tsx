import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Printer, BookOpen, Mail, ChevronDown } from "lucide-react";

import { Container } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export interface RelatedPolicy {
  label: string;
  href: string;
  description?: string;
}

interface LegalDocProps {
  eyebrow?: string;
  title: string;
  summary: string;
  lastUpdated?: string;
  sections: LegalSection[];
  related?: RelatedPolicy[];
  intro?: React.ReactNode;
  belowToc?: React.ReactNode;
}

export function LegalDoc({
  eyebrow = "Legal",
  title,
  summary,
  lastUpdated,
  sections,
  related,
  intro,
  belowToc,
}: LegalDocProps) {
  const [activeId, setActiveId] = React.useState(sections[0]?.id);
  const [tocOpen, setTocOpen] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <>
      <SiteHeader />
      <main className="bg-background legal-doc">
        {/* Header */}
        <section className="border-b border-border bg-surface print:bg-transparent print:border-none">
          <Container size="lg" className="py-12 md:py-20">
            <div className="max-w-3xl">
              <div className="text-label text-primary tracking-widest uppercase mb-4">
                {eyebrow}
              </div>
              <h1 className="text-display text-balance mb-5">{title}</h1>
              <p className="text-subheading text-muted-foreground text-pretty">{summary}</p>
              {lastUpdated ? (
                <p className="mt-6 text-caption">
                  <span className="font-medium text-foreground">Last Updated:</span>{" "}
                  <span className="text-muted-foreground">{lastUpdated}</span>
                </p>
              ) : null}
              <div className="mt-8 flex flex-wrap gap-3 print:hidden">
                <Button variant="outline" size="sm" asChild>
                  <a href={`#${sections[0]?.id ?? ""}`}>
                    <BookOpen className="mr-2 h-4 w-4" /> Read This Policy
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contact">
                    <Mail className="mr-2 h-4 w-4" /> Contact Glintr
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* Body */}
        <Container size="lg" className="py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
            {/* TOC */}
            <aside className="print:hidden">
              <div className="lg:sticky lg:top-24">
                {/* Mobile toggle */}
                <button
                  type="button"
                  onClick={() => setTocOpen((v) => !v)}
                  className="lg:hidden flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-label"
                  aria-expanded={tocOpen}
                  aria-controls="legal-toc"
                >
                  <span>On This Page</span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", tocOpen && "rotate-180")}
                  />
                </button>
                <nav
                  id="legal-toc"
                  aria-label="On this page"
                  className={cn(
                    "mt-3 lg:mt-0 lg:block",
                    tocOpen ? "block" : "hidden lg:block",
                  )}
                >
                  <div className="text-label text-muted-foreground mb-3 hidden lg:block">
                    On This Page
                  </div>
                  <ol className="space-y-1 text-sm">
                    {sections.map((s, i) => {
                      const active = activeId === s.id;
                      return (
                        <li key={s.id}>
                          <a
                            href={`#${s.id}`}
                            onClick={() => setTocOpen(false)}
                            className={cn(
                              "flex gap-2 rounded-md px-3 py-2 transition-colors",
                              "border-l-2 border-transparent",
                              active
                                ? "border-primary bg-surface text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-surface/60",
                            )}
                            aria-current={active ? "true" : undefined}
                          >
                            <span className="tabular-nums text-muted-foreground">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{s.title}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              </div>
            </aside>

            {/* Content */}
            <article className="max-w-[68ch] legal-prose">
              {intro ? <div className="mb-10">{intro}</div> : null}
              {belowToc}
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-24 py-8 border-b border-border last:border-none"
                >
                  <h2 className="text-title mb-4 flex items-baseline gap-3">
                    <span className="text-primary tabular-nums text-sm font-semibold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{s.title}</span>
                  </h2>
                  <div className="space-y-4 text-body text-muted-foreground">{s.body}</div>
                </section>
              ))}

              {/* Related */}
              {related && related.length ? (
                <section className="mt-12 print:hidden">
                  <h2 className="text-title mb-5">Related Policies</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {related.map((r) => (
                      <Link
                        key={r.href}
                        to={r.href}
                        className="block rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                      >
                        <div className="text-label text-foreground">{r.label}</div>
                        {r.description ? (
                          <p className="mt-1 text-caption">{r.description}</p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Contact */}
              <section className="mt-12 rounded-2xl border border-border bg-surface p-6 print:hidden">
                <h2 className="text-title mb-2">Questions About This Policy?</h2>
                <p className="text-body text-muted-foreground">
                  If you have questions about this policy or how it applies to your Glintr
                  experience, contact Glintr through the available support or contact
                  experience.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild size="sm">
                    <Link to="/contact">Contact Glintr</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/student-support">Student Support</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/partner-support">Partner Support</Link>
                  </Button>
                </div>
              </section>
            </article>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

/** Small utility components for legal pages */

export function LegalCallout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning";
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 my-4",
        tone === "info" && "border-primary/20 bg-primary/5",
        tone === "warning" && "border-amber-500/30 bg-amber-500/5",
      )}
    >
      {title ? <div className="text-label text-foreground mb-1">{title}</div> : null}
      <div className="text-body text-muted-foreground">{children}</div>
    </div>
  );
}

export function DefinitionList({
  items,
}: {
  items: { term: string; definition: React.ReactNode }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 my-4">
      {items.map((it) => (
        <div
          key={it.term}
          className="rounded-lg border border-border bg-surface p-4 transition-transform hover:-translate-y-0.5"
        >
          <dt className="text-label text-foreground">{it.term}</dt>
          <dd className="mt-1 text-caption text-muted-foreground">{it.definition}</dd>
        </div>
      ))}
    </dl>
  );
}
