import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { KnowledgeGraphVisual } from "@/components/shared/knowledge-graph-visual";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/knowledge-graph")({
  head: () => {
    const canonical = `${SITE_URL}/knowledge-graph`;
    const title = "Knowledge Graph — How Topics Connect | Glintr";
    const description =
      "An interactive map of the Glintr knowledge graph — programs, skills, technologies and concepts and how they relate to one another.";
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
  component: KnowledgeGraphPage,
});

function KnowledgeGraphPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-10">
          <Container className="max-w-4xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Knowledge graph</span>
            </nav>
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-3">
              Knowledge graph
            </div>
            <h1 className="font-display font-semibold text-balance tracking-[-0.02em] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02]">
              How every topic on Glintr connects.
            </h1>
            <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
              An interactive map of the ideas we teach — concepts,
              technologies and skills, and the paths between them. Hover a
              node to preview it, click to open the full glossary entry.
            </p>
          </Container>
        </Section>

        <Section className="pb-24">
          <Container className="max-w-5xl">
            <KnowledgeGraphVisual />
            <p className="mt-6 text-sm text-muted-foreground">
              Prefer text? Browse the full{" "}
              <Link to="/glossary" className="text-primary hover:underline">
                glossary
              </Link>{" "}
              or follow a{" "}
              <Link to="/learning-paths" className="text-primary hover:underline">
                learning path
              </Link>
              .
            </p>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
