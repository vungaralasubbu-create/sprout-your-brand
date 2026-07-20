import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Enterprise Media Library — server functions.
 *
 * Overlays existing storage without touching any legacy bucket, `content_media`,
 * `mkt_assets`, `cs_assets`, or `mkt_campaign_assets`. New uploads target the
 * private `media-library` bucket via signed URLs; existing assets can be
 * registered by path against any bucket.
 */

// =================================================================
// Types
// =================================================================
export type MediaAsset = {
  id: string;
  folder_id: string | null;
  brand_id: string | null;
  campaign_id: string | null;
  owner_id: string | null;
  kind: string;
  source: string;
  ai_generated: boolean;
  ai_prompt: string | null;
  ai_model: string | null;
  bucket: string;
  storage_path: string;
  public_url: string | null;
  file_name: string;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  color_palette: any;
  orientation: string | null;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  caption: string | null;
  tags: string[];
  keywords: string[];
  ai_tags: string[];
  current_version: number;
  visibility: string;
  status: string;
  metadata: any;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

// =================================================================
// Folders
// =================================================================
export const listMediaFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("media_folders")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return { folders: data ?? [] };
  });

export const saveMediaFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        parent_id: z.string().uuid().nullable().optional(),
        name: z.string().min(1).max(120),
        icon: z.string().max(60).nullable().optional(),
        color: z.string().max(20).nullable().optional(),
        sort_order: z.number().int().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("media_folders")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return { folder: row };
    }
    const { data: row, error } = await context.supabase
      .from("media_folders")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return { folder: row };
  });

export const deleteMediaFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("media_folders").delete().eq("id", data.id).eq("is_system", false);
    if (error) throw error;
    return { ok: true };
  });

