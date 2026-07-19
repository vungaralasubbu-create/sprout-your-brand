/**
 * Programmatic SEO landing page — `/p/$slug`.
 *
 * Single route that serves any of the auto-generated pSEO pages
 * (city / state / online / roadmap / interview / salary / projects /
 * certification / faq / internship variants of every course).
 *
 * Fully SSR with dynamic head() populated from the DB row, self-referencing
 * canonical, article-style JSON-LD, breadcrumb JSON-LD, and FAQ JSON-LD
 * when the page has FAQ entries.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPseoPageBySlug } from "@/lib/pseo/pseo.functions";
import { buildSeo, SITE_ORIGIN } from "@/lib/seo/engine";
import { withHome } from "@/lib/seo/breadcrumbs";
import type { PseoPageWithRelations } from "@/lib/pseo/types";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const page = await getPseoPageBySlug({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.page;
    const path = `/p/${p.slug}`;
    const canonical = p.canonical_url ?? path;
    const breadcrumbs = withHome([
      { name: "Guides", path: "/p" },
      { name: p.h1 ?? p.title ?? p.slug, path },
    ]);

    const schemas: Array<Record<string, unknown>> = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.title ?? p.h1 ?? p.slug,
        description: p.meta_description ?? "",
        url: `${SITE_ORIGIN}${canonical}`,
        datePublished: p.published_at ?? undefined,
        dateModified: p.last_regenerated_at ?? p.updated_at,
        author: { "@type": "Organization", name: "Glintr" },
        publisher: { "@type": "Organization", name: "Glintr" },
      },
    ];
    if (p.content?.faqs?.length) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: p.content.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }

    return buildSeo({
      path: canonical,
      title: p.title ?? p.h1 ?? p.slug,
      description: p.meta_description ?? "",
      ogType: "article",
      breadcrumbs,
      schemas,
      keywords: p.keywords,
    });
  },
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-2xl font-semibold">Page unavailable</h1>
      <p className="mt-4 text-muted-foreground">{error.message}</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-4 text-muted-foreground">This guide is being written. Check back shortly.</p>
      <Link to="/" className="mt-6 inline-block underline">Go home</Link>
    </main>
  ),
  component: PseoPageView,
});

function PseoPageView() {
  const { page } = Route.useLoaderData() as { page: PseoPageWithRelations };
  const c = page.content ?? {};
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-6">
        <Link to="/">Home</Link> <span className="mx-1">/</span>
        <Link to="/programs">Programs</Link>
        {page.course ? (
          <>
            <span className="mx-1">/</span>
            <span>{page.course.name}</span>
          </>
        ) : null}
      </nav>

      <h1 className="text-4xl font-semibold tracking-tight">{page.h1 ?? page.title}</h1>
      {c.intro ? <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{c.intro}</p> : null}

      {c.stats?.length ? (
        <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/60 p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dt>
              <dd className="mt-2 text-lg font-medium">{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {c.sections?.map((s) => (
        <section key={s.heading} className="mt-12">
          <h2 className="text-2xl font-semibold">{s.heading}</h2>
          <p className="mt-4 leading-relaxed text-foreground/90">{s.body}</p>
        </section>
      ))}

      {c.faqs?.length ? (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            {c.faqs.map((f) => (
              <div key={f.question}>
                <h3 className="font-medium">{f.question}</h3>
                <p className="mt-2 text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {c.cta ? (
        <div className="mt-16 rounded-3xl border border-border/60 bg-muted/30 p-8">
          <a href={c.cta.href} className="inline-flex items-center rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">
            {c.cta.label} →
          </a>
        </div>
      ) : null}

      {page.interlinks?.length ? (
        <aside className="mt-16 border-t border-border/60 pt-10">
          <h2 className="text-lg font-semibold">Related guides</h2>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {page.interlinks.slice(0, 12).map((l) => (
              <li key={l.slug}>
                <a href={`/p/${l.slug}`} className="text-sm underline-offset-4 hover:underline">
                  {l.title ?? l.slug}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </main>
  );
}
