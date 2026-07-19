import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSpaces, listThreads, listUpcomingEvents, listLeaderboard } from "@/lib/community/community.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, HelpCircle, Vote, Megaphone, Calendar, Users, Trophy, ArrowRight, Sparkles, Search } from "lucide-react";
import { useState } from "react";

const KIND_META: Record<string, { icon: any; label: string; color: string }> = {
  discussion: { icon: MessageSquare, label: "Discussion", color: "text-primary" },
  question: { icon: HelpCircle, label: "Question", color: "text-amber-500" },
  poll: { icon: Vote, label: "Poll", color: "text-fuchsia-500" },
  announcement: { icon: Megaphone, label: "Announcement", color: "text-cyan-500" },
  event: { icon: Calendar, label: "Event", color: "text-emerald-500" },
};

export const Route = createFileRoute("/community/")({
  component: CommunityIndex,
  head: () => {
    const title = "Glintr Community — Discussions, Q&A, Events for Learners & Partners";
    const desc = "Join the Glintr community. Ask questions, share wins, join events, and level up your career with students, mentors, and sales partners.";
    const url = "https://glintr.com/community";
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

function CommunityIndex() {
  const spacesFn = useServerFn(listSpaces);
  const threadsFn = useServerFn(listThreads);
  const eventsFn = useServerFn(listUpcomingEvents);
  const leadersFn = useServerFn(listLeaderboard);
  const [q, setQ] = useState("");

  const spaces = useQuery({ queryKey: ["community-spaces"], queryFn: () => spacesFn(), staleTime: 60_000 });
  const latest = useQuery({
    queryKey: ["community-latest", q],
    queryFn: () => threadsFn({ data: { sort: "latest", limit: 12, q: q || undefined, offset: 0 } }),
    staleTime: 30_000,
  });
  const events = useQuery({ queryKey: ["community-events"], queryFn: () => eventsFn(), staleTime: 60_000 });
  const leaders = useQuery({ queryKey: ["community-leaders"], queryFn: () => leadersFn(), staleTime: 60_000 });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/60 backdrop-blur text-xs mb-4">
            <Sparkles className="w-3 h-3 text-primary" /> AI-moderated · Real-time · Open to the web
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            The <span className="text-primary">Glintr Community</span> — where learners, partners, and mentors build together.
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
            Ask questions, share wins, run polls, join live events, and earn reputation. Every public discussion is Google-indexable.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button size="lg" asChild><Link to="/community/new">Start a Discussion <ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the community…"
                className="pl-9 pr-4 py-2 rounded-md border bg-background w-72 max-w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-[1fr_320px] gap-8">
        <main className="space-y-10">
          {/* Spaces */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Spaces</h2>
              <div className="text-xs text-muted-foreground">{spaces.data?.spaces.length ?? 0} active</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {spaces.data?.spaces.map((s: any) => (
                <Link key={s.id} to="/community/$space" params={{ space: s.slug }}
                  className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition group bg-card">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{s.icon || "💬"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold group-hover:text-primary truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{s.description}</div>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Badge variant="outline">{s.thread_count} threads</Badge>
                        {s.audience !== "public" && <Badge variant="info">{s.audience.replace("_", " ")}</Badge>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Latest */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Latest activity</h2>
              <Link to="/community/$space" params={{ space: "general" }} className="text-sm text-primary hover:underline">Browse all →</Link>
            </div>
            <div className="space-y-2">
              {latest.isLoading && <div className="text-muted-foreground text-sm">Loading…</div>}
              {latest.data?.threads.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  No discussions yet. <Link to="/community/new" className="text-primary underline">Be the first</Link>.
                </Card>
              )}
              {latest.data?.threads.map((t: any) => {
                const kind = KIND_META[t.kind] || KIND_META.discussion;
                const KindIcon = kind.icon;
                const spaceSlug = spaces.data?.spaces.find((s: any) => s.id === t.space_id)?.slug || "general";
                return (
                  <Link key={t.id} to="/community/$space/$slug" params={{ space: spaceSlug, slug: t.slug }}>
                    <Card className="p-4 hover:border-primary hover:shadow-sm transition flex items-start gap-3">
                      <KindIcon className={`w-5 h-5 mt-0.5 shrink-0 ${kind.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold hover:text-primary line-clamp-2">{t.title}</div>
                        {t.excerpt && <div className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{t.excerpt}</div>}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{kind.label}</span>
                          <span>·</span>
                          <span>{t.post_count} replies</span>
                          <span>·</span>
                          <span>{t.upvote_count} upvotes</span>
                          {t.tags?.slice(0, 3).map((tag: string) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>

        <aside className="space-y-8 lg:sticky lg:top-20 self-start">
          {/* Upcoming events */}
          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-emerald-500" /> Upcoming events</h3>
            {events.data?.events.length === 0 && <div className="text-xs text-muted-foreground">No events scheduled.</div>}
            <div className="space-y-2">
              {events.data?.events.slice(0, 5).map((e: any) => (
                <Link key={e.thread_id} to="/community/$space/$slug" params={{ space: e.space_slug || "events", slug: e.thread.slug }}
                  className="block p-2 rounded hover:bg-muted transition">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {new Date(e.starts_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                  <div className="text-sm font-medium line-clamp-2">{e.thread.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{e.is_online ? "Online" : e.location} · {e.attendee_count} going</div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-amber-500" /> Top contributors</h3>
            <ol className="space-y-2">
              {leaders.data?.leaders.slice(0, 8).map((u: any, i: number) => (
                <li key={u.user_id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-xs text-muted-foreground">#{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                    {(u.display_name || "Glintr")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{u.display_name || "Glintr member"}</div>
                    <div className="text-[10px] text-muted-foreground">Lv. {u.level} · {u.points} pts</div>
                  </div>
                </li>
              ))}
              {leaders.data?.leaders.length === 0 && <li className="text-xs text-muted-foreground">Be the first to earn reputation.</li>}
            </ol>
          </Card>

          {/* Community stats */}
          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-primary" /> Community rules</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Be kind, specific, and helpful.</li>
              <li>No spam, self-promo, or personal attacks.</li>
              <li>Mark answers as accepted to earn reputation.</li>
              <li>AI moderation runs on every post.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