// =================================================================
// Upload — create signed upload URL for direct browser PUT
// =================================================================
export const createMediaUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        file_name: z.string().min(1).max(255),
        mime_type: z.string().max(120).nullable().optional(),
        folder_id: z.string().uuid().nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const safe = data.file_name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
    const path = `${context.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { data: signed, error } = await context.supabase.storage
      .from("media-library")
      .createSignedUploadUrl(path);
    if (error) throw error;
    return { path, token: signed.token, signedUrl: signed.signedUrl, folder_id: data.folder_id ?? null };
  });

// Register asset row after browser upload
export const registerMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        folder_id: z.string().uuid().nullable().optional(),
        bucket: z.string().default("media-library"),
        storage_path: z.string().min(1),
        file_name: z.string().min(1),
        original_name: z.string().nullable().optional(),
        mime_type: z.string().nullable().optional(),
        size_bytes: z.number().int().nullable().optional(),
        width: z.number().int().nullable().optional(),
        height: z.number().int().nullable().optional(),
        duration_seconds: z.number().nullable().optional(),
        kind: z.enum(["image", "video", "document", "audio", "archive", "data", "other"]).optional(),
        source: z.enum(["upload", "ai_generated", "url_import", "integration"]).optional(),
        ai_generated: z.boolean().optional(),
        ai_prompt: z.string().nullable().optional(),
        ai_model: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
        alt_text: z.string().nullable().optional(),
        tags: z.array(z.string()).optional(),
        brand_id: z.string().uuid().nullable().optional(),
        campaign_id: z.string().uuid().nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const orientation =
      data.width && data.height
        ? data.width > data.height
          ? "landscape"
          : data.width < data.height
            ? "portrait"
            : "square"
        : null;

    const kind =
      data.kind ??
      (data.mime_type?.startsWith("image/")
        ? "image"
        : data.mime_type?.startsWith("video/")
          ? "video"
          : data.mime_type?.startsWith("audio/")
            ? "audio"
            : data.mime_type?.includes("pdf") ||
                data.mime_type?.includes("word") ||
                data.mime_type?.includes("sheet") ||
                data.mime_type?.includes("presentation")
              ? "document"
              : data.mime_type?.includes("zip") ||
                  data.mime_type?.includes("archive")
                ? "archive"
                : "other");

    const insert: any = {
      folder_id: data.folder_id ?? null,
      bucket: data.bucket,
      storage_path: data.storage_path,
      file_name: data.file_name,
      original_name: data.original_name ?? data.file_name,
      mime_type: data.mime_type ?? null,
      size_bytes: data.size_bytes ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      duration_seconds: data.duration_seconds ?? null,
      kind,
      source: data.source ?? "upload",
      ai_generated: data.ai_generated ?? false,
      ai_prompt: data.ai_prompt ?? null,
      ai_model: data.ai_model ?? null,
      title: data.title ?? null,
      alt_text: data.alt_text ?? null,
      tags: data.tags ?? [],
      brand_id: data.brand_id ?? null,
      campaign_id: data.campaign_id ?? null,
      orientation,
      owner_id: context.userId,
    };

    const { data: row, error } = await context.supabase.from("media_assets").insert(insert).select().single();
    if (error) throw error;
    return { asset: row };
  });

// =================================================================
// List / Search / Dashboard
// =================================================================
export const listMediaAssets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        folder_id: z.string().uuid().nullable().optional(),
        kind: z.string().optional(),
        source: z.string().optional(),
        search: z.string().optional(),
        ai_only: z.boolean().optional(),
        favorites_only: z.boolean().optional(),
        archived: z.boolean().optional(),
        deleted: z.boolean().optional(),
        campaign_id: z.string().uuid().optional(),
        brand_id: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(data.limit ?? 200);

    if (data.deleted) q = q.not("deleted_at", "is", null);
    else q = q.is("deleted_at", null);

    if (data.folder_id !== undefined) q = data.folder_id === null ? q.is("folder_id", null) : q.eq("folder_id", data.folder_id);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.source) q = q.eq("source", data.source);
    if (data.ai_only) q = q.eq("ai_generated", true);
    if (data.archived) q = q.eq("status", "archived");
    else if (!data.deleted) q = q.eq("status", "active");
    if (data.campaign_id) q = q.eq("campaign_id", data.campaign_id);
    if (data.brand_id) q = q.eq("brand_id", data.brand_id);
    if (data.search)
      q = q.or(
        `file_name.ilike.%${data.search}%,title.ilike.%${data.search}%,alt_text.ilike.%${data.search}%,description.ilike.%${data.search}%`,
      );

    const { data: rows, error } = await q;
    if (error) throw error;

    let assets = rows ?? [];
    if (data.favorites_only) {
      const { data: favs } = await context.supabase.from("media_favorites").select("asset_id").eq("user_id", context.userId);
      const set = new Set((favs ?? []).map((r: any) => r.asset_id));
      assets = assets.filter((a: any) => set.has(a.id));
    }

    return { assets };
  });

export const getMediaDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allActive } = await context.supabase
      .from("media_assets")
      .select("id, kind, size_bytes, source, ai_generated, brand_id, campaign_id, created_at, tags")
      .is("deleted_at", null);

    const list = allActive ?? [];
    const total = list.length;
    const bytes = list.reduce((s, r: any) => s + Number(r.size_bytes ?? 0), 0);
    const ai = list.filter((r: any) => r.ai_generated).length;
    const videos = list.filter((r: any) => r.kind === "video").length;
    const images = list.filter((r: any) => r.kind === "image").length;
    const documents = list.filter((r: any) => r.kind === "document").length;
    const brand = list.filter((r: any) => r.brand_id).length;
    const campaign = list.filter((r: any) => r.campaign_id).length;

    // Unused = no usage row
    const { data: used } = await context.supabase.from("media_usage").select("asset_id");
    const usedSet = new Set((used ?? []).map((r: any) => r.asset_id));
    const unused = list.filter((r: any) => !usedSet.has(r.id)).length;

    // Recently uploaded / generated
    const recent = [...list].slice(0, 8);
    const recentAi = list.filter((r: any) => r.ai_generated).slice(0, 8);

    return {
      totals: {
        total,
        bytes,
        ai,
        videos,
        images,
        documents,
        brand,
        campaign,
        unused,
      },
      recent,
      recentAi,
    };
  });

// =================================================================
// Signed URLs for preview / download (private bucket)
// =================================================================
export const getMediaSignedUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(v))
  .handler(async ({ data, context }) => {
    if (data.ids.length === 0) return { urls: {} };
    const { data: rows } = await context.supabase
      .from("media_assets")
      .select("id, bucket, storage_path, public_url")
      .in("id", data.ids);
    const urls: Record<string, string> = {};
    for (const row of rows ?? []) {
      const r = row as any;
      if (r.public_url) {
        urls[r.id] = r.public_url;
        continue;
      }
      const { data: signed } = await context.supabase.storage.from(r.bucket).createSignedUrl(r.storage_path, 60 * 60);
      if (signed?.signedUrl) urls[r.id] = signed.signedUrl;
    }
    return { urls };
  });

// =================================================================
// Update / metadata / bulk actions
// =================================================================
export const updateMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        alt_text: z.string().nullable().optional(),
        caption: z.string().nullable().optional(),
        tags: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        folder_id: z.string().uuid().nullable().optional(),
        campaign_id: z.string().uuid().nullable().optional(),
        brand_id: z.string().uuid().nullable().optional(),
        status: z.enum(["active", "archived", "processing"]).optional(),
        visibility: z.enum(["workspace", "private", "public", "shared"]).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { data: row, error } = await context.supabase.from("media_assets").update(rest).eq("id", id).select().single();
    if (error) throw error;
    return { asset: row };
  });

export const bulkMediaAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        action: z.enum(["archive", "restore", "delete", "trash", "move", "assign_campaign", "assign_brand"]),
        folder_id: z.string().uuid().nullable().optional(),
        campaign_id: z.string().uuid().nullable().optional(),
        brand_id: z.string().uuid().nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.action === "delete") {
      const { error } = await context.supabase.from("media_assets").delete().in("id", data.ids);
      if (error) throw error;
      return { ok: true };
    }
    let patch: any = {};
    switch (data.action) {
      case "archive":
        patch = { status: "archived" };
        break;
      case "restore":
        patch = { status: "active", deleted_at: null };
        break;
      case "trash":
        patch = { deleted_at: new Date().toISOString() };
        break;
      case "move":
        patch = { folder_id: data.folder_id ?? null };
        break;
      case "assign_campaign":
        patch = { campaign_id: data.campaign_id ?? null };
        break;
      case "assign_brand":
        patch = { brand_id: data.brand_id ?? null };
        break;
    }
    const { error } = await context.supabase.from("media_assets").update(patch).in("id", data.ids);
    if (error) throw error;
    return { ok: true };
  });

// =================================================================
// Favorites
// =================================================================
export const toggleMediaFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ asset_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("media_favorites")
      .select("user_id")
      .eq("user_id", context.userId)
      .eq("asset_id", data.asset_id)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("media_favorites").delete().eq("user_id", context.userId).eq("asset_id", data.asset_id);
      return { favorited: false };
    }
    await context.supabase.from("media_favorites").insert({ user_id: context.userId, asset_id: data.asset_id });
    return { favorited: true };
  });

export const listMediaFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("media_favorites").select("asset_id").eq("user_id", context.userId);
    return { ids: (data ?? []).map((r: any) => r.asset_id) };
  });

// =================================================================
// Collections
// =================================================================
export const listMediaCollections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("media_collections").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return { collections: data ?? [] };
  });

export const saveMediaCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(120),
        description: z.string().nullable().optional(),
        kind: z.enum(["campaign", "brand", "launch", "presentation", "custom"]).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { data: row, error } = await context.supabase.from("media_collections").update(data).eq("id", data.id).select().single();
      if (error) throw error;
      return { collection: row };
    }
    const { data: row, error } = await context.supabase
      .from("media_collections")
      .insert({ ...data, created_by: context.userId })
      .select()
      .single();
    if (error) throw error;
    return { collection: row };
  });

export const addToCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ collection_id: z.string().uuid(), asset_ids: z.array(z.string().uuid()).min(1) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const rows = data.asset_ids.map((asset_id) => ({ collection_id: data.collection_id, asset_id, added_by: context.userId }));
    const { error } = await context.supabase.from("media_collection_items").upsert(rows, { onConflict: "collection_id,asset_id" });
    if (error) throw error;
    return { ok: true };
  });

// =================================================================
// Usage tracking
// =================================================================
export const listMediaUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ asset_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("media_usage")
      .select("*")
      .eq("asset_id", data.asset_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { usage: rows ?? [] };
  });

export const logMediaUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        asset_id: z.string().uuid(),
        usage_type: z.string().min(1).max(60),
        ref_table: z.string().nullable().optional(),
        ref_id: z.string().uuid().nullable().optional(),
        ref_url: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("media_usage").insert({ ...data, created_by: context.userId });
    if (error) throw error;
    return { ok: true };
  });

// =================================================================
// Versions
// =================================================================
export const listMediaVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ asset_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("media_versions")
      .select("*")
      .eq("asset_id", data.asset_id)
      .order("version", { ascending: false });
    if (error) throw error;
    return { versions: rows ?? [] };
  });

// =================================================================
// AI tagging — routed through central AI Router
// =================================================================
export const aiTagMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ asset_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: asset, error } = await context.supabase
      .from("media_assets")
      .select("id, file_name, title, alt_text, description, mime_type, kind, ai_prompt")
      .eq("id", data.asset_id)
      .single();
    if (error) throw error;

    const { aiChat } = await import("@/lib/ai/router.server");
    const prompt = `You tag digital assets in an enterprise Media Library.
Given the asset metadata below, return a JSON object with:
- "tags": 5-10 short lowercase keywords a marketer might search
- "topics": 2-5 broader topic labels
- "alt_text": one sentence describing the visual content, if applicable
Only return JSON.

Asset metadata:
${JSON.stringify(asset)}`;

    const result = await aiChat({
      messages: [
        { role: "system", content: "You are a helpful media librarian." },
        { role: "user", content: prompt },
      ],
      responseFormat: "json",
    });

    let parsed: any = {};
    try {
      parsed = typeof result === "string" ? JSON.parse(result) : (result as any)?.content ? JSON.parse((result as any).content) : result;
    } catch {
      parsed = {};
    }

    const ai_tags: string[] = Array.isArray(parsed?.tags) ? parsed.tags.slice(0, 15) : [];
    const patch: any = { ai_tags };
    if (parsed?.alt_text && !asset.alt_text) patch.alt_text = String(parsed.alt_text).slice(0, 500);

    const { data: updated } = await context.supabase.from("media_assets").update(patch).eq("id", data.asset_id).select().single();
    return { asset: updated };
  });
