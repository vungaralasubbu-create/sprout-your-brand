/**
 * Approval Sync — additive bridge between Marketing OS projects and the
 * unified Approval Center (approval_queue).
 *
 * Every generated asset (post, poster, email, landing page, blog post) inside
 * `marketing_projects.result` is mirrored into `approval_queue` so the
 * Approval Center is never empty after a project runs. Fully idempotent — a
 * synthetic `content_id` of shape `mp:<projectId>:<kind>:<index>` is used to
 * deduplicate on re-runs so subsequent syncs update (not duplicate) rows.
 *
 * This module does NOT replace any existing approval logic. It only inserts /
 * upserts rows and returns a per-kind summary the caller can log.
 */

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export type ApprovalSyncSummary = {
  project_id: string;
  inserted: number;
  updated: number;
  skipped: number;
  by_kind: Record<string, { inserted: number; updated: number; skipped: number }>;
  errors: Array<{ kind: string; index: number; error: string }>;
};

function bump(summary: ApprovalSyncSummary, kind: string, key: "inserted" | "updated" | "skipped") {
  summary[key] += 1;
  const bk = (summary.by_kind[kind] ??= { inserted: 0, updated: 0, skipped: 0 });
  bk[key] += 1;
}

type SyncRow = {
  content_id: string;
  title: string;
  preview: string | null;
  body: string | null;
  content: Record<string, unknown>;
  platform: string;
  content_type: string;
  hashtags: string[];
  cta: string | null;
  media_prompts: Record<string, unknown>[];
};

function toRow(
  projectId: string,
  kind: string,
  index: number,
  base: Partial<SyncRow> & { title: string; platform: string; content_type: string },
): SyncRow {
  return {
    content_id: `mp:${projectId}:${kind}:${index}`,
    title: base.title,
    preview: base.preview ?? null,
    body: base.body ?? null,
    content: base.content ?? {},
    platform: base.platform,
    content_type: base.content_type,
    hashtags: base.hashtags ?? [],
    cta: base.cta ?? null,
    media_prompts: base.media_prompts ?? [],
  };
}

