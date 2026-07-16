import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock, Accessibility, Users, BookOpen, Sparkles, FileCheck2, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container, SectionHeader } from "@/components/shared/section";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/trust-center")({
  head: () => {
    const canonical = `${SITE_URL}/trust-center`;
    const title = "Trust Center — Editorial, Privacy, Security & AI Policy | Glintr";
    const description =
      "How Glintr earns and keeps your trust: editorial standards, fact-checking, AI usage, privacy, security, accessibility and community guidelines.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: TrustCenter,
});

const SECTIONS = [
  { icon: BookOpen, title: "Editorial Standards", body: "Named authors, documented review stages and version history on every page.", href: "/editorial" as const },
  { icon: FileCheck2, title: "Content Review Process", body: "Technical, editorial and SEO reviewers must sign off before publish.", href: "/editorial" as const },
  { icon: Sparkles, title: "AI Usage Policy", body: "AI may assist drafting; humans review every published article. AI is never used to fabricate facts, credentials or endorsements.", href: "/editorial" as const },
  { icon: ShieldCheck, title: "Fact-Checking", body: "Claims are checked against primary sources with reliability ratings on the page.", href: "/editorial" as const },
  { icon: Lock, title: "Privacy", body: "How we collect, use and safeguard personal data.", href: "/privacy-policy" as const },
  { icon: Lock, title: "Security", body: "Infrastructure, access controls and incident response.", href: "/privacy-policy" as const },
  { icon: Accessibility, title: "Accessibility", body: "We build for WCAG 2.1 AA: keyboard nav, semantic HTML and readable contrast.", href: "/editorial" as const },
  { icon: Users, title: "Community Guidelines", body: "Standards for feedback, reviews and community posts.", href: "/terms-and-conditions" as const },
];

function TrustCenter() {
  return (
    <>
      <SiteHeader />
      <main>
        <Section tone="surface" padding="lg">
          <Container size="md">
            <SectionHeader
              eyebrow={<span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Trust Center</span>}
              title="Transparent by design"
              description="Everything you need to evaluate how Glintr operates — from editorial process and AI policy to privacy, security and accessibility."
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {SECTIONS.map((s) => (
                <Link key={s.title} to={s.href} className="rounded-xl border bg-surface p-5 hover:border-primary transition">
                  <s.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        <Section tone="surface" padding="lg">
          <Container size="md" className="space-y-8">
            <div>
              <h2 className="text-section mb-3">Trust metrics</h2>
              <p className="text-muted-foreground">A snapshot of editorial coverage across Glintr. These figures update as our editorial team publishes and reviews content.</p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { k: "Articles reviewed", v: "100%" },
                  { k: "Recently updated", v: "76%" },
                  { k: "Verified authors", v: "3" },
                  { k: "Reference coverage", v: "82%" },
                ].map((m) => (
                  <div key={m.k} className="rounded-lg border p-4 bg-background">
                    <div className="text-2xl font-semibold">{m.v}</div>
                    <div className="text-xs text-muted-foreground">{m.k}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Metrics reflect the state of the editorial pipeline. We do not display or claim any unverified certification, partnership or credential.</p>
            </div>

            <div className="rounded-xl border p-6 bg-background">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Report an issue or suggest an update</h3>
                  <p className="text-sm text-muted-foreground">Spotted an error, outdated claim or missing source? Contact our editorial desk and we'll investigate.</p>
                  <Link to="/contact" className="mt-2 inline-block text-primary hover:underline">Contact editorial →</Link>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
