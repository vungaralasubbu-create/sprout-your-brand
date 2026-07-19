import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import {
  getThread, replyToThread, toggleReaction, votePoll, rsvpEvent, acceptAnswer,
} from "@/lib/community/community.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowUp, Calendar, CheckCircle2, HelpCircle, Lock, MapPin, MessageSquare, Video } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/community/$space/$slug")({
  loader: async ({ params, context }) => {
    const res = await context.queryClient.ensureQueryData({
      queryKey: ["community-thread", params.space, params.slug],
      queryFn: () => getThread({ data: { space_slug: params.space, slug: params.slug } }),
      staleTime: 30_000,
    });
    if (!res) throw notFound();
    return res;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const { thread, space } = loaderData as any;
    const url = `https://glintr.com/community/${params.space}/${params.slug}`;
    const title = thread.seo_title || `${thread.title} — Glintr Community`;
    const description = thread.seo_description || thread.excerpt || `${space.name} discussion on Glintr.`;
    const jsonLd: any = {
      "@context": "https://schema.org",
      "@type": "DiscussionForumPosting",
      headline: thread.title,
      articleBody: thread.body_md,
      url,
      datePublished: thread.created_at,
      dateModified: thread.updated_at,
      interactionStatistic: [
        { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: thread.post_count },
        { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: thread.upvote_count },
      ],
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: ThreadPage,
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <h1 className="text-2xl font-bold">Thread not found</h1>
      <Button asChild className="mt-4"><Link to="/community">Back to community</Link></Button>
    </div>
  ),
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
});

function ThreadPage() {
  const initial = Route.useLoaderData() as any;
  const { space: spaceSlug, slug } = Route.useParams();
  const qc = useQueryClient();
  const [session, setSession] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [pollChoice, setPollChoice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const q = useQuery({
    queryKey: ["community-thread", spaceSlug, slug],
    queryFn: () => getThread({ data: { space_slug: spaceSlug, slug } }),
    initialData: initial,
    staleTime: 15_000,
  });

  // Realtime: refresh on new posts / reactions
  useEffect(() => {
    if (!q.data?.thread?.id) return;
    const threadId = q.data.thread.id;
    const ch = supabase
      .channel(`community-thread-${threadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts", filter: `thread_id=eq.${threadId}` }, () => {
        qc.invalidateQueries({ queryKey: ["community-thread", spaceSlug, slug] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_reactions" }, () => {
        qc.invalidateQueries({ queryKey: ["community-thread", spaceSlug, slug] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_poll_votes", filter: `thread_id=eq.${threadId}` }, () => {
        qc.invalidateQueries({ queryKey: ["community-thread", spaceSlug, slug] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [q.data?.thread?.id, spaceSlug, slug, qc]);

  const replyFn = useServerFn(replyToThread);
  const reactFn = useServerFn(toggleReaction);
  const voteFn = useServerFn(votePoll);
  const rsvpFn = useServerFn(rsvpEvent);
  const acceptFn = useServerFn(acceptAnswer);

  const mReply = useMutation({
    mutationFn: () => replyFn({ data: { thread_id: q.data!.thread.id, body_md: reply } }),
    onSuccess: (r) => {
      toast[r.moderation.status === "approved" ? "success" : "info"](
        r.moderation.status === "approved" ? "Reply posted" : "Reply queued for moderation",
      );
      setReply("");
      qc.invalidateQueries({ queryKey: ["community-thread", spaceSlug, slug] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const mReact = useMutation({
    mutationFn: (v: { type: "thread" | "post"; id: string }) =>
      reactFn({ data: { target_type: v.type, target_id: v.id, reaction: "upvote" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community-thread", spaceSlug, slug] }),
    onError: (e: any) => toast.error(e.message),
  });
  const mVote = useMutation({
    mutationFn: (option_id: string) => voteFn({ data: { thread_id: q.data!.thread.id, option_id } }),
    onSuccess: () => { toast.success("Vote recorded"); qc.invalidateQueries({ queryKey: ["community-thread", spaceSlug, slug] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const mRsvp = useMutation({
    mutationFn: (status: "going" | "maybe" | "declined") => rsvpFn({ data: { thread_id: q.data!.thread.id, status } }),
    onSuccess: () => { toast.success("RSVP saved"); qc.invalidateQueries({ queryKey: ["community-thread", spaceSlug, slug] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const mAccept = useMutation({
    mutationFn: (post_id: string) => acceptFn({ data: { thread_id: q.data!.thread.id, post_id } }),
    onSuccess: () => { toast.success("Answer accepted"); qc.invalidateQueries({ queryKey: ["community-thread", spaceSlug, slug] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const data = q.data;
  if (!data) return <div className="p-8">Loading…</div>;
  const { thread, space, posts, pollOptions, event, author } = data as any;
  const isAuthor = session?.user?.id === thread.author_id;
  const totalPollVotes = (pollOptions ?? []).reduce((s: number, o: any) => s + (o.vote_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
            <Link to="/community" className="hover:text-primary">Community</Link>
            <span>/</span>
            <Link to="/community/$space" params={{ space: spaceSlug }} className="hover:text-primary">{space.name}</Link>
          </div>
          <div className="flex items-start gap-3">
            {thread.kind === "question" && <HelpCircle className="w-6 h-6 text-amber-500 mt-1" />}
            {thread.kind === "announcement" && <Badge variant="info">Announcement</Badge>}
            {thread.kind === "event" && <Calendar className="w-6 h-6 text-emerald-500 mt-1" />}
            <h1 className="text-2xl md:text-4xl font-bold flex-1">{thread.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Posted by {author?.display_name || "a Glintr member"}</span>
            <span>·</span>
            <span>{new Date(thread.created_at).toLocaleString()}</span>
            <span>·</span>
            <span>{thread.view_count} views</span>
            {thread.is_locked && <Badge variant="warning"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>}
            {thread.tags?.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Button size="icon" variant="ghost" disabled={!session} onClick={() => mReact.mutate({ type: "thread", id: thread.id })} title="Upvote">
                <ArrowUp className="w-5 h-5" />
              </Button>
              <div className="text-lg font-bold">{thread.upvote_count}</div>
            </div>
            <div className="prose prose-neutral dark:prose-invert max-w-none flex-1">
              <ReactMarkdown>{thread.body_md || "*(no description)*"}</ReactMarkdown>
            </div>
          </div>
        </Card>

        {/* Poll */}
        {thread.kind === "poll" && pollOptions.length > 0 && (
          <Card className="p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">Poll · {totalPollVotes} votes</h2>
            <div className="space-y-2">
              {pollOptions.map((o: any) => {
                const pct = totalPollVotes ? Math.round((o.vote_count / totalPollVotes) * 100) : 0;
                const active = pollChoice === o.id;
                return (
                  <button key={o.id} onClick={() => { if (session) { setPollChoice(o.id); mVote.mutate(o.id); } else toast.error("Sign in to vote"); }}
                    className={`w-full text-left border rounded-lg p-3 relative overflow-hidden hover:border-primary transition ${active ? "border-primary" : ""}`}>
                    <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center justify-between">
                      <span className="font-medium">{o.label}</span>
                      <span className="text-xs text-muted-foreground">{o.vote_count} · {pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Event */}
        {thread.kind === "event" && event && (
          <Card className="p-5 border-emerald-500/40">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">Event</div>
                <div className="text-lg font-bold mt-1">{new Date(event.starts_at).toLocaleString()}</div>
                {event.ends_at && <div className="text-xs text-muted-foreground">until {new Date(event.ends_at).toLocaleString()}</div>}
                <div className="mt-2 text-sm flex items-center gap-1">
                  {event.is_online ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  {event.is_online ? "Online" : event.location}
                </div>
                {event.join_url && <a href={event.join_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">Join link</a>}
              </div>
              <div className="flex flex-col justify-center gap-2">
                <div className="text-sm">{event.attendee_count} going</div>
                <div className="flex gap-2">
                  {(["going", "maybe", "declined"] as const).map((s) => (
                    <Button key={s} size="sm" variant="outline" disabled={!session} onClick={() => mRsvp.mutate(s)}>{s}</Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Replies */}
        <section>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> {posts.length} {thread.kind === "question" ? "answers" : "replies"}
          </h2>
          <div className="space-y-3">
            {posts.map((p: any) => (
              <Card key={p.id} className={`p-4 ${p.is_accepted ? "border-emerald-500/60 bg-emerald-500/5" : ""}`}>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" disabled={!session} onClick={() => mReact.mutate({ type: "post", id: p.id })}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <div className="text-sm font-semibold">{p.upvote_count}</div>
                    {p.is_accepted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      {p.author?.display_name || "Glintr member"} · Lv {p.author?.level ?? 1} · {new Date(p.created_at).toLocaleString()}
                    </div>
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                      <ReactMarkdown>{p.body_md}</ReactMarkdown>
                    </div>
                    {thread.kind === "question" && isAuthor && !p.is_accepted && (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => mAccept.mutate(p.id)}>
                        Mark as accepted answer
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {posts.length === 0 && (
              <Card className="p-6 text-center text-muted-foreground">No replies yet. Be the first!</Card>
            )}
          </div>
        </section>

        {/* Reply composer */}
        <section>
          {session ? (
            <Card className="p-4">
              <Textarea
                rows={5}
                placeholder={thread.kind === "question" ? "Share your answer (markdown supported)…" : "Write a reply…"}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={thread.is_locked}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-muted-foreground">Markdown supported · AI moderation runs automatically</div>
                <Button disabled={reply.trim().length < 2 || mReply.isPending || thread.is_locked} onClick={() => mReply.mutate()}>
                  {mReply.isPending ? "Posting…" : thread.kind === "question" ? "Post answer" : "Reply"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <div className="font-semibold">Sign in to join the conversation</div>
              <p className="text-sm text-muted-foreground mt-1">Ask questions, share wins, and earn reputation.</p>
              <Button asChild className="mt-3"><Link to="/auth">Sign in</Link></Button>
            </Card>
          )}
        </section>

        <div className="pt-4 border-t">
          <Link to="/community/$space" params={{ space: spaceSlug }} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to {space.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
