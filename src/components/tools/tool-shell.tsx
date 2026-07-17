import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { RelatedContent } from "@/components/shared/related-content";
import type { ToolEntry } from "@/data/tools";
import { cn } from "@/lib/utils";
import { openGlintrAI } from "@/lib/glintr-ai";

interface ToolShellProps {
  tool: ToolEntry;
  children: React.ReactNode;
  aside?: React.ReactNode;
  aiPrompt?: string;
}

export function ToolShell({ tool, children, aside, aiPrompt }: ToolShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <Section tone="surface" padding="md">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/tools" className="hover:text-foreground">Tools</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{tool.title}</span>
          </nav>

          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-caption">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {tool.category}
              </span>
              <h1 className={cn("mt-3 text-4xl font-black tracking-tight md:text-5xl bg-clip-text text-transparent bg-gradient-to-br", tool.accent)}>
                {tool.title}
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{tool.description}</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section padding="lg">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">{children}</div>
            <aside className="space-y-6">
              {aside}
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Ask GlintrAI
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Not sure how to use these results? Ask GlintrAI for a
                  plain-language walkthrough and next-step program suggestions.
                </p>
                {aiPrompt ? (
                  <p className="mt-3 rounded-lg bg-background p-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Try:</span> {aiPrompt}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => openGlintrAI({ prompt: aiPrompt, source: `tool:${tool.slug}` })}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Ask GlintrAI
                </button>
              </div>


              {(tool.relatedGlossary?.length || tool.relatedPrograms?.length || tool.relatedPaths?.length) ? (
                <RelatedContent
                  glossarySlugs={tool.relatedGlossary}
                  programSlugs={tool.relatedPrograms}
                  pathSlugs={tool.relatedPaths}
                  title="Related on Glintr"
                />
              ) : null}

              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">More tools</div>
                <div className="mt-3 space-y-2 text-sm">
                  <Link to="/tools" className="block hover:text-primary">All Tools →</Link>
                  <Link to="/find-your-program" className="block hover:text-primary">Find Your Program →</Link>
                  <Link to="/compare" className="block hover:text-primary">Compare Programs →</Link>
                  <Link to="/glossary" className="block hover:text-primary">Glossary →</Link>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}

export function ToolCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
      {footer ? <div className="mt-6 border-t border-border pt-4">{footer}</div> : null}
    </div>
  );
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
      {children}
    </label>
  );
}

export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
      {children}
    </p>
  );
}
