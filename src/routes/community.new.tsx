import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listSpaces, createThread } from "@/lib/community/community.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ space: z.string().optional() });

export const Route = createFileRoute("/community/new")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Start a Discussion — Glintr Community" },
      { name: "description", content: "Start a discussion, ask a question, run a poll, or schedule an event in the Glintr community." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewThreadPage,
});

function NewThreadPage() {
  const navigate = useNavigate();
  const { space: initialSpace } = Route.useSearch();
  const [session, setSession] = useState<any>(null);
  const [kind, setKind] = useState<"discussion" | "question" | "poll" | "event">("discussion");
  const [spaceSlug, setSpaceSlug] = useState(initialSpace || "general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [eventStarts, setEventStarts] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth", search: { redirect: "/community/new" } as any });
      } else {
        setSession(data.session);
      }
    });
  }, [navigate]);

  const spacesFn = useServerFn(listSpaces);
  const spaces = useQuery({ queryKey: ["community-spaces-form"], queryFn: () => spacesFn(), staleTime: 60_000 });
  const createFn = useServerFn(createThread);
  const m = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          space_slug: spaceSlug,
          kind,
          title,
          body_md: body,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          poll_options: kind === "poll" ? pollOptions.filter((o) => o.trim().length > 0) : undefined,
          event:
            kind === "event"
              ? {
                  starts_at: new Date(eventStarts).toISOString(),
                  location: eventLocation || undefined,
                  join_url: eventUrl || undefined,
                  is_online: isOnline,
                }
              : undefined,
        },
      }),
    onSuccess: (r) => {
      if (r.moderation.status === "approved") {
        toast.success("Posted!");
        navigate({ to: "/community/$space/$slug", params: { space: r.space.slug, slug: r.thread.slug } });
      } else {
        toast.info(`Submitted — ${r.moderation.status === "pending" ? "queued for moderation review" : "hidden by moderation"}`);
        navigate({ to: "/community/$space", params: { space: r.space.slug } });
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!session) return <div className="p-8">Checking session…</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Start a new thread</h1>
        <p className="text-muted-foreground mt-1">All posts run through AI moderation. Be helpful, specific, and kind.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
          {(["discussion", "question", "poll", "event"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)}
              className={`p-3 rounded-lg border text-left capitalize transition ${kind === k ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
              <div className="font-semibold">{k}</div>
              <div className="text-xs text-muted-foreground">
                {k === "discussion" && "Share thoughts / start a conversation"}
                {k === "question" && "Get answers from the community"}
                {k === "poll" && "Ask people to vote"}
                {k === "event" && "Schedule a live meetup"}
              </div>
            </button>
          ))}
        </div>

        <Card className="p-5 mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Space</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2 bg-background text-sm" value={spaceSlug} onChange={(e) => setSpaceSlug(e.target.value)}>
              {spaces.data?.spaces.map((s: any) => (
                <option key={s.id} value={s.slug}>{s.icon} {s.name} {s.audience !== "public" ? `(${s.audience.replace("_", " ")})` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Be specific and clear (min 6 characters)" maxLength={180} />
          </div>

          <div>
            <label className="text-sm font-medium">Body {kind === "poll" ? "(optional)" : ""}</label>
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)}
              placeholder={kind === "question" ? "Explain your question with context, what you've tried, and what you expect." : "Write in Markdown…"} />
          </div>

          <div>
            <label className="text-sm font-medium">Tags (comma separated, up to 6)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. python, career, react" />
            {tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6).map((t) => (
                  <Badge key={t} variant="outline">{t}</Badge>
                ))}
              </div>
            )}
          </div>

          {kind === "poll" && (
            <div>
              <label className="text-sm font-medium">Options</label>
              <div className="space-y-2 mt-1">
                {pollOptions.map((v, i) => (
                  <Input key={i} value={v} onChange={(e) => setPollOptions((prev) => prev.map((x, xi) => (xi === i ? e.target.value : x)))} placeholder={`Option ${i + 1}`} />
                ))}
              </div>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setPollOptions((p) => [...p, ""])} disabled={pollOptions.length >= 8}>
                + Add option
              </Button>
            </div>
          )}

          {kind === "event" && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Starts at</label>
                <Input type="datetime-local" value={eventStarts} onChange={(e) => setEventStarts(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Format</label>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant={isOnline ? "primary" : "outline"} onClick={() => setIsOnline(true)}>Online</Button>
                  <Button size="sm" variant={!isOnline ? "primary" : "outline"} onClick={() => setIsOnline(false)}>In person</Button>
                </div>
              </div>
              {isOnline ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Join URL</label>
                  <Input type="url" value={eventUrl} onChange={(e) => setEventUrl(e.target.value)} placeholder="https://meet.google.com/…" />
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Address or venue" />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              disabled={
                title.trim().length < 6 ||
                m.isPending ||
                (kind === "poll" && pollOptions.filter((o) => o.trim()).length < 2) ||
                (kind === "event" && !eventStarts)
              }
              onClick={() => m.mutate()}
            >
              {m.isPending ? "Posting…" : "Publish"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
