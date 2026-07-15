import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadAmbassador(context: any) {
  const { supabase, userId } = context;
  const { data: profile } = await supabase
    .from("campus_ambassador_profiles")
    .select("id, full_name, status, ambassador_code, referral_code, referral_link")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return null;
  if (profile.status !== "active") return null;
  return profile;
}

const RESOURCE_SELECT = `
  id, resource_code, program_id, campaign_id, resource_type, resource_category,
  title, description, media_url, thumbnail_url, caption_content, short_copy,
  share_message, aspect_ratio, file_format, personalisation_allowed,
  personalisation_fields, is_featured, status, published_at, effective_from,
  effective_until, version, created_at, updated_at
`;

// ============ OVERVIEW ============
export const getMarketingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    // Available resources (published + effective)
    const nowIso = new Date().toISOString();
    const { data: resources } = await supabase
      .from("marketing_resources")
      .select("id, resource_type, program_id, campaign_id, is_featured, published_at, thumbnail_url, media_url, title")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    const all = (resources || []).filter((r: any) => {
      const eff = !r.effective_until || r.effective_until >= nowIso;
      return eff;
    });

    const programCreatives = all.filter((r: any) =>
      ["program_poster", "square_social", "portrait_social", "program_banner"].includes(r.resource_type)
    );
    const campaignResources = all.filter((r: any) => !!r.campaign_id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentlyAdded = all.filter((r: any) => r.published_at && r.published_at >= sevenDaysAgo);

    // Featured (3 for dashboard)
    const featured = all.filter((r: any) => r.is_featured).slice(0, 3);

    return {
      gate: "ok" as const,
      ambassador: amb,
      metrics: {
        available: all.length,
        programCreatives: programCreatives.length,
        campaignResources: campaignResources.length,
        recentlyAdded: recentlyAdded.length,
      },
      featured,
    };
  });

// ============ LIST RESOURCES (with filters) ============
export const listMarketingResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        search: z.string().optional(),
        programId: z.string().uuid().optional(),
        campaignId: z.string().uuid().optional(),
        resourceType: z.string().optional(),
        filter: z
          .enum([
            "all",
            "posters",
            "instagram",
            "whatsapp",
            "stories",
            "captions",
            "program_creatives",
            "campaign_resources",
            "featured",
            "saved",
            "recent",
          ])
          .default("all"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(48).default(24),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    let q = supabase
      .from("marketing_resources")
      .select(RESOURCE_SELECT, { count: "exact" })
      .eq("status", "published");

    if (data.programId) q = q.eq("program_id", data.programId);
    if (data.campaignId) q = q.eq("campaign_id", data.campaignId);

    if (data.search) {
      const s = data.search.replace(/[%,]/g, " ").trim();
      if (s) q = q.or(`title.ilike.%${s}%,short_copy.ilike.%${s}%,caption_content.ilike.%${s}%`);
    }

    const groups: Record<string, string[]> = {
      posters: ["program_poster", "campaign_poster", "program_banner"],
      instagram: ["square_social", "portrait_social", "instagram_story", "caption_instagram"],
      whatsapp: ["whatsapp_creative", "whatsapp_message"],
      stories: ["instagram_story", "story_text"],
      captions: ["caption_instagram", "caption_linkedin", "short_copy", "whatsapp_message", "story_text"],
      program_creatives: ["program_poster", "square_social", "portrait_social", "program_banner"],
    };

    if (data.resourceType && data.resourceType !== "all") {
      q = q.eq("resource_type", data.resourceType as any);
    } else if (data.filter && groups[data.filter]) {
      q = q.in("resource_type", groups[data.filter] as any);
    } else if (data.filter === "campaign_resources") {
      q = q.not("campaign_id", "is", null);
    } else if (data.filter === "featured") {
      q = q.eq("is_featured", true);
    } else if (data.filter === "recent") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      q = q.gte("published_at", sevenDaysAgo);
    }

    if (data.filter === "saved") {
      const { data: saves } = await supabase
        .from("marketing_resource_saves")
        .select("resource_id")
        .eq("ambassador_id", amb.id);
      const ids = (saves || []).map((s: any) => s.resource_id);
      if (ids.length === 0) return { gate: "ok" as const, resources: [], total: 0, savedIds: [] };
      q = q.in("id", ids);
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    q = q.order("published_at", { ascending: false }).range(from, to);

    const { data: rows, count } = await q;

    // Attach saved flag
    const { data: savedRows } = await supabase
      .from("marketing_resource_saves")
      .select("resource_id")
      .eq("ambassador_id", amb.id);
    const savedIds = new Set((savedRows || []).map((s: any) => s.resource_id));

    // Enrich with program info
    const programIds = Array.from(new Set((rows || []).map((r: any) => r.program_id).filter(Boolean)));
    const programsMap: Record<string, any> = {};
    if (programIds.length) {
      const { data: progs } = await supabase
        .from("courses")
        .select("id, name, slug, category_id, course_categories!inner(name, slug)")
        .in("id", programIds);
      (progs || []).forEach((p: any) => (programsMap[p.id] = p));
    }

    return {
      gate: "ok" as const,
      resources: (rows || []).map((r: any) => ({
        ...r,
        is_saved: savedIds.has(r.id),
        program: r.program_id ? programsMap[r.program_id] || null : null,
      })),
      total: count || 0,
      savedIds: Array.from(savedIds),
    };
  });

