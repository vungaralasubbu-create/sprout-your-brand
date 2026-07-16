import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft, Globe, Clock } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { getAuthor, listAuthors } from "@/data/authors";

const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/authors/$slug")({
  loader: ({ params }) => {
    const author = getAuthor(params.slug);
    if (!author) throw notFound();
    return author;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Author not found" }, { name: "robots", content: "noindex" }] };
    }
    const canonical = `${SITE_URL}/authors/${loaderData.slug}`;
    const title = `${loaderData.name} — ${loaderData.title} | Glintr`;
    const description = loaderData.bio.slice(0, 160);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "profile" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: loaderData.name,
            jobTitle: loaderData.title,
            description: loaderData.bio,
            url: canonical,
            knowsAbout: loaderData.expertise,
            knowsLanguage: loaderData.languages,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <>
      <SiteHeader />
      <Section padding="lg"><Container><h1 className="text-hero">Author not found</h1><Link to="/authors" className="text-primary">← Back to authors</Link></Container></Section>
      <SiteFooter />
    </>
  ),
  errorComponent: () => (
    <>
      <SiteHeader />
      <Section padding="lg"><Container><h1 className="text-hero">Something went wrong</h1></Container></Section>
      <SiteFooter />
    </>
  ),
  component: AuthorProfilePage,
});

function AuthorProfilePage() {
  const a = Route.useLoaderData();
  return (
    <>
      <SiteHeader />
      <main>
        <Section tone="surface" padding="lg">
          <Container>
            <Link to="/authors" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> All authors
            </Link>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gradient-brand text-primary-foreground grid place-items-center text-3xl font-semibold shrink-0">
                {a.photoInitials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-hero">{a.name}</h1>
                  {a.verified && (
                    <span className="inline-flex items-center gap-1 text-primary text-sm">
                      <ShieldCheck className="h-4 w-4" /> Verified editor
                    </span>
                  )}
                </div>
                <p className="text-subheading">{a.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.roles.map((r) => <Badge key={r} variant="muted">{r}</Badge>)}
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-section mb-3">Biography</h2>
                  <p className="text-pretty text-muted-foreground">{a.bio}</p>
                </section>
                <section>
                  <h2 className="text-section mb-3">Areas of expertise</h2>
                  <div className="flex flex-wrap gap-2">
                    {a.expertise.map((e) => <Badge key={e}>{e}</Badge>)}
                  </div>
                </section>
                <section>
                  <h2 className="text-section mb-3">Contributions</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ContribBlock title="Programs" items={a.contributions.programs} />
                    <ContribBlock title="Learn Guides" items={a.contributions.learnGuides} />
                    <ContribBlock title="Blog posts" items={a.contributions.blogs} />
                    <ContribBlock title="Glossary entries" items={a.contributions.glossary} />
                  </div>
                </section>
                <section>
                  <h2 className="text-section mb-3">Editorial reviews</h2>
                  <p className="text-muted-foreground text-sm">
                    Every article credited above has passed technical, editorial and SEO review before publication. Review dates appear on each article page.
                  </p>
                </section>
              </div>
              <aside className="space-y-4">
                <div className="rounded-lg border p-5 text-sm space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Last active</div>
                  <div className="font-medium">{a.lastActive}</div>
                </div>
                <div className="rounded-lg border p-5 text-sm space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> Languages</div>
                  <div className="font-medium">{a.languages.join(", ")}</div>
                </div>
                {a.yearsExperience !== undefined && (
                  <div className="rounded-lg border p-5 text-sm space-y-2">
                    <div className="text-muted-foreground">Verified experience</div>
                    <div className="font-medium">{a.yearsExperience}+ years</div>
                  </div>
                )}
                <div className="rounded-lg border p-5 text-sm">
                  <div className="text-muted-foreground mb-2">Related topics</div>
                  <div className="flex flex-wrap gap-1.5">
                    {a.expertise.slice(0, 6).map((e) => <Badge key={e} variant="muted">{e}</Badge>)}
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </Section>

        <Section tone="surface" padding="lg">
          <Container>
            <h2 className="text-section mb-6">Other editors</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {listAuthors().filter((x) => x.slug !== a.slug).map((o) => (
                <Link key={o.slug} to="/authors/$slug" params={{ slug: o.slug }} className="rounded-lg border p-4 hover:border-primary transition">
                  <div className="font-medium">{o.name}</div>
                  <div className="text-sm text-muted-foreground">{o.title}</div>
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

function ContribBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm font-medium mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">No published items yet.</div>
      ) : (
        <ul className="text-sm text-muted-foreground space-y-1">
          {items.map((i) => <li key={i} className="truncate">• {i}</li>)}
        </ul>
      )}
    </div>
  );
}
