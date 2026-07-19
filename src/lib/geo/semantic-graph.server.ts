// GEO Semantic Relationship Engine.
// Persists relationships between entities/topics/content into geo_relationships.

type Sb = { from: (t: string) => any };

export type RelInput = {
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  relation: string;
  weight?: number;
  reason?: string;
  meta?: Record<string, unknown>;
};

export async function upsertRelationships(sb: Sb, rels: RelInput[]) {
  if (!rels.length) return { inserted: 0 };
  const rows = rels.map((r) => ({
    from_type: r.from_type,
    from_id: r.from_id,
    to_type: r.to_type,
    to_id: r.to_id,
    relation: r.relation,
    weight: r.weight ?? 1,
    reason: r.reason ?? null,
    meta: r.meta ?? {},
  }));
  const { data, error } = await sb
    .from("geo_relationships")
    .upsert(rows, {
      onConflict: "from_type,from_id,to_type,to_id,relation",
      ignoreDuplicates: false,
    })
    .select("id");
  if (error) throw error;
  return { inserted: data?.length ?? 0 };
}

export async function relationshipsFor(
  sb: Sb,
  contentType: string,
  contentId: string,
  limit = 100,
) {
  const { data, error } = await sb
    .from("geo_relationships")
    .select("*")
    .or(
      `and(from_type.eq.${contentType},from_id.eq.${contentId}),and(to_type.eq.${contentType},to_id.eq.${contentId})`,
    )
    .order("weight", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Build entity ↔ content edges from an entity-mention set. */
export function buildEntityContentEdges(
  contentType: string,
  contentId: string,
  entities: Array<{ id: string; salience: number }>,
): RelInput[] {
  return entities.map((e) => ({
    from_type: "content",
    from_id: `${contentType}:${contentId}`,
    to_type: "entity",
    to_id: e.id,
    relation: "mentions",
    weight: e.salience,
    reason: "auto-extracted",
  }));
}
