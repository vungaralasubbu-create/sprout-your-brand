import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Compass, GitCompare, GraduationCap } from "lucide-react";

interface Props {
  categorySlug?: string;
  courseSlug?: string;
}

/**
 * End-of-program discovery block. Prevents dead ends: sends visitors to
 * related programs, learning paths, glossary, comparisons, blogs and
 * consultation.
 */
export function ProgramDiscoveryFooter({ categorySlug }: Props) {
  const category = categorySlug ?? "computer-science";
  const cards = [
    {
      icon: GraduationCap,
      title: "Similar programs",
      desc: "Explore the full learning family for this domain.",
      to: `/programs/${category}`,
    },
    {
      icon: Compass,
      title: "Recommended learning path",
      desc: "See how this fits into a structured journey.",
      to: "/learning-paths",
    },
    {
      icon: BookOpen,
      title: "Related reading",
      desc: "Editorial guides and glossary explainers.",
      to: "/blog",
    },
    {
      icon: GitCompare,
      title: "Compare with alternatives",
      desc: "Side-by-side breakdown of closely related topics.",
      to: "/compare",
    },
  ] as const;

  return (
    <section aria-labelledby="program-discovery-heading" className="mt-12">
      <h2 id="program-discovery-heading" className="text-xl font-black text-foreground md:text-2xl">
        Keep exploring
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Not sure this is the right fit? Here are the next best places to look.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.title}
            to={c.to}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/40"
          >
            <c.icon className="size-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold text-foreground">{c.title}</p>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
            <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="size-3" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
