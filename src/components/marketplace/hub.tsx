/**
 * Glintr App Store & AI Agent Marketplace — admin UI surface.
 * Composed sections rendered inside the admin marketplace route.
 */

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AGENT_WORKFLOWS,
  AI_AGENTS,
  APP_CATEGORIES,
  MARKETPLACE_APPS,
  findAgent,
  findApp,
  type AiAgent,
  type AppCategory,
  type AppPermission,
  type MarketplaceApp,
} from "@/lib/marketplace/catalog";
import {
  addReview,
  disableAgent,
  enableAgent,
  installApp,
  listReviews,
  toggleApp,
  uninstallApp,
  updateAppPermissions,
  useMarketplaceAgents,
  useMarketplaceApps,
  useMarketplaceAudit,
} from "@/lib/marketplace/storage";

function LucideByName({ name, className }: { name: string; className?: string }) {
  const Comp = (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Package;
  return <Comp className={className} />;
}

function StarRating({ value, size = 12 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Icons.Star
            key={i}
            style={{ width: size, height: size }}
            className={filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
          />
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// App Store
// ---------------------------------------------------------------------------

interface AppCardProps {
  app: MarketplaceApp;
  installed?: boolean;
  enabled?: boolean;
  onOpen: () => void;
}

function AppCard({ app, installed, enabled, onOpen }: AppCardProps) {
  return (
    <Card
      className="relative flex cursor-pointer flex-col overflow-hidden border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-lg"
      onClick={onOpen}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl"
        style={{ background: app.color }}
      />
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ background: app.color }}
        >
          <LucideByName name={app.icon} className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {app.featured && <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-500">Featured</Badge>}
          {app.popular && <Badge variant="outline">Popular</Badge>}
          {app.publisher === "Glintr" && <Badge variant="outline">Official</Badge>}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-base font-semibold text-foreground">{app.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{app.tagline}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <StarRating value={app.rating} />
          <span>{app.rating.toFixed(1)}</span>
          <span className="text-muted-foreground/60">({app.reviews})</span>
        </span>
        <span className="flex items-center gap-1">
          <Icons.Download className="h-3.5 w-3.5" /> {app.downloads.toLocaleString()}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {app.category}
        </Badge>
        {installed ? (
          <Badge className={cn("text-[10px]", enabled ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground")}>
            {enabled ? "Installed" : "Disabled"}
          </Badge>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">{app.pricing}</span>
        )}
      </div>
    </Card>
  );
}

function AppDetailsDialog({ app, onClose }: { app: MarketplaceApp | null; onClose: () => void }) {
  const apps = useMarketplaceApps();
  const state = app ? apps[app.id] : undefined;
  const [review, setReview] = useState({ body: "", rating: 5 });
  const [pendingPermissions, setPendingPermissions] = useState<AppPermission[] | null>(null);
  if (!app) return null;

  const reviews = listReviews(app.id);
  const isInstalled = !!state?.installed;
  const isEnabled = !!state?.enabled;

  const grantedPermissions = pendingPermissions ?? state?.permissionsGranted ?? [];
  const togglePermission = (p: AppPermission) => {
    const base = pendingPermissions ?? state?.permissionsGranted ?? [];
    const next = base.includes(p) ? base.filter((x) => x !== p) : [...base, p];
    setPendingPermissions(next);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: app.color }}>
              <LucideByName name={app.icon} className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{app.name}</DialogTitle>
              <DialogDescription>{app.tagline}</DialogDescription>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>v{app.version}</span>
                <span>·</span>
                <span>{app.category}</span>
                <span>·</span>
                <span>{app.compatibility}</span>
                <span>·</span>
                <span>{app.pricing}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">{app.description}</p>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions requested</h4>
              <div className="flex flex-wrap gap-2">
                {app.permissions.map((p) => {
                  const on = grantedPermissions.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePermission(p)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs capitalize transition",
                        on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Icons.Shield className="mr-1 inline h-3 w-3" /> {p}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Admin approval required before installation. Toggle to review before granting.
              </p>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Version history</h4>
              <ul className="space-y-2 text-sm">
                {app.history.map((v) => (
                  <li key={v.version} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">v{v.version}</span>
                      <span className="text-xs text-muted-foreground">{new Date(v.releasedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{v.notes}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reviews ({reviews.length})
              </h4>
              <div className="space-y-3">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.author}</span>
                      <StarRating value={r.rating} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-xs text-muted-foreground">Be the first to review.</p>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Your rating</label>
                  <select
                    value={review.rating}
                    onChange={(e) => setReview((s) => ({ ...s, rating: Number(e.target.value) }))}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} ★</option>
                    ))}
                  </select>
                </div>
                <Textarea
                  placeholder="Share what worked and what didn't…"
                  value={review.body}
                  onChange={(e) => setReview((s) => ({ ...s, body: e.target.value }))}
                  className="min-h-[70px] text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!review.body.trim()) return;
                    addReview({ appId: app.id, rating: review.rating, author: "You", body: review.body.trim() });
                    setReview({ body: "", rating: 5 });
                  }}
                >
                  Post review
                </Button>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Rating</div>
              <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                <StarRating value={app.rating} size={16} />
                <span>{app.rating.toFixed(1)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Downloads</div>
                  <div className="font-medium">{app.downloads.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Reviews</div>
                  <div className="font-medium">{app.reviews.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last update</div>
                  <div className="font-medium">{new Date(app.releasedAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Publisher</div>
                  <div className="font-medium">{app.publisher}</div>
                </div>
              </div>
            </Card>

            {isInstalled ? (
              <div className="space-y-2">
                <Button
                  variant={isEnabled ? "outline" : "primary"}
                  block
                  onClick={() => toggleApp(app.id, !isEnabled)}
                >
                  {isEnabled ? "Disable app" : "Enable app"}
                </Button>
                <Button
                  variant="outline"
                  block
                  onClick={() => {
                    if (pendingPermissions) {
                      updateAppPermissions(app.id, pendingPermissions);
                      setPendingPermissions(null);
                    }
                  }}
                  disabled={!pendingPermissions}
                >
                  Save permissions
                </Button>
                <Button variant="danger" block onClick={() => uninstallApp(app.id)}>
                  Uninstall
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                block
                onClick={() => installApp(app.id, app.version, grantedPermissions.length ? grantedPermissions : app.permissions)}
              >
                <Icons.Download className="mr-2 h-4 w-4" /> Install app
              </Button>
            )}

            {app.docsUrl && (
              <a
                href={app.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-primary hover:underline"
              >
                <Icons.BookOpen className="h-3.5 w-3.5" /> Documentation
              </a>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AppStore() {
  const apps = useMarketplaceApps();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AppCategory | "All">("All");
  const [sort, setSort] = useState<"featured" | "popular" | "recent">("featured");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = MARKETPLACE_APPS.filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.name.toLowerCase().includes(q) &&
          !a.tagline.toLowerCase().includes(q) &&
          !a.description.toLowerCase().includes(q) &&
          !a.category.toLowerCase().includes(q) &&
          !a.publisher.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
    if (sort === "featured") list = [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.rating - a.rating);
    if (sort === "popular") list = [...list].sort((a, b) => b.downloads - a.downloads);
    if (sort === "recent") list = [...list].sort((a, b) => +new Date(b.releasedAt) - +new Date(a.releasedAt));
    return list;
  }, [search, category, sort]);

  const installed = MARKETPLACE_APPS.filter((a) => apps[a.id]?.installed);
  const featured = MARKETPLACE_APPS.filter((a) => a.featured);
  const popular = [...MARKETPLACE_APPS].sort((a, b) => b.downloads - a.downloads).slice(0, 6);
  const recent = [...MARKETPLACE_APPS].sort((a, b) => +new Date(b.releasedAt) - +new Date(a.releasedAt)).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Search + filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Icons.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps, functions, developers…"
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as AppCategory | "All")}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="All">All categories</option>
          {APP_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="featured">Featured</option>
          <option value="popular">Most installed</option>
          <option value="recent">Recently added</option>
        </select>
      </div>

      {/* Curated rails when no search */}
      {!search && category === "All" && (
        <>
          <Section title="Featured apps" subtitle="Handpicked for education businesses">
            <Grid>
              {featured.map((a) => (
                <AppCard key={a.id} app={a} installed={apps[a.id]?.installed} enabled={apps[a.id]?.enabled} onOpen={() => setSelectedId(a.id)} />
              ))}
            </Grid>
          </Section>

          <Section title="Popular apps" subtitle="Most installed across academies">
            <Grid>
              {popular.map((a) => (
                <AppCard key={a.id} app={a} installed={apps[a.id]?.installed} enabled={apps[a.id]?.enabled} onOpen={() => setSelectedId(a.id)} />
              ))}
            </Grid>
          </Section>

          <Section title="Recently added">
            <Grid>
              {recent.map((a) => (
                <AppCard key={a.id} app={a} installed={apps[a.id]?.installed} enabled={apps[a.id]?.enabled} onOpen={() => setSelectedId(a.id)} />
              ))}
            </Grid>
          </Section>

          {installed.length > 0 && (
            <Section title="Installed on this brand" subtitle="Enable, disable or manage permissions">
              <Grid>
                {installed.map((a) => (
                  <AppCard key={a.id} app={a} installed enabled={apps[a.id]?.enabled} onOpen={() => setSelectedId(a.id)} />
                ))}
              </Grid>
            </Section>
          )}
        </>
      )}

      {/* Full grid when filtering */}
      {(search || category !== "All") && (
        <Section title={`Results (${filtered.length})`}>
          <Grid>
            {filtered.map((a) => (
              <AppCard key={a.id} app={a} installed={apps[a.id]?.installed} enabled={apps[a.id]?.enabled} onOpen={() => setSelectedId(a.id)} />
            ))}
          </Grid>
        </Section>
      )}

      <AppDetailsDialog app={selectedId ? findApp(selectedId) ?? null : null} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Agent Store
// ---------------------------------------------------------------------------

function AgentCard({ agent, onOpen, enabled }: { agent: AiAgent; onOpen: () => void; enabled?: boolean }) {
  return (
    <Card className="cursor-pointer overflow-hidden border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-lg" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: agent.color }}>
          <LucideByName name={agent.icon} className="h-5 w-5" />
        </div>
        {enabled ? <Badge className="bg-emerald-500/15 text-emerald-500">Active</Badge> : agent.featured ? <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-500">Featured</Badge> : agent.popular ? <Badge variant="outline">Popular</Badge> : null}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{agent.name}</h3>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{agent.role}</p>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{agent.purpose}</p>
      <div className="mt-4 flex flex-wrap gap-1">
        {agent.tools.slice(0, 3).map((t) => (
          <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
        ))}
        {agent.tools.length > 3 && <Badge variant="outline" className="text-[10px]">+{agent.tools.length - 3}</Badge>}
      </div>
    </Card>
  );
}

function AgentDetailsDialog({ agent, onClose }: { agent: AiAgent | null; onClose: () => void }) {
  const agents = useMarketplaceAgents();
  if (!agent) return null;
  const state = agents[agent.id];
  const enabled = !!state?.enabled;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: agent.color }}>
              <LucideByName name={agent.icon} className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{agent.name}</DialogTitle>
              <DialogDescription>{agent.role} · {agent.category}</DialogDescription>
              <p className="mt-2 text-sm text-muted-foreground">{agent.purpose}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tools</h4>
            <div className="flex flex-wrap gap-1">
              {agent.tools.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </section>
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Knowledge</h4>
            <ul className="space-y-1 text-sm">
              {agent.knowledge.map((k) => (
                <li key={k} className="flex items-center gap-2 text-muted-foreground">
                  <Icons.BookOpen className="h-3.5 w-3.5" /> {k}
                </li>
              ))}
            </ul>
          </section>
          <section className="md:col-span-2">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</h4>
            <div className="flex flex-wrap gap-1">
              {agent.permissions.map((p) => (
                <Badge key={p} variant="outline" className="text-xs capitalize"><Icons.Shield className="mr-1 h-3 w-3" />{p}</Badge>
              ))}
            </div>
          </section>

          {state && (
            <section className="md:col-span-2 grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/20 p-3 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Conversations</div>
                <div className="text-lg font-semibold">{state.conversations}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Actions run</div>
                <div className="text-lg font-semibold">{state.actionsRun}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Time saved</div>
                <div className="text-lg font-semibold">{state.timeSavedMinutes} min</div>
              </div>
            </section>
          )}
        </div>

        <DialogFooter>
          {enabled ? (
            <Button variant="outline" onClick={() => disableAgent(agent.id)}>Deactivate</Button>
          ) : (
            <Button variant="primary" onClick={() => enableAgent(agent.id)}>
              <Icons.Sparkles className="mr-2 h-4 w-4" /> Activate agent
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AgentStore() {
  const agents = useMarketplaceAgents();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AppCategory | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return AI_AGENTS.filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.name.toLowerCase().includes(q) &&
          !a.role.toLowerCase().includes(q) &&
          !a.purpose.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [search, category]);

  const active = AI_AGENTS.filter((a) => agents[a.id]?.enabled);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Icons.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents by role or purpose…" className="pl-9" />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as AppCategory | "All")}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="All">All categories</option>
          {APP_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {active.length > 0 && (
        <Section title={`Active agents (${active.length})`} subtitle="Running for the current brand">
          <Grid>
            {active.map((a) => (
              <AgentCard key={a.id} agent={a} enabled onOpen={() => setSelectedId(a.id)} />
            ))}
          </Grid>
        </Section>
      )}

      <Section title={search || category !== "All" ? `Results (${filtered.length})` : "All AI agents"}>
        <Grid>
          {filtered.map((a) => (
            <AgentCard key={a.id} agent={a} enabled={agents[a.id]?.enabled} onOpen={() => setSelectedId(a.id)} />
          ))}
        </Grid>
      </Section>

      <AgentDetailsDialog agent={selectedId ? findAgent(selectedId) ?? null : null} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

export function WorkflowsHub() {
  const agents = useMarketplaceAgents();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Multi-agent workflows</h2>
        <p className="text-sm text-muted-foreground">
          Chain agents together to run recurring outcomes hands-off. Activate the required agents first.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {AGENT_WORKFLOWS.map((wf) => {
          const missing = wf.agents.filter((id) => !agents[id]?.enabled);
          return (
            <Card key={wf.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{wf.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{wf.description}</p>
                </div>
                <Badge variant="outline">{wf.category}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                {wf.agents.map((id, i) => {
                  const agent = findAgent(id);
                  if (!agent) return null;
                  const enabled = agents[id]?.enabled;
                  return (
                    <span key={id} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                          enabled ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        <LucideByName name={agent.icon} className="h-3 w-3" />
                        {agent.name}
                      </span>
                      {i < wf.agents.length - 1 && <Icons.ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </span>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground"><Icons.Target className="mr-1 inline h-3 w-3" />{wf.outcome}</p>
                <Button
                  size="sm"
                  variant={missing.length ? "outline" : "primary"}
                  disabled={missing.length > 0}
                >
                  {missing.length ? `Activate ${missing.length} agent${missing.length > 1 ? "s" : ""}` : "Run workflow"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export function MarketplaceAnalytics() {
  const apps = useMarketplaceApps();
  const agents = useMarketplaceAgents();
  const audit = useMarketplaceAudit();

  const installed = Object.values(apps).filter((s) => s.installed);
  const enabled = installed.filter((s) => s.enabled);
  const activeAgents = Object.values(agents).filter((s) => s.enabled);
  const timeSaved = Object.values(agents).reduce((n, s) => n + (s.timeSavedMinutes || 0), 0);
  const automations = audit.filter((e) => e.kind === "workflow-run").length;

  const mostUsedApps = [...MARKETPLACE_APPS]
    .filter((a) => apps[a.id]?.installed)
    .sort((a, b) => (apps[b.id]?.usage ?? 0) - (apps[a.id]?.usage ?? 0))
    .slice(0, 5);

  const stats: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: "Installed apps", value: String(installed.length), icon: Icons.Package },
    { label: "Enabled apps", value: String(enabled.length), icon: Icons.Zap },
    { label: "Active AI agents", value: String(activeAgents.length), icon: Icons.Sparkles },
    { label: "Automations run", value: String(automations), icon: Icons.Workflow },
    { label: "Time saved", value: `${timeSaved} min`, icon: Icons.Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{s.value}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-base font-semibold">Most used apps</h3>
          <p className="text-xs text-muted-foreground">Ranked by usage counter in this brand.</p>
          <div className="mt-3 space-y-2">
            {mostUsedApps.length === 0 && <p className="text-sm text-muted-foreground">Install apps to see usage here.</p>}
            {mostUsedApps.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: a.color }}>
                    <LucideByName name={a.icon} className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">{a.name}</div>
                </div>
                <span className="text-xs text-muted-foreground">{apps[a.id]?.usage ?? 0} runs</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold">Audit log</h3>
          <p className="text-xs text-muted-foreground">Last 20 marketplace events for this brand.</p>
          <div className="mt-3 max-h-80 space-y-1.5 overflow-y-auto text-xs">
            {audit.length === 0 && <p className="text-muted-foreground">No activity yet.</p>}
            {audit.slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-1.5">
                <span className="capitalize">
                  <Badge variant="outline" className="mr-2 text-[10px]">{e.kind.replace("-", " ")}</Badge>
                  {e.target}
                </span>
                <span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Developer Center (submissions preview)
// ---------------------------------------------------------------------------

export function DeveloperCenter() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6">
        <h3 className="text-lg font-semibold">Publish an app or AI agent</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Build extensions on top of Glintr. Submit your app with logo, screenshots, documentation and permission
          scopes for review. Approved apps are listed in the Glintr Marketplace and available to all academy partners.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="sm"><Icons.Plus className="mr-1 h-4 w-4" /> Create app</Button>
          <Button variant="outline" size="sm"><Icons.Bot className="mr-1 h-4 w-4" /> Create AI agent</Button>
          <Button variant="ghost" size="sm"><Icons.BookOpen className="mr-1 h-4 w-4" /> Developer docs</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "Submission checklist", icon: Icons.ListChecks, items: ["Logo (512px)", "3-5 screenshots", "Description & tagline", "Docs URL", "Requested permissions", "Pricing model"] },
          { title: "Review timeline", icon: Icons.Clock, items: ["Draft", "Under review (3-5 days)", "Approved / Changes requested", "Published"] },
          { title: "Publisher benefits", icon: Icons.Sparkles, items: ["70/30 revenue split", "Listed in official store", "Multi-brand distribution", "Marketplace analytics"] },
        ].map((block) => {
          const Icon = block.icon;
          return (
            <Card key={block.title} className="p-5">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">{block.title}</h4>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {block.items.map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {i}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
