/**
 * Programmatic SEO server functions.
 *
 * Public reads (loader-safe):
 *   - getPseoPageBySlug(slug)  → the page + course + location + interlinks
 *
 * Privileged operations (admin-only, guarded via requireSupabaseAuth):
 *   - reseedPseoForCourse(courseId)
 *   - processPseoQueue(limit)   — run N pending generation jobs
 *   - recomputeInterlinks(pageId)
 *
 * The public read uses the server-publishable Supabase client so it works
 * during SSR / prerender without a user session; RLS on `pseo_pages` only
 * exposes rows with `status = 'published'`.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildPseoContent } from "./content-builder";
import type { PseoPageType, PseoDbPageWithRelations, PseoLocation } from "./types";

function publicClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

const slugSchema = z.object({ slug: z.string().min(1).max(200) });

export const getPseoPageBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => slugSchema.parse(d))
  .handler(async ({ data }): Promise<PseoDbPageWithRelations | null> => {
    const sb = publicClient();
    const { data: row } = await sb
      .from("pseo_pages")
      .select(
        "id, course_id, page_type, location_id, slug, title, h1, meta_description, canonical_url, content, keywords, related_slugs, status, quality_score, word_count, view_count, published_at, last_regenerated_at, updated_at",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!row) return null;

    const [courseRes, locRes, linkRes] = await Promise.all([
      row.course_id
        ? sb
            .from("courses")
            .select(
              "id, slug, name, short_description, full_description, category_id, subcategory, hero_image_url, offer_price, base_price, currency, duration, level",
            )
            .eq("id", row.course_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      row.location_id
        ? sb.from("pseo_locations").select("*").eq("id", row.location_id).maybeSingle()
        : Promise.resolve({ data: null }),
      sb
        .from("pseo_interlinks")
        .select("to_page_id, relation, weight, pseo_pages!pseo_interlinks_to_page_id_fkey(slug, title, status)")
        .eq("from_page_id", row.id)
        .order("weight", { ascending: false })
        .limit(24),
    ]);

    // Non-blocking view increment
    void sb.rpc("increment_pseo_view", { p_id: row.id }).then(() => {}, () => {});

    interface JoinedLink { relation: string; pseo_pages: { slug: string; title: string | null; status: string } | null }
    const interlinks = ((linkRes.data ?? []) as JoinedLink[])
      .filter((l) => l.pseo_pages && l.pseo_pages.status === "published")
      .map((l) => ({
        slug: l.pseo_pages!.slug,
        title: l.pseo_pages!.title,
        relation: l.relation,
      }));

    return {
      ...(row as unknown as PseoDbPageWithRelations),
      course: (courseRes.data ?? null) as PseoDbPageWithRelations["course"],
      location: (locRes.data ?? null) as PseoLocation | null,
      interlinks,
    };
  });

// ---- privileged ops ----

export const reseedPseoForCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ courseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: superRole } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!role && !superRole) throw new Error("Forbidden");
    const { data: count, error } = await context.supabase.rpc("seed_pseo_pages_for_course", {
      p_course_id: data.courseId,
    });
    if (error) throw error;
    return { seeded: count ?? 0 };
  });

/**
 * Worker that drains pending jobs — build unique content deterministically,
 * fill the page, publish it, then recompute its interlinks.
 * Cap the batch size to keep the invocation under the edge time budget.
 */
export const processPseoQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().min(1).max(200).default(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: superRole } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!role && !superRole) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from("pseo_generation_jobs")
      .select("id, page_id, attempts")
      .eq("status", "pending")
      .order("priority", { ascending: true })
      .order("scheduled_for", { ascending: true })
      .limit(data.limit);
    if (jobsErr) throw jobsErr;

    let ok = 0;
    let failed = 0;

    for (const job of jobs ?? []) {
      await supabaseAdmin
        .from("pseo_generation_jobs")
        .update({ status: "running", started_at: new Date().toISOString(), attempts: job.attempts + 1 })
        .eq("id", job.id);
      try {
        const { data: page } = await supabaseAdmin
          .from("pseo_pages")
          .select("id, course_id, page_type, location_id, slug")
          .eq("id", job.page_id)
          .maybeSingle();
        if (!page || !page.course_id) throw new Error("page or course missing");
        const [{ data: course }, { data: loc }] = await Promise.all([
          supabaseAdmin
            .from("courses")
            .select(
              "id, slug, name, short_description, full_description, subcategory, offer_price, base_price, currency, duration, level",
            )
            .eq("id", page.course_id)
            .maybeSingle(),
          page.location_id
            ? supabaseAdmin.from("pseo_locations").select("*").eq("id", page.location_id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (!course) throw new Error("course missing");
        const built = buildPseoContent({
          course,
          pageType: page.page_type as PseoPageType,
          location: (loc as PseoLocation | null) ?? null,
        });
        await supabaseAdmin
          .from("pseo_pages")
          .update({
            title: built.title,
            h1: built.h1,
            meta_description: built.meta_description,
            keywords: built.keywords,
            content: built.content,
            word_count: built.word_count,
            quality_score: Math.min(1, built.word_count / 600),
            status: "published",
            published_at: new Date().toISOString(),
            last_regenerated_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", page.id);
        await supabaseAdmin.rpc("recompute_pseo_interlinks", { p_page_id: page.id });
        await supabaseAdmin
          .from("pseo_generation_jobs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", job.id);
        ok++;
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        await supabaseAdmin
          .from("pseo_generation_jobs")
          .update({ status: "failed", last_error: message })
          .eq("id", job.id);
        await supabaseAdmin
          .from("pseo_pages")
          .update({ status: "failed", error_message: message })
          .eq("id", job.page_id);
      }
    }

    return { processed: (jobs ?? []).length, ok, failed };
  });