export async function syncProjectToApprovalQueue(
  supabase: Any,
  userId: string,
  projectId: string,
): Promise<ApprovalSyncSummary> {
  const summary: ApprovalSyncSummary = {
    project_id: projectId,
    inserted: 0,
    updated: 0,
    skipped: 0,
    by_kind: {},
    errors: [],
  };

  const { data: proj, error } = await supabase
    .from("marketing_projects")
    .select("id, name, prompt, result, campaign_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!proj) throw new Error("Project not found");

  const result: Any = proj.result ?? {};
  const campaignName: string | null = result?.campaign?.name ?? proj.name ?? null;
  const rows: SyncRow[] = [];

  // Posts (social content)
  const posts: Any[] = Array.isArray(result.content) ? result.content : [];
  posts.forEach((p, i) => {
    const platform = String(p?.platform ?? "instagram").toLowerCase();
    const hook = String(p?.hook ?? "");
    const body = String(p?.body ?? "");
    const cta = p?.cta ? String(p.cta) : null;
    const hashtags = Array.isArray(p?.hashtags) ? p.hashtags.filter((x: Any) => typeof x === "string") : [];
    rows.push(
      toRow(projectId, "post", i, {
        title: hook || `${platform} post ${i + 1}`,
        preview: (body || hook).slice(0, 240),
        body,
        content: { ...p, source: "marketing_project", project_id: projectId },
        platform,
        content_type: "post",
        hashtags,
        cta,
      }),
    );
  });

  // Posters
  const posters: Any[] = Array.isArray(result.posters) ? result.posters : [];
  posters.forEach((ps, i) => {
    const image = ps?.image_url ? String(ps.image_url) : null;
    const platform = String(ps?.platform ?? "instagram").toLowerCase();
    rows.push(
      toRow(projectId, "poster", i, {
        title: String(ps?.headline ?? ps?.title ?? `Poster ${i + 1}`),
        preview: String(ps?.subtitle ?? ps?.description ?? "").slice(0, 240),
        body: ps?.description ? String(ps.description) : null,
        content: {
          ...ps,
          image_url: image,
          media_urls: image ? [image] : [],
          source: "marketing_project",
          project_id: projectId,
        },
        platform,
        content_type: "poster",
        cta: ps?.cta ? String(ps.cta) : null,
      }),
    );
  });

  // Emails
  const emails: Any[] = Array.isArray(result.emails) ? result.emails : [];
  emails.forEach((em, i) => {
    rows.push(
      toRow(projectId, "email", i, {
        title: String(em?.subject ?? `Email ${i + 1}`),
        preview: String(em?.preheader ?? em?.body ?? "").slice(0, 240),
        body: em?.body ? String(em.body) : null,
        content: { ...em, source: "marketing_project", project_id: projectId },
        platform: "email",
        content_type: "email",
        cta: em?.cta ? String(em.cta) : null,
      }),
    );
  });

  // Landing page
  if (result.landing && typeof result.landing === "object") {
    const lp: Any = result.landing;
    rows.push(
      toRow(projectId, "landing", 0, {
        title: String(lp?.hero?.headline ?? `${proj.name} — Landing`),
        preview: String(lp?.hero?.sub ?? "").slice(0, 240),
        body: JSON.stringify(lp),
        content: { ...lp, source: "marketing_project", project_id: projectId },
        platform: "landing",
        content_type: "landing_page",
        cta: lp?.hero?.cta ? String(lp.hero.cta) : null,
      }),
    );
  }

  // Blog (if present)
  const blog: Any = result.blog ?? result.article ?? null;
  if (blog && typeof blog === "object") {
    rows.push(
      toRow(projectId, "blog", 0, {
        title: String(blog?.title ?? blog?.seo_title ?? `${proj.name} — Blog`),
        preview: String(blog?.meta_description ?? blog?.short_summary ?? "").slice(0, 300),
        body: blog?.content_markdown ? String(blog.content_markdown) : null,
        content: { ...blog, source: "marketing_project", project_id: projectId },
        platform: "blog",
        content_type: "blog_post",
      }),
    );
  }

  if (!rows.length) return summary;

  // Idempotent write: look up existing content_ids for this project.
  const contentIds = rows.map((r) => r.content_id);
  const { data: existing, error: exErr } = await supabase
    .from("approval_queue")
    .select("id, content_id, status")
    .in("content_id", contentIds)
    .eq("owner_id", userId);
  if (exErr) throw new Error(exErr.message);
  const existingMap = new Map<string, { id: string; status: string }>();
  for (const row of (existing ?? []) as Array<{ id: string; content_id: string; status: string }>) {
    existingMap.set(row.content_id, { id: row.id, status: row.status });
  }

  const toInsert: Any[] = [];
  const toUpdate: Array<{ id: string; row: SyncRow; kind: string }> = [];

  for (const r of rows) {
    const kind = r.content_id.split(":")[2] ?? "asset";
    const prior = existingMap.get(r.content_id);
    if (!prior) {
      toInsert.push({
        ...r,
        owner_id: userId,
        created_by: userId,
        campaign: campaignName,
        ai_generated: true,
        status: "review",
        approval_mode: "manual",
        scores: {},
        warnings: [],
        version: 1,
        language: "English",
      });
      continue;
    }
    // Only refresh rows that are still in draft/review — never overwrite
    // approved/scheduled/published content.
    if (prior.status === "draft" || prior.status === "review") {
      toUpdate.push({ id: prior.id, row: r, kind });
    } else {
      bump(summary, kind, "skipped");
    }
  }

  if (toInsert.length) {
    const { data: ins, error: iErr } = await supabase
      .from("approval_queue")
      .insert(toInsert)
      .select("id, content_id");
    if (iErr) throw new Error(iErr.message);
    for (const row of (ins ?? []) as Array<{ id: string; content_id: string }>) {
      const kind = row.content_id.split(":")[2] ?? "asset";
      bump(summary, kind, "inserted");
    }
  }

  for (const u of toUpdate) {
    const { error: uErr } = await supabase
      .from("approval_queue")
      .update({
        title: u.row.title,
        preview: u.row.preview,
        body: u.row.body,
        content: u.row.content,
        platform: u.row.platform,
        content_type: u.row.content_type,
        hashtags: u.row.hashtags,
        cta: u.row.cta,
      })
      .eq("id", u.id);
    if (uErr) {
      const idx = Number(u.row.content_id.split(":")[3] ?? 0);
      summary.errors.push({ kind: u.kind, index: idx, error: uErr.message });
      continue;
    }
    bump(summary, u.kind, "updated");
  }

  return summary;
}