// ============ PROGRAMS WITH COUNTS ============
export const listProgramsWithResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: rows } = await supabase
      .from("marketing_resources")
      .select("program_id, resource_type, campaign_id")
      .eq("status", "published");

    const counts: Record<string, any> = {};
    (rows || []).forEach((r: any) => {
      if (!r.program_id) return;
      const p = (counts[r.program_id] ||= {
        posters: 0,
        socials: 0,
        captions: 0,
        campaigns: 0,
        total: 0,
      });
      p.total++;
      if (["program_poster", "campaign_poster", "program_banner"].includes(r.resource_type)) p.posters++;
      if (["square_social", "portrait_social", "instagram_story"].includes(r.resource_type)) p.socials++;
      if (["caption_instagram", "caption_linkedin", "short_copy", "whatsapp_message"].includes(r.resource_type))
        p.captions++;
      if (r.campaign_id) p.campaigns++;
    });

    const programIds = Object.keys(counts);
    if (programIds.length === 0) return { gate: "ok" as const, programs: [] };

    const { data: progs } = await supabase
      .from("courses")
      .select("id, name, slug, thumbnail_url, category_id, course_categories!inner(name, slug)")
      .in("id", programIds)
      .eq("is_published", true);

    const programs = (progs || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      thumbnail_url: p.thumbnail_url,
      category_name: p.course_categories?.name,
      category_slug: p.course_categories?.slug,
      counts: counts[p.id],
    }));

    return { gate: "ok" as const, programs };
  });

// ============ RESOURCE DETAIL ============
export const getMarketingResource = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: r } = await supabase
      .from("marketing_resources")
      .select(RESOURCE_SELECT)
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();

    if (!r) return { gate: "not_found" as const };

    let program: any = null;
    if (r.program_id) {
      const { data: p } = await supabase
        .from("courses")
        .select("id, name, slug, category_id, base_price, offer_price, currency, course_categories!inner(name, slug)")
        .eq("id", r.program_id)
        .maybeSingle();
      program = p;
    }

    const { data: save } = await supabase
      .from("marketing_resource_saves")
      .select("id")
      .eq("ambassador_id", amb.id)
      .eq("resource_id", r.id)
      .maybeSingle();

    return { gate: "ok" as const, resource: r, program, is_saved: !!save, ambassador: amb };
  });

// ============ PROGRAM RESOURCES PAGE ============
export const getProgramResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: program } = await supabase
      .from("courses")
      .select("id, name, slug, thumbnail_url, hero_image_url, short_description, category_id, base_price, offer_price, currency, course_categories!inner(name, slug)")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!program) return { gate: "not_found" as const };

    const { data: rows } = await supabase
      .from("marketing_resources")
      .select(RESOURCE_SELECT)
      .eq("status", "published")
      .eq("program_id", program.id)
      .order("published_at", { ascending: false });

    return { gate: "ok" as const, program, resources: rows || [], ambassador: amb };
  });

// ============ SAVE / UNSAVE ============
export const toggleSaveResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ resourceId: z.string().uuid(), save: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    if (data.save) {
      const { error } = await supabase
        .from("marketing_resource_saves")
        .upsert({ ambassador_id: amb.id, resource_id: data.resourceId }, { onConflict: "ambassador_id,resource_id" });
      if (error) return { gate: "error" as const, message: error.message };
      return { gate: "ok" as const, saved: true };
    } else {
      const { error } = await supabase
        .from("marketing_resource_saves")
        .delete()
        .eq("ambassador_id", amb.id)
        .eq("resource_id", data.resourceId);
      if (error) return { gate: "error" as const, message: error.message };
      return { gate: "ok" as const, saved: false };
    }
  });

