import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicCareerPages } from "@/lib/admin/career-hub.functions";
import { CAREER_HUB_TYPES, CAREER_PATH_TO_TYPE, type CareerHubTypeId } from "@/lib/career-hub/types";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/career-hub/$type")({
  beforeLoad: ({ params }) => {
    if (!CAREER_PATH_TO_TYPE[params.type]) throw notFound();
  },
  component: TypeIndex,
  head: ({ params }) => {
    const t = CAREER_HUB_TYPES.find((x) => x.path === params.type);
    const title = `${t?.label || "Career"} Guides | Glintr Career Hub`;
    const desc = `Browse ${t?.label.toLowerCase() || "career"} guides — ${t?.desc || "AI-curated career resources"} for India's tech workforce.`;
    const url = `https://glintr.com/career-hub/${params.type}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
});

function TypeIndex() {
  const { type } = Route.useParams();
  const typeId = CAREER_PATH_TO_TYPE[type] as CareerHubTypeId;
  const meta = CAREER_HUB_TYPES.find((t) => t.id === typeId)!;
  const fn = useServerFn(listPublicCareerPages);
  const q = useQuery({
    queryKey: ["career-hub-type", typeId],
    queryFn: () => fn({ data: { page_type: typeId, limit: 200 } }),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 border-b bg-gradient-to-br from-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/career-hub" className="text-sm text-muted-foreground hover:text-primary">← All categories</Link>
          <div className="flex items-center gap-3 mt-3">
            <div className="text-5xl">{meta.emoji}</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{meta.label}</h1>
              <p className="text-muted-foreground mt-1">{meta.desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10">
        {q.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {q.data?.pages.length === 0 && <Card className="p-10 text-center text-muted-foreground">No pages published in this category yet.</Card>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {q.data?.pages.map((p: any) => (
            <Link key={p.slug} to="/career-hub/$type/$slug" params={{ type, slug: p.slug }}>
              <Card className="p-4 hover:border-primary hover:shadow-md transition h-full">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{p.hero_emoji || meta.emoji}</div>
                  <div>
                    <div className="font-semibold hover:text-primary">{p.title}</div>
                    {p.subtitle && <div className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{p.subtitle}</div>}
                    {p.category && <div className="text-xs text-primary mt-1">{p.category}</div>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
