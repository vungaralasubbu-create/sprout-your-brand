import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Heart, Pencil, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { listMyTemplates } from "@/lib/templates/templates.functions";
import { TemplateCard } from "@/components/templates/template-card";

export const Route = createFileRoute("/_authenticated/my-templates")({
  component: MyTemplatesPage,
});

const TABS = [
  { key: "created", label: "Created", icon: Pencil },
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "used", label: "Recently used", icon: Clock },
] as const;

function MyTemplatesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("created");
  const get = useServerFn(listMyTemplates);
  const q = useQuery({ queryKey: ["my-templates"], queryFn: () => get({}) });

  const created = q.data?.created ?? [];
  const favorites = (q.data?.favorited ?? []).map((f: any) => f.tpl_templates).filter(Boolean);
  const used = q.data?.used ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">My Templates</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your template library</h1>
          <p className="mt-1 text-sm text-muted-foreground">Templates you've created, saved, or used.</p>
        </div>
        <Button asChild><Link to="/template-builder"><Sparkles className="mr-2 h-4 w-4" /> New template</Link></Button>
      </div>

      <div className="mt-6 flex items-center gap-1 border-b pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "created" && (
          <TemplateList list={created} emptyText="You haven't created any templates yet." emptyCta="Create your first template" ctaTo="/template-builder" />
        )}
        {tab === "favorites" && (
          <TemplateList list={favorites} emptyText="No favorites yet. Save templates from the marketplace." emptyCta="Browse marketplace" ctaTo="/templates" />
        )}
        {tab === "used" && (
          used.length === 0 ? (
            <EmptyState text="You haven't generated projects from templates yet." cta="Browse templates" to="/templates" />
          ) : (
            <div className="rounded-2xl border bg-card">
              <div className="divide-y">
                {used.map((u: any) => (
                  <div key={u.project_id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                        {u.tpl_templates?.cover_image_url ? (
                          <img src={u.tpl_templates.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><Sparkles className="h-4 w-4 text-primary/40" /></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{u.tpl_templates?.title ?? "Template"}</div>
                        <div className="text-xs text-muted-foreground">Generated {new Date(u.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    {u.project_id ? (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/workspace/project/$projectId" params={{ projectId: u.project_id }}>Open project</Link>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TemplateList({ list, emptyText, emptyCta, ctaTo }: { list: any[]; emptyText: string; emptyCta: string; ctaTo: string }) {
  if (list.length === 0) return <EmptyState text={emptyText} cta={emptyCta} to={ctaTo} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {list.map((t: any) => <TemplateCard key={t.id} t={t} />)}
    </div>
  );
}

function EmptyState({ text, cta, to }: { text: string; cta: string; to: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
      <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-4"><Link to={to as any}>{cta}</Link></Button>
    </div>
  );
}
