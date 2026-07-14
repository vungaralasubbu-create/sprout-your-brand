import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Sales Partner: list their own ownership review submissions. Never exposes other partners' data. */
export const listMyOwnershipReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    const partnerId = p?.id as string | undefined;
    if (!partnerId) return { reviews: [] };

    const { data, error } = await supabase
      .from("lead_ownership_reviews")
      .select(
        "id, submitted_full_name, submitted_mobile, submitted_program_interest, submitted_source, status, admin_reason, decided_at, created_at, submitted_course_id, courses:submitted_course_id(name)",
      )
      .eq("claiming_partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    return {
      reviews: (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.submitted_full_name,
        // Mask mobile for the submitting partner's own record too — matches "private" spec.
        mobile_masked: maskMobile(r.submitted_mobile),
        program: r.courses?.name ?? r.submitted_program_interest ?? "—",
        source: r.submitted_source ?? "—",
        status: r.status as string,
        admin_reason: r.admin_reason,
        decided_at: r.decided_at,
        created_at: r.created_at,
      })),
    };
  });

function maskMobile(m: string | null | undefined) {
  const digits = (m ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return digits.slice(0, 2) + "••••" + digits.slice(-2);
}
