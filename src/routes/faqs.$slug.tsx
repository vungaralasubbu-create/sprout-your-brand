import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getFaqBySlug, type FaqAnswer } from "@/lib/faqs/faqs.functions";

export const Route = createFileRoute("/faqs/$slug")({
  loader: async ({ params }) => {
    const res = await getFaqBySlug({ data: { slug: params.slug } });
    if (!res.faq) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Answer Not Available | Glintr Help" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const q = loaderData.faq!.question;
    const desc = loaderData.faq!.short_answer.slice(0, 155);
    return {
      meta: [
        { title: `${q} | Glintr Help` },
        { name: "description", content: desc },
        { property: "og:title", content: `${q} | Glintr Help` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: `https://glintr.com/faqs/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: loaderData.faq!.full_answer,
                },
              },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: FaqNotFound,
  component: FaqDetailPage,
});

function FaqNotFound() {
  return (
    <Section className="py-20">
      <Container size="md">
        <Card className="p-10 text-center">
          <h1 className="font-display text-3xl font-semibold">Answer Not Available</h1>
          <p className="mt-2 text-muted-foreground">
            This FAQ may have been updated or is no longer published.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild variant="gradient">
              <Link to="/faqs">Back To FAQs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact" search={{ intent: "general", source: "faq_detail_missing" }}>
                Ask Glintr AI Support
              </Link>
            </Button>
          </div>
        </Card>
      </Container>
    </Section>
  );
}

function FaqDetailPage() {
  const { faq, related, category } = Route.useLoaderData();
  if (!faq) return null;
  return (
    <div className="bg-background">
      <Section className="pt-14 pb-6">
        <Container size="md">
          <Link
            to="/faqs"
            search={category ? { category: category.slug } : undefined}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to Smart FAQs
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {category && <Badge variant="muted">{category.name}</Badge>}
            <Badge variant="outline" className="gap-1.5">
              <Sparkles className="size-3.5" /> Approved Glintr answer
            </Badge>
          </div>
          <h1 className="mt-4 font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            {faq.question}
          </h1>
        </Container>
      </Section>
      <Section className="py-6">
        <Container size="md">
          <Card className="p-8">
            <p className="text-lg text-foreground/90 leading-relaxed text-pretty">
              {faq.short_answer}
            </p>
            <div className="mt-6 whitespace-pre-line text-muted-foreground leading-relaxed">
              {faq.full_answer}
            </div>
            {faq.action_href && faq.action_label && (
              <div className="mt-6">
                <Button asChild variant="gradient">
                  <Link to={faq.action_href as any}>
                    {faq.action_label} <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            )}
          </Card>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link
                to="/contact"
                search={{
                  intent: "general",
                  q: faq.question,
                  source: "faq_detail",
                  faq: [faq.slug],
                }}
              >
                Ask Glintr AI Support
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/faqs">Browse More Questions</Link>
            </Button>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="py-10 border-t border-border/60">
          <Container size="md">
            <p className="text-label mb-4">Related Questions</p>
            <div className="grid gap-3">
              {related.map((r: FaqAnswer) => (
                <Link
                  key={r.slug}
                  to="/faqs/$slug"
                  params={{ slug: r.slug }}
                  className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary-soft/20 transition-colors"
                >
                  <div>
                    <p className="font-medium">{r.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {r.short_answer}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </div>
  );
}
