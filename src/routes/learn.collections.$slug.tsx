import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildPageHead } from "@/lib/seo-head";
import {
  articlesByCollection,
  articlesByTopic,
  collections,
  getCollection,
  topicsByCollection,
  type LearnCollectionSlug,
} from "@/data/learn";

export const Route = createFileRoute("/learn/collections/$slug")({
  head: ({ params }) => {
    const c = collections.find((x) => x.slug === params.slug);
    if (!c) {
      return buildPageHead({
        path: `/learn/collections/${params.slug}`,
        title: "Collection not found | Glintr Learn",
        description: "The collection you were looking for is not available.",
        noindex: true,
      });
    }
    return buildPageHead({
      path: `/learn/collections/${c.slug}`,
      title: `${c.name} | Glintr Learn`,
      description: c.description,
    });
  },
  component: CollectionHub,
});

function CollectionHub() {
  const { slug } = Route.useParams();
  const collection = getCollection(slug);
  if (!collection) throw notFound();

  const collectionSlug = collection.slug as LearnCollectionSlug;
  const topics = topicsByCollection(collectionSlug);
  const guides = articlesByCollection(collectionSlug);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        Learning Collection
      </p>
      <h1 className="text-balance text-4xl font-black tracking-tight md:text-5xl">
        {collection.name}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{collection.overview}</p>

      <section className="mt-14">
        <h2 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
          Topics in this collection
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {topics.map((t) => {
            const related = articlesByTopic(t.slug);
            const first = related[0];
            return (
              <Link
                key={t.slug}
                to={first ? "/learn/$slug" : "/learn/topics"}
                params={first ? { slug: first.slug } : undefined}
                hash={first ? undefined : t.slug}
                className="group rounded-2xl border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <t.icon className="size-4" />
                </div>
                <p className="mt-3 text-sm font-semibold">{t.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.tagline}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
          Guides in this collection
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.slug}
              to="/learn/$slug"
              params={{ slug: g.slug }}
              className="group flex flex-col rounded-2xl border bg-background p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <Badge variant="secondary" className="rounded-full">
                  {g.level}
                </Badge>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {g.readingMinutes} min
                </span>
              </div>
              <p className="text-lg font-black tracking-tight">{g.title}</p>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{g.subtitle}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Read guide <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
          {guides.length === 0 ? (
            <p className="text-sm text-muted-foreground">More guides landing here soon.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
