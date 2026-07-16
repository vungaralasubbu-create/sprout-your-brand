import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileCheck2, ClipboardList, Users, Sparkles, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container, SectionHeader } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { REVIEW_STAGES } from "@/data/editorial";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/editorial")({
  head: () => {
    const canonical = `${SITE_URL}/editorial`;
    const title = "Editorial Standards & Review Process | Glintr";
    const description =
      "How Glintr writes, reviews, updates and fact-checks every learning guide, program and glossary entry. Read our full editorial and AI-usage policy.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: EditorialPage,
});

const STAGES = [
  { name: "Draft", desc: "Author writes the first version against a briefing and outline." },
  { name: "Technical Review", desc: "Subject-matter reviewer verifies technical accuracy and examples." },
  { name: "Editorial Review", desc: "Editor checks clarity, structure, tone and reading level." },
  { name: "SEO Review", desc: "SEO reviewer validates metadata, structure and internal links." },
  { name: "Legal Review", desc: "Only for regulated topics — verifies claims and compliance." },
  { name: "Approved", desc: "All required reviews signed off; ready for scheduled publish." },
  { name: "Published", desc: "Live on glintr.com with version, date and reviewer credited." },
];

function EditorialPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Section tone="surface" padding="lg">
          <Container size="md">
            <SectionHeader
              eyebrow={<span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Editorial Standards</span>}
              title="How Glintr publishes, reviews and maintains content"
              description="Every learning guide, program page and glossary entry passes a documented review workflow. Nothing goes live without a named editor and reviewer."
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="md" className="space-y-12">
            <section>
              <h2 className="text-section mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Review workflow</h2>
              <ol className="space-y-3">
                {STAGES.map((s, i) => (
                  <li key={s.name} className="rounded-lg border p-4 flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold shrink-0">{i + 1}</div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground mt-3">Supported stages: {REVIEW_STAGES.join(" · ")}</p>
            </section>

            <section>
              <h2 className="text-section mb-4 flex items-center gap-2"><FileCheck2 className="h-5 w-5" /> Fact-checking</h2>
              <p className="text-muted-foreground">
                Reviewers verify factual claims against primary sources. Unsupported claims are removed or reworded before publish.
                Every article carries its references, publisher and reliability rating on the page.
              </p>
            </section>

            <section>
              <h2 className="text-section mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5" /> AI usage policy</h2>
              <p className="text-muted-foreground">
                Glintr may use AI tools to draft outlines, structure examples and suggest edits. Every AI-assisted article is reviewed by a human editor
                before publication and carries an "AI Assisted" badge. AI is never used to fabricate credentials, endorsements, partnerships or statistics.
              </p>
            </section>

            <section>
              <h2 className="text-section mb-4 flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Updates & corrections</h2>
              <p className="text-muted-foreground">
                Every page shows its published date, last-updated date and version. Substantive updates are recorded in the on-page changelog
                with a reason. Corrections can be requested via any article's feedback tool.
              </p>
            </section>

            <section>
              <h2 className="text-section mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Roles</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {["Author", "Technical Reviewer", "SEO Reviewer", "Content Editor", "Administrator"].map((r) => (
                  <div key={r} className="rounded-lg border p-4">
                    <Badge>{r}</Badge>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link to="/authors" className="text-primary hover:underline">Meet the editorial team →</Link>
              </p>
            </section>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
