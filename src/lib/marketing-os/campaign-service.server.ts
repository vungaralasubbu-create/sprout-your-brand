/**
 * Shared, RLS-safe campaign creation service.
 *
 * SINGLE source of truth for:
 *   1. Resolving a `brand_id` the caller actually owns (RLS on mkt_campaigns
 *      enforces `brand.owner_id = auth.uid()`).
 *   2. Inserting into `public.mkt_campaigns` with the correct owner/creator
 *      stamps.
 *
 * All campaign inserts (Marketing OS project orchestrator, saveCampaign,
 * duplicateCampaign, createFromTemplate, template flows) MUST route through
 * this module. Do not hand-roll another mkt_campaigns.insert or a second
 * brand resolver.
 *
 * Additive: preserves existing call signatures — the previous
 * `resolveAccessibleBrandId` / `ensureDefaultBrand` helpers now delegate here.
 */

export type CampaignInsertPayload = Record<string, unknown> & {
  name: string;
};

/**
 * Return a mkt_brands.id the caller OWNS. Order of resolution:
 *   1. preferredBrandId if owner_id = userId
 *   2. brand referenced by user's most-recent mkt_brand_kit
 *   3. user's most-recent owned mkt_brands row
 *   4. seed a new "My Brand" row owned by the user
 *
 * Guaranteed to satisfy the `campaigns via brand` RLS policy on insert.
 */
export async function resolveOwnedBrandId(
  supabase: any,
  userId: string,
  preferredBrandId?: string | null,
): Promise<string> {
  if (preferredBrandId) {
    const { data } = await supabase
      .from("mkt_brands")
      .select("id")
      .eq("id", preferredBrandId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  const { data: kit } = await supabase
    .from("mkt_brand_kits")
    .select("id,brand_id,business_name,name,tone_of_voice,colors,logos,updated_at")
    .eq("owner_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (kit?.brand_id) {
    const { data: kitBrand } = await supabase
      .from("mkt_brands")
      .select("id")
      .eq("id", kit.brand_id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (kitBrand?.id) return kitBrand.id as string;
  }

  const { data: own } = await supabase
    .from("mkt_brands")
    .select("id, updated_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (own?.id) return own.id as string;

  let brandName = "My Brand";
  let tone: string | null = null;
  let primaryColor: string | null = null;
  let logoUrl: string | null = null;
  if (kit) {
    brandName = (kit.business_name || kit.name || brandName) as string;
    if (Array.isArray(kit.tone_of_voice) && kit.tone_of_voice.length) {
      tone = String(kit.tone_of_voice[0]);
    }
    const colors = (kit.colors ?? {}) as Record<string, unknown>;
    if (typeof (colors as any)?.primary === "string") primaryColor = (colors as any).primary;
    const logos = (kit.logos ?? {}) as Record<string, unknown>;
    if (typeof (logos as any)?.primary === "string") logoUrl = (logos as any).primary;
  }

  const { data: created, error } = await supabase
    .from("mkt_brands")
    .insert({
      owner_id: userId,
      name: brandName,
      tone,
      primary_color: primaryColor,
      logo_url: logoUrl,
    })
    .select("id")
    .single();
  if (error || !created?.id) {
    throw new Error(
      `Unable to prepare a brand workspace for campaigns: ${error?.message ?? "unknown error"}`,
    );
  }
  if (kit?.id) {
    await supabase
      .from("mkt_brand_kits")
      .update({ brand_id: created.id })
      .eq("id", kit.id)
      .eq("owner_id", userId);
  }
  return created.id as string;
}

/**
 * Insert a mkt_campaigns row against an RLS-safe brand. This is the ONLY
 * place that should perform the insert. Callers pass their existing payload
 * (minus brand_id / created_by / owner_id, which are stamped here).
 */
export async function createCampaignForUser(
  supabase: any,
  userId: string,
  payload: CampaignInsertPayload,
  opts: { preferredBrandId?: string | null } = {},
): Promise<any> {
  const brandId = await resolveOwnedBrandId(
    supabase,
    userId,
    opts.preferredBrandId ?? (payload as any).brand_id ?? null,
  );

  const insertRow = {
    ...payload,
    brand_id: brandId,
    created_by: userId,
    owner_id: (payload as any).owner_id ?? userId,
  };

  const { data, error } = await supabase
    .from("mkt_campaigns")
    .insert(insertRow)
    .select()
    .single();
  if (error) {
    throw new Error(
      `Failed to create campaign (${(error as any).code ?? "db_error"}): ${error.message}. brand_id=${brandId}`,
    );
  }
  return data;
}