// ============ TRACK INTERACTION ============
export const trackInteraction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        resourceId: z.string().uuid().optional(),
        programId: z.string().uuid().optional(),
        campaignId: z.string().uuid().optional(),
        type: z.enum([
          "viewed",
          "downloaded",
          "caption_copied",
          "share_message_copied",
          "referral_link_copied",
          "share_started",
          "qr_downloaded",
          "personalised_generated",
        ]),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    await supabase.from("marketing_resource_interactions").insert({
      ambassador_id: amb.id,
      resource_id: data.resourceId || null,
      program_id: data.programId || null,
      campaign_id: data.campaignId || null,
      interaction_type: data.type,
      metadata: data.metadata || {},
    });
    return { gate: "ok" as const };
  });

// ============ RECENT / ACTIVITY ============
export const listMarketingActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: rows } = await supabase
      .from("marketing_resource_interactions")
      .select("id, interaction_type, resource_id, program_id, metadata, created_at")
      .eq("ambassador_id", amb.id)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    const resourceIds = Array.from(new Set((rows || []).map((r: any) => r.resource_id).filter(Boolean)));
    const map: Record<string, any> = {};
    if (resourceIds.length) {
      const { data: res } = await supabase
        .from("marketing_resources")
        .select("id, title, resource_type, thumbnail_url")
        .in("id", resourceIds);
      (res || []).forEach((r: any) => (map[r.id] = r));
    }

    return {
      gate: "ok" as const,
      activity: (rows || []).map((r: any) => ({ ...r, resource: r.resource_id ? map[r.resource_id] : null })),
    };
  });

// ============ RECENTLY USED (distinct resources) ============
export const listRecentlyUsed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: rows } = await supabase
      .from("marketing_resource_interactions")
      .select("resource_id, created_at")
      .eq("ambassador_id", amb.id)
      .not("resource_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(60);

    const seen = new Set<string>();
    const ids: string[] = [];
    (rows || []).forEach((r: any) => {
      if (r.resource_id && !seen.has(r.resource_id)) {
        seen.add(r.resource_id);
        ids.push(r.resource_id);
      }
    });
    const topIds = ids.slice(0, 6);
    if (topIds.length === 0) return { gate: "ok" as const, resources: [] };

    const { data: resources } = await supabase
      .from("marketing_resources")
      .select(RESOURCE_SELECT)
      .in("id", topIds)
      .eq("status", "published");

    const ordered = topIds.map((id) => (resources || []).find((r: any) => r.id === id)).filter(Boolean);
    return { gate: "ok" as const, resources: ordered };
  });

// ============ SUBMIT ISSUE ============
export const submitResourceIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        resourceId: z.string().uuid(),
        issueType: z.enum([
          "broken_download",
          "incorrect_program_info",
          "outdated_price",
          "incorrect_referral_link",
          "image_quality",
          "other",
        ]),
        description: z.string().max(2000).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: r } = await supabase
      .from("marketing_resources")
      .select("id, program_id")
      .eq("id", data.resourceId)
      .maybeSingle();

    const { data: inserted, error } = await supabase
      .from("marketing_resource_issues")
      .insert({
        ambassador_id: amb.id,
        resource_id: data.resourceId,
        program_id: r?.program_id || null,
        issue_type: data.issueType,
        description: data.description || null,
      } as any)
      .select("id, issue_code")
      .single();

    if (error) return { gate: "error" as const, message: error.message };
    return { gate: "ok" as const, issueId: inserted.id, issueCode: inserted.issue_code };
  });

// ============ SIGNED URL FOR DOWNLOAD ============
export const getResourceDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ resourceId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: r } = await supabase
      .from("marketing_resources")
      .select("id, media_url")
      .eq("id", data.resourceId)
      .eq("status", "published")
      .maybeSingle();
    if (!r || !r.media_url) return { gate: "not_found" as const };

    // Full URL or root-relative CDN path: return as-is. Otherwise treat as storage bucket/path and sign.
    let url = r.media_url as string;
    const isPassThrough = /^https?:\/\//i.test(url) || url.startsWith("/");
    if (!isPassThrough) {
      const [bucket, ...rest] = url.split("/");
      const path = rest.join("/");
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 5);
      url = signed?.signedUrl || "";
    }


    // Log download
    await supabase.from("marketing_resource_interactions").insert({
      ambassador_id: amb.id,
      resource_id: r.id,
      interaction_type: "downloaded",
    });

    return { gate: "ok" as const, url };
  });
