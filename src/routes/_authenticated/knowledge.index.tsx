import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FileText, Globe, Package, HelpCircle, Upload, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOverview, searchKnowledge } from "@/lib/knowledge/knowledge.functions";

export const Route = createFileRoute("/_authenticated/knowledge/")({
  component: Overview,
});

function Overview() {
  const [q, setQ] = useState("");
  const get = useServerFn(getOverview);
  const sk = useServerFn(searchKnowledge);
  const ov = useQuery({ queryKey: ["kn-overview"], queryFn: () => get({}) });
  const sm = useMutation({ mutationFn: () => sk({ data: { query: q } }) });

  const c = ov.data?.counts ?? { documents: 0, sources: 0, products: 0, faqs: 0 };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-blue-500/10 p-8">
        <div className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
          <Sparkles className="h-3 w-3" /> Ask your AI brain
        </div>
        <div className="mt-4 flex max-w-2xl items-center gap-2 rounded-2xl border bg-background p-2 shadow-sm">
          <Search className="ml-2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && q.trim() && sm.mutate()}
            placeholder="How do refunds work? What is our premium package?"
            className="flex-1 bg-transparent px-1 py-2 text-sm outline-none" />
          <Button disabled={!q.trim() || sm.isPending} onClick={() => sm.mutate()}>
            {sm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
          </Button>
        </div>
        {sm.data && (
          <div className="mt-4 space-y-2">
            {sm.data.results.length === 0 ? (
              <div className="text-sm text-muted-foreground">No matches yet — upload documents to make your AI brain smarter.</div>
            ) : sm.data.results.map((r: any) => (
              <div key={r.id} className="rounded-xl border bg-background p-3">
                <div className="text-xs uppercase text-muted-foreground">{r.category}</div>
                <div className="font-medium">{r.title}</div>
                {r.summary && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.summary}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild><Link to="/knowledge/upload"><Upload className="mr-2 h-4 w-4" /> Upload files</Link></Button>
          <Button asChild variant="outline"><Link to="/knowledge/websites"><Globe className="mr-2 h-4 w-4" /> Import website</Link></Button>
          <Button asChild variant="outline"><Link to="/knowledge/documents">Browse documents</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={FileText} label="Documents" value={c.documents} to="/knowledge/documents" />
        <Tile icon={Globe} label="Sources" value={c.sources} to="/knowledge/websites" />
        <Tile icon={Package} label="Products" value={c.products} to="/knowledge/products" />
        <Tile icon={HelpCircle} label="FAQs" value={c.faqs} to="/knowledge/faq" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent documents" href="/knowledge/documents">
          {(ov.data?.recentDocs ?? []).length === 0 ? (
            <Empty>No documents yet.</Empty>
          ) : (ov.data?.recentDocs ?? []).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
              <div>
                <div className="font-medium">{d.title}</div>
                <div className="text-xs text-muted-foreground capitalize">{d.category}</div>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(d.updated_at).toLocaleDateString()}</span>
            </div>
          ))}
        </Card>
        <Card title="Recent sources" href="/knowledge/websites">
          {(ov.data?.recentSources ?? []).length === 0 ? (
            <Empty>No sources yet.</Empty>
          ) : (ov.data?.recentSources ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{s.kind} · {s.status}</div>
              </div>
              <span className="text-xs text-muted-foreground">{s.last_synced_at ? new Date(s.last_synced_at).toLocaleDateString() : "—"}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to} className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Link>
  );
}
function Card({ title, href, children }: any) {
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="text-sm font-semibold">{title}</div>
        <Link to={href} className="text-xs font-medium text-primary hover:underline">View all →</Link>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
function Empty({ children }: any) {
  return <div className="py-8 text-center text-sm text-muted-foreground">{children}</div>;
}
