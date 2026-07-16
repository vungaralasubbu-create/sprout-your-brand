import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container, SectionHeader } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { listAuthors } from "@/data/authors";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/authors/")({
  head: () => {
    const canonical = `${SITE_URL}/authors`;
    const title = "Authors & Editors — Glintr Editorial Team";
    const description =
      "Meet the verified authors, technical reviewers and editors who create and maintain every learning guide, program and glossary entry on Glintr.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            url: canonical,
            about: listAuthors().map((a) => ({
              "@type": "Person",
              name: a.name,
              jobTitle: a.title,
              url: `${SITE_URL}/authors/${a.slug}`,
            })),
          }),
        },
      ],
    };
  },
  component: AuthorsPage,
});

function AuthorsPage() {
  const authors = listAuthors();
  return (
    <>
      <SiteHeader />
      <main>
        <Section tone="surface" padding="lg">
          <Container>
            <SectionHeader
              eyebrow={<span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Editorial Team</span>}
              title="Authors, reviewers and editors"
              description="Every article on Glintr is written, reviewed and maintained by named editors. Search the directory to see who created and reviewed the content you're reading."
            />
          </Container>
        </Section>
        <Section padding="lg">
          <Container>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {authors.map((a) => (
                <Link
                  key={a.slug}
                  to="/authors/$slug"
                  params={{ slug: a.slug }}
                  className="group rounded-xl border bg-surface p-6 hover:border-primary transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-brand text-primary-foreground grid place-items-center text-lg font-semibold">
                      {a.photoInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold truncate">{a.name}</h2>
                        {a.verified && <ShieldCheck className="h-4 w-4 text-primary" aria-label="Verified" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{a.title}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{a.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {a.expertise.slice(0, 4).map((e) => (
                      <Badge key={e} variant="muted">{e}</Badge>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
