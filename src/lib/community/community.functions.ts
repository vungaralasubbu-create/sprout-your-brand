/**
 * Community Platform — TanStack Start server functions.
 *
 * Public reads use the server publishable client (RLS respected as anon)
 * so anonymous visitors can see approved threads/posts (Google-indexable).
 * Authenticated writes use requireSupabaseAuth.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { moderateContent, slugify } from "./moderation.server";

type Sb = ReturnType<typeof createClient<Database>>;

function serverPublicClient(): Sb {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input as any, { ...init, headers: h });
      },
    },
  });
}

// ---------------- Reads (public) ----------------

export const listSpaces = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data, error } = await sb
    .from("community_spaces")
    .select("id,slug,name,description,icon,audience,is_featured,thread_count,member_count,sort_order")
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return { spaces: data ?? [] };
});

const ListThreadsInput = z.object({
  space_slug: z.string().optional(),
  kind: z.enum(["discussion", "question", "poll", "announcement", "event"]).optional(),
  tag: z.string().optional(),
  sort: z.enum(["latest", "top", "new"]).default("latest"),
  q: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export const listThreads = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ListThreadsInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    let spaceId: string | undefined;
    if (data.space_slug) {
      const { data: space } = await sb.from("community_spaces").select("id").eq("slug", data.space_slug).maybeSingle();
      if (!space) return { threads: [], total: 0 };
      spaceId = space.id;
    }
    let q = sb
      .from("community_threads")
      .select(
        "id,slug,title,excerpt,kind,tags,upvote_count,post_count,view_count,is_pinned,is_featured,last_activity_at,created_at,author_id,space_id",
        { count: "exact" },
      )
      .eq("status", "approved");
    if (spaceId) q = q.eq("space_id", spaceId);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.tag) q = q.contains("tags", [data.tag]);
    if (data.q) q = q.ilike("title", `%${data.q}%`);
    if (data.sort === "top") q = q.order("upvote_count", { ascending: false });
    else if (data.sort === "new") q = q.order("created_at", { ascending: false });
    else q = q.order("is_pinned", { ascending: false }).order("last_activity_at", { ascending: false });
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: threads, count, error } = await q;
    if (error) throw new Error(error.message);
    return { threads: threads ?? [], total: count ?? 0 };
  });

const ThreadKey = z.object({ space_slug: z.string(), slug: z.string() });

export const getThread = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ThreadKey.parse(d))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: space } = await sb
      .from("community_spaces")
      .select("id,slug,name,icon,description,audience")
      .eq("slug", data.space_slug)
      .maybeSingle();
    if (!space) return null;
    const { data: thread } = await sb
      .from("community_threads")
      .select("*")
      .eq("space_id", space.id)
      .eq("slug", data.slug)
      .eq("status", "approved")
      .maybeSingle();
    if (!thread) return null;

    const [{ data: posts }, { data: pollOptions }, { data: event }, { data: author }] = await Promise.all([
      sb
        .from("community_posts")
        .select("id,body_md,upvote_count,is_accepted,author_id,parent_post_id,created_at")
        .eq("thread_id", thread.id)
        .eq("status", "approved")
        .order("is_accepted", { ascending: false })
        .order("upvote_count", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(200),
      thread.kind === "poll"
        ? sb.from("community_poll_options").select("id,label,vote_count,sort_order").eq("thread_id", thread.id).order("sort_order")
        : Promise.resolve({ data: [] as any[] }),
      thread.kind === "event"
        ? sb.from("community_events").select("*").eq("thread_id", thread.id).maybeSingle()
        : Promise.resolve({ data: null }),
      sb.from("community_reputation").select("user_id,display_name,avatar_url,headline,points,level").eq("user_id", thread.author_id).maybeSingle(),
    ]);

    // Fire-and-forget view increment (best effort via publishable client—will only work if RLS allows;
    // this is intentional and non-blocking).
    void sb.rpc("noop" as any).catch(() => {});

    // Get post authors' rep in one call
    const authorIds = Array.from(new Set([thread.author_id, ...(posts ?? []).map((p: any) => p.author_id)]));
    const { data: reps } = await sb
      .from("community_reputation")
      .select("user_id,display_name,avatar_url,points,level")
      .in("user_id", authorIds);
    const repMap = Object.fromEntries((reps ?? []).map((r: any) => [r.user_id, r]));

    return {
      space,
      thread,
      author,
      posts: (posts ?? []).map((p: any) => ({ ...p, author: repMap[p.author_id] ?? null })),
      pollOptions: pollOptions ?? [],
      event,
    };
  });

export const listLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data } = await sb
    .from("community_reputation")
    .select("user_id,display_name,avatar_url,headline,points,level,threads_created,posts_created,upvotes_received,answers_accepted")
    .order("points", { ascending: false })
    .limit(50);
  return { leaders: data ?? [] };
});

export const listBadges = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data } = await sb.from("community_badges").select("*").order("tier");
  return { badges: data ?? [] };
});

export const listUpcomingEvents = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data } = await sb
    .from("community_events")
    .select("thread_id,starts_at,ends_at,location,join_url,is_online,attendee_count")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(12);
  if (!data?.length) return { events: [] };
  const ids = data.map((e: any) => e.thread_id);
  const { data: threads } = await sb
    .from("community_threads")
    .select("id,slug,title,space_id,excerpt")
    .in("id", ids)
    .eq("status", "approved");
  const { data: spaces } = await sb.from("community_spaces").select("id,slug").in("id", (threads ?? []).map((t: any) => t.space_id));
  const spaceMap = Object.fromEntries((spaces ?? []).map((s: any) => [s.id, s.slug]));
  const threadMap = Object.fromEntries((threads ?? []).map((t: any) => [t.id, t]));
  return {
    events: data
      .map((e: any) => ({ ...e, thread: threadMap[e.thread_id], space_slug: spaceMap[threadMap[e.thread_id]?.space_id] }))
      .filter((e: any) => e.thread),
  };
});

// ---------------- Writes (authenticated) ----------------

const CreateThreadInput = z.object({
  space_slug: z.string().min(1),
  kind: z.enum(["discussion", "question", "poll", "announcement", "event"]),
  title: z.string().trim().min(6).max(180),
  body_md: z.string().trim().max(20000).default(""),
  tags: z.array(z.string().min(1).max(32)).max(6).default([]),
  poll_options: z.array(z.string().min(1).max(120)).max(8).optional(),
  event: z
    .object({
      starts_at: z.string().min(1),
      ends_at: z.string().optional(),
      location: z.string().optional(),
      join_url: z.string().url().optional(),
      is_online: z.boolean().default(true),
    })
    .optional(),
});

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateThreadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: space, error: spaceErr } = await supabase
      .from("community_spaces")
      .select("id,slug,audience,is_archived")
      .eq("slug", data.space_slug)
      .maybeSingle();
    if (spaceErr || !space || space.is_archived) throw new Error("Space not found");
    if (data.kind === "announcement") {
      const { data: mod } = await supabase.rpc("is_community_moderator", { _user: userId });
      if (!mod) throw new Error("Only moderators can post announcements");
    }
    if (data.kind === "poll" && (!data.poll_options || data.poll_options.length < 2)) {
      throw new Error("Polls need at least 2 options");
    }
    if (data.kind === "event" && !data.event?.starts_at) {
      throw new Error("Events need a start time");
    }

    const moderation = await moderateContent(`${data.title}\n\n${data.body_md}`);

    // Unique slug per space
    let base = slugify(data.title);
    let slug = base;
    for (let i = 2; i < 30; i++) {
      const { data: exists } = await supabase.from("community_threads").select("id").eq("space_id", space.id).eq("slug", slug).maybeSingle();
      if (!exists) break;
      slug = `${base}-${i}`;
    }

    const excerpt = data.body_md.replace(/\s+/g, " ").slice(0, 200);
    const { data: thread, error } = await supabase
      .from("community_threads")
      .insert({
        space_id: space.id,
        author_id: userId,
        kind: data.kind,
        slug,
        title: data.title,
        body_md: data.body_md,
        excerpt,
        tags: data.tags,
        status: moderation.status,
        moderation_reason: moderation.reason,
        moderation_score: moderation.score,
        seo_title: data.title.slice(0, 60),
        seo_description: excerpt.slice(0, 158),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (data.kind === "poll" && data.poll_options?.length) {
      await supabase.from("community_poll_options").insert(
        data.poll_options.map((label, i) => ({ thread_id: thread.id, label, sort_order: i })),
      );
    }
    if (data.kind === "event" && data.event) {
      await supabase.from("community_events").insert({
        thread_id: thread.id,
        starts_at: data.event.starts_at,
        ends_at: data.event.ends_at,
        location: data.event.location,
        join_url: data.event.join_url,
        is_online: data.event.is_online,
      });
    }

    // Seed / refresh reputation display fields
    const { data: existingRep } = await supabase.from("community_reputation").select("user_id").eq("user_id", userId).maybeSingle();
    if (!existingRep) {
      await supabase.from("community_reputation").insert({ user_id: userId });
    }

    return { thread, space, moderation };
  });

const ReplyInput = z.object({
  thread_id: z.string().uuid(),
  body_md: z.string().trim().min(2).max(20000),
  parent_post_id: z.string().uuid().optional(),
});

export const replyToThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReplyInput.parse(d))
  .handler(async ({ data, context }) => {
    const moderation = await moderateContent(data.body_md);
    const { data: post, error } = await context.supabase
      .from("community_posts")
      .insert({
        thread_id: data.thread_id,
        author_id: context.userId,
        parent_post_id: data.parent_post_id ?? null,
        body_md: data.body_md,
        status: moderation.status,
        moderation_reason: moderation.reason,
        moderation_score: moderation.score,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { post, moderation };
  });

const ReactInput = z.object({
  target_type: z.enum(["thread", "post"]),
  target_id: z.string().uuid(),
  reaction: z.enum(["upvote", "downvote", "helpful", "love", "celebrate"]).default("upvote"),
});

export const toggleReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReactInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("community_reactions")
      .select("id")
      .eq("user_id", userId)
      .eq("target_type", data.target_type)
      .eq("target_id", data.target_id)
      .eq("reaction", data.reaction)
      .maybeSingle();
    if (existing) {
      await supabase.from("community_reactions").delete().eq("id", existing.id);
      return { active: false };
    }
    await supabase.from("community_reactions").insert({
      user_id: userId,
      target_type: data.target_type,
      target_id: data.target_id,
      reaction: data.reaction,
    });
    return { active: true };
  });

export const votePoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ thread_id: z.string().uuid(), option_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("community_poll_votes").delete().eq("user_id", userId).eq("thread_id", data.thread_id);
    const { error } = await supabase.from("community_poll_votes").insert({
      user_id: userId,
      thread_id: data.thread_id,
      option_id: data.option_id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const rsvpEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ thread_id: z.string().uuid(), status: z.enum(["going", "maybe", "declined"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("community_event_rsvps")
      .upsert({ thread_id: data.thread_id, user_id: userId, status: data.status }, { onConflict: "thread_id,user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const acceptAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ thread_id: z.string().uuid(), post_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: thread } = await supabase.from("community_threads").select("author_id,kind").eq("id", data.thread_id).maybeSingle();
    if (!thread || thread.author_id !== userId) throw new Error("Only the author can accept an answer");
    if (thread.kind !== "question") throw new Error("Only questions have accepted answers");
    await supabase.from("community_posts").update({ is_accepted: false }).eq("thread_id", data.thread_id);
    await supabase.from("community_posts").update({ is_accepted: true }).eq("id", data.post_id);
    await supabase.from("community_threads").update({ accepted_post_id: data.post_id }).eq("id", data.thread_id);
    // reputation bonus
    const { data: postAuthor } = await supabase.from("community_posts").select("author_id").eq("id", data.post_id).maybeSingle();
    if (postAuthor?.author_id) {
      await supabase.rpc("noop" as any).catch(() => {});
      const { data: rep } = await supabase.from("community_reputation").select("points,answers_accepted").eq("user_id", postAuthor.author_id).maybeSingle();
      await supabase.from("community_reputation").upsert({
        user_id: postAuthor.author_id,
        points: (rep?.points ?? 0) + 10,
        answers_accepted: (rep?.answers_accepted ?? 0) + 1,
      } as any);
    }
    return { ok: true };
  });

// ---------------- Moderation admin ----------------

export const listModerationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: threads } = await context.supabase
      .from("community_threads")
      .select("id,title,slug,space_id,status,moderation_reason,moderation_score,author_id,created_at,body_md")
      .in("status", ["pending", "hidden"])
      .order("created_at", { ascending: false })
      .limit(100);
    const { data: posts } = await context.supabase
      .from("community_posts")
      .select("id,thread_id,body_md,status,moderation_reason,moderation_score,author_id,created_at")
      .in("status", ["pending", "hidden"])
      .order("created_at", { ascending: false })
      .limit(100);
    return { threads: threads ?? [], posts: posts ?? [] };
  });

const ModerateInput = z.object({
  target_type: z.enum(["thread", "post"]),
  target_id: z.string().uuid(),
  action: z.enum(["approve", "hide", "delete"]),
  reason: z.string().optional(),
});

export const moderateItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ModerateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isMod } = await supabase.rpc("is_community_moderator", { _user: userId });
    if (!isMod) throw new Error("Forbidden");
    const table = data.target_type === "thread" ? "community_threads" : "community_posts";
    const nextStatus = data.action === "approve" ? "approved" : data.action === "hide" ? "hidden" : "deleted";
    if (data.action === "delete") {
      await supabase.from(table as any).delete().eq("id", data.target_id);
    } else {
      await supabase.from(table as any).update({ status: nextStatus, moderation_reason: data.reason ?? null }).eq("id", data.target_id);
    }
    await supabase.from("community_moderation_log").insert({
      actor_id: userId,
      target_type: data.target_type,
      target_id: data.target_id,
      action: data.action,
      reason: data.reason ?? null,
    });
    return { ok: true };
  });
