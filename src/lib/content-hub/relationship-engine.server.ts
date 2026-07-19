// Content Relationship Engine.
// Builds explicit edges in content_relations from tags, keywords, and existing arrays.
// Server-only.

import type { SupabaseClient } from "@supabase/supabase-js";

type Row = {
  id: string;
  type: string;
  tag_slugs: string[] | null;
  focus_topic: string | null;
  related_topics: string[] | null;
  related_course_ids: string[] | null;
  related_career_ids: string[] | null;
  related_project_ids: string[] | null;
  related_content_ids: string[] | null;
  related_certification_slugs: string[] | null;
};

export async function rebuildRelationsForContent(
  supabase: SupabaseClient,
  contentId: string,
): Promise<{ inserted: number }> {
  const { data: item } = await supabase
    .from("content_items")
    .select("id, type, tag_slugs, focus_topic, related_topics, related_course_ids, related_career_ids, related_project_ids, related_content_ids, related_certification_slugs")
    .eq("id", contentId)
    .maybeSingle();
  if (!item) return { inserted: 0 };
  const row = item as Row;

  await supabase.from("content_relations").delete().eq("source_id", contentId).eq("auto_generated", true);

  const rows: Array<Record<string, unknown>> = [];
  for (const cId of row.related_course_ids ?? []) {
    rows.push({ source_id: contentId, target_type: "course", target_id: cId, relation: "related", weight: 2.0, auto_generated: true });
  }
  for (const cId of row.related_career_ids ?? []) {
    rows.push({ source_id: contentId, target_type: "career", target_id: cId, relation: "related", weight: 1.8, auto_generated: true });
  }
  for (const pId of row.related_project_ids ?? []) {
    rows.push({ source_id: contentId, target_type: "project", target_id: pId, relation: "related", weight: 1.4, auto_generated: true });
  }
  for (const oId of row.related_content_ids ?? []) {
    rows.push({ source_id: contentId, target_type: "content", target_id: oId, relation: "related", weight: 1.6, auto_generated: true });
  }
  for (const slug of row.related_certification_slugs ?? []) {
    rows.push({ source_id: contentId, target_type: "certification", target_slug: slug, relation: "related", weight: 1.2, auto_generated: true });
  }

  // Tag-based sibling discovery (top 10 published content sharing any tag).
  const tags = row.tag_slugs ?? [];
  if (tags.length) {
    const { data: siblings } = await supabase
      .from("content_items")
      .select("id, tag_slugs")
      .eq("status", "published")
      .neq("id", contentId)
      .overlaps("tag_slugs", tags)
      .limit(10);
    for (const s of (siblings ?? []) as Array<{ id: string; tag_slugs: string[] | null }>) {
      const shared = (s.tag_slugs ?? []).filter((t) => tags.includes(t)).length;
      rows.push({
        source_id: contentId,
        target_type: "content",
        target_id: s.id,
        relation: "related",
        weight: 0.5 + shared * 0.3,
        auto_generated: true,
      });
    }
  }

  if (!rows.length) return { inserted: 0 };
  const { error } = await supabase.from("content_relations").insert(rows);
  if (error) throw new Error(error.message);
  return { inserted: rows.length };
}
