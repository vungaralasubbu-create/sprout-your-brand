import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ImageIcon, Sparkles } from "lucide-react";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProgramResources } from "@/lib/campus-ambassador/marketing.functions";

export const Route = createFileRoute("/_authenticated/ambassador/marketing-resources/programs/$slug")({
  head: () => ({
    meta: [
      { title: "Program Resources — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgramResourcesPage,
});

const GROUPS = [
  { key: "posters", label: "Posters", types: ["program_poster", "program_banner", "campaign_poster"] },
  { key: "socials", label: "Instagram Creatives", types: ["square_social", "portrait_social", "instagram_story"] },
  { key: "whatsapp", label: "WhatsApp", types: ["whatsapp_creative", "whatsapp_message"] },
  { key: "captions", label: "Captions & Copy", types: ["caption_instagram", "caption_linkedin", "short_copy", "story_text"] },
] as const;

function ProgramResourcesPage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getProgramResources);
  const q = useQuery({ queryKey: ["mkt-program", slug], queryFn: () => fn({ data: { slug } }) });

  if (q.isLoading) {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-6xl mx-auto space-y-4">
          <div className="h-8 w-64 bg-slate-100 rounded animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </AmbassadorShell>
    );
  }

  const d = q.data as any;
  if (d?.gate === "not_approved") {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto text-center">
          <Card className="p-6">Approved Campus Ambassadors only.</Card>
        </div>
      </AmbassadorShell>
    );
  }
  if (d?.gate === "not_found" || !d?.program) {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto text-center">
          <Card className="p-6">
            <div className="font-medium">Program Not Found</div>
            <Button asChild size="sm" className="mt-3">
              <Link to="/ambassador/marketing-resources">Back to Resources</Link>
            </Button>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  const program = d.program;
  const resources: any[] = d.resources || [];

  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <Link
          to="/ambassador/marketing-resources"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing Resources
        </Link>

        <div className="rounded-2xl border bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 flex items-center gap-4">
          {program.thumbnail_url ? (
            <img src={program.thumbnail_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-slate-400" />
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              {program.course_categories?.name}
            </div>
            <div className="font-display text-2xl font-semibold mt-0.5">{program.name}</div>
            <div className="text-xs text-slate-600 mt-1">{resources.length} approved resources</div>
          </div>
        </div>

        {resources.length === 0 && (
          <Card className="p-10 text-center">
            <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <div className="font-medium">No Resources Published Yet</div>
            <div className="text-xs text-slate-500 mt-1">
              Approved marketing resources for this program will appear here soon.
            </div>
          </Card>
        )}

        {GROUPS.map((g) => {
          const items = resources.filter((r) => g.types.includes(r.resource_type as any));
          if (items.length === 0) return null;
          return (
            <div key={g.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">{g.label}</div>
                <div className="text-xs text-slate-500">{items.length}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((r) => (
                  <MiniCard key={r.id} r={r} />
                ))}
              </div>
            </div>
          );
        })}

        <div className="pt-4 text-center">
          <Button asChild variant="outline">
            <Link to="/ambassador/marketing-resources">Explore All Resources</Link>
          </Button>
        </div>
      </div>
    </AmbassadorShell>
  );
}

function MiniCard({ r }: { r: any }) {
  const isText = ["caption_instagram", "caption_linkedin", "short_copy", "story_text", "whatsapp_message"].includes(r.resource_type);
  return (
    <Link
      to="/ambassador/marketing-resources"
      search={{ preview: r.id } as any}
      className="group block rounded-xl border bg-white overflow-hidden hover:shadow-md transition"
    >
      {isText ? (
        <div className="aspect-square bg-gradient-to-br from-slate-100 to-white p-3">
          <div className="text-[11px] text-slate-700 line-clamp-8 whitespace-pre-line">
            {r.caption_content || r.short_copy || r.share_message || r.title}
          </div>
        </div>
      ) : r.media_url || r.thumbnail_url ? (
        <div className="aspect-square bg-slate-100">
          <img src={r.thumbnail_url || r.media_url} alt={r.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-slate-300" />
        </div>
      )}
      <div className="p-2.5">
        <div className="font-medium text-xs line-clamp-1">{r.title}</div>
        {r.is_featured && (
          <Badge className="mt-1 bg-amber-100 text-amber-800 border-amber-200 text-[10px]">Featured</Badge>
        )}
      </div>
    </Link>
  );
}
