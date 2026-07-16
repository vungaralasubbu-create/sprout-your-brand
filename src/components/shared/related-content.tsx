import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getGlossaryEntry } from "@/data/glossary";
import { BLOG_TITLES } from "@/data/program-editorial";
import { EntityCard } from "./entity-card";

interface RelatedContentProps {
  glossarySlugs?: string[];
  programSlugs?: string[];
  blogSlugs?: string[];
  comparisonSlugs?: string[];
  pathSlugs?: string[];
  title?: string;
}

function toTitle(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Related Content Engine. Renders whichever knowledge-graph
 * connections are supplied. Skips empty sections silently.
 */
export function RelatedContent({
  glossarySlugs = [],
  programSlugs = [],
  blogSlugs = [],
  comparisonSlugs = [],
  pathSlugs = [],
  title = "Related knowledge",
}: RelatedContentProps) {
  const entries = glossarySlugs
    .map((s) => getGlossaryEntry(s))
    .filter((x): x is NonNullable<typeof x> => !!x);

  const hasAny =
    entries.length ||
    programSlugs.length ||
    blogSlugs.length ||
    comparisonSlugs.length ||
    pathSlugs.length;
  if (!hasAny) return null;

  return (
    <section aria-label={title} className="space-y-8">
      <div className="text-caption font-mono uppercase tracking-widest text-primary">
        {title}
      </div>

      {entries.length ? (
        <div>
          <h3 className="font-display font-semibold text-xl mb-3">
            Glossary
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {entries.slice(0, 6).map((e) => (
              <EntityCard key={e.slug} entry={e} />
            ))}
          </div>
        </div>
      ) : null}

      {pathSlugs.length ? (
        <div>
          <h3 className="font-display font-semibold text-xl mb-3">
            Learning paths
          </h3>
          <ul className="space-y-2">
            {pathSlugs.map((s) => (
              <li key={s}>
                <Link
                  to="/learning-paths/$slug"
                  params={{ slug: s }}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  {toTitle(s)} learning path <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {comparisonSlugs.length ? (
        <div>
          <h3 className="font-display font-semibold text-xl mb-3">
            Comparisons
          </h3>
          <ul className="space-y-2">
            {comparisonSlugs.map((s) => (
              <li key={s}>
                <Link
                  to="/compare/$slug"
                  params={{ slug: s }}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  {toTitle(s)} <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {programSlugs.length ? (
        <div>
          <h3 className="font-display font-semibold text-xl mb-3">
            Programs
          </h3>
          <ul className="space-y-2">
            {programSlugs.map((slug) => (
              <li key={slug}>
                <a href="/programs" className="text-primary hover:underline">
                  {toTitle(slug)} →
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {blogSlugs.length ? (
        <div>
          <h3 className="font-display font-semibold text-xl mb-3">
            Articles
          </h3>
          <ul className="space-y-2">
            {blogSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug }}
                  className="text-primary hover:underline"
                >
                  {BLOG_TITLES[slug] ?? toTitle(slug)} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
