/**
 * Segment evaluation. Compiles an EngageSegmentRules blob into a Supabase
 * query against the appropriate audience table (student_profiles, partners,
 * partner_brand_profiles, admin_users). Returns the array of recipient
 * emails + user ids that match.
 */

import type { EngageAudience, EngageSegmentRules } from "./types";

export interface EvaluatedSegment {
  recipients: Array<{ user_id: string | null; email: string; first_name?: string | null; country?: string | null }>;
  total: number;
}

export async function evaluateSegment(
  audience: EngageAudience,
  rules: EngageSegmentRules,
  brandId?: string | null,
): Promise<EvaluatedSegment> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Base source per audience.
  let baseQuery;
  switch (audience) {
    case "students":
      baseQuery = supabaseAdmin
        .from("student_profiles")
        .select("user_id, email, first_name, country");
      break;
    case "partners":
      baseQuery = supabaseAdmin
        .from("partners")
        .select("user_id, email, first_name, country");
      break;
    case "brand_owners":
      baseQuery = supabaseAdmin
        .from("partner_brand_profiles")
        .select("user_id, contact_email, brand_name")
        .not("contact_email", "is", null);
      break;
    case "instructors":
    case "admins":
      baseQuery = supabaseAdmin
        .from("admin_users")
        .select("user_id, email, first_name");
      break;
    default:
      baseQuery = supabaseAdmin
        .from("student_profiles")
        .select("user_id, email, first_name, country");
  }

  // Apply rules (a lightweight subset — the UI limits ops to what we support).
  const conds = rules.all ?? rules.any ?? [];
  for (const rule of conds) {
    switch (rule.op) {
      case "=":
        baseQuery = baseQuery.eq(rule.field, rule.value as never);
        break;
      case "!=":
        baseQuery = baseQuery.neq(rule.field, rule.value as never);
        break;
      case "in":
        baseQuery = baseQuery.in(rule.field, (rule.value as unknown[]) ?? []);
        break;
      case "not_in":
        // approximation: not.in requires PostgREST filter syntax
        baseQuery = baseQuery.not(rule.field, "in", `(${(rule.value as string[]).join(",")})`);
        break;
      case "contains":
        baseQuery = baseQuery.ilike(rule.field, `%${rule.value as string}%`);
        break;
      case "exists":
        baseQuery = baseQuery.not(rule.field, "is", null);
        break;
      case "not_exists":
        baseQuery = baseQuery.is(rule.field, null);
        break;
      case ">":
        baseQuery = baseQuery.gt(rule.field, rule.value as never);
        break;
      case ">=":
        baseQuery = baseQuery.gte(rule.field, rule.value as never);
        break;
      case "<":
        baseQuery = baseQuery.lt(rule.field, rule.value as never);
        break;
      case "<=":
        baseQuery = baseQuery.lte(rule.field, rule.value as never);
        break;
    }
  }

  if (brandId && audience === "students") {
    // Optional: scope students to a brand via enrollments
    const { data: enrolledIds } = await supabaseAdmin
      .from("enrollments")
      .select("user_id, courses!inner(brand_id)")
      .eq("courses.brand_id", brandId);
    const ids = new Set((enrolledIds ?? []).map((r) => (r as { user_id: string }).user_id));
    if (ids.size > 0) {
      baseQuery = baseQuery.in("user_id", Array.from(ids));
    }
  }

  const { data, error } = await baseQuery.limit(50000);
  if (error) {
    return { recipients: [], total: 0 };
  }

  const recipients = (data ?? [])
    .map((row) => {
      const r = row as Record<string, unknown>;
      const email = (r.email as string) ?? (r.contact_email as string) ?? "";
      return {
        user_id: (r.user_id as string) ?? null,
        email,
        first_name: (r.first_name as string) ?? (r.brand_name as string) ?? null,
        country: (r.country as string) ?? null,
      };
    })
    .filter((r) => r.email && r.email.includes("@"));

  return { recipients, total: recipients.length };
}
