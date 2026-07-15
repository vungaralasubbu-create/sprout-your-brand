import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const PRICING_PLANS = ["self_paced_edge", "career_launch", "career_pro"] as const;
export type PricingPlan = (typeof PRICING_PLANS)[number];
export const PRICING_PLAN_LABELS: Record<PricingPlan, string> = {
  self_paced_edge: "Self-Paced Edge",
  career_launch: "Career Launch",
  career_pro: "Career Pro",
};

export type CommissionType = "percentage" | "fixed" | "bonus";

export type CommissionRule = {
  id: string;
  rule_code: string | null;
  name: string;
  description: string | null;
  program_id: string | null;
  pricing_plan: string | null;
  campaign_id: string | null;
  commission_type: CommissionType;
  commission_percentage: number;
  fixed_amount: number | null;
  base_definition: string;
  rule_priority: number;
  max_commission_pct: number | null;
  version: number;
  is_active: boolean;
  visibility: string;
  effective_from: string;
  effective_to: string | null;
  eligibility_notes: string | null;
};

export type ProgramCommissionCard = {
  program_id: string;
  program_slug: string;
  program_name: string;
  category: string | null;
  offer_price: number | null;
  base_price: number | null;
  plans: Array<{
    plan: PricingPlan;
    plan_label: string;
    rule: CommissionRule | null;
  }>;
  best_rule: CommissionRule | null;
  has_bonus: boolean;
};

export type BonusCampaign = {
  id: string;
  campaign_code: string | null;
  name: string;
  description: string | null;
  campaign_type: string;
  program_id: string | null;
  pricing_plan: string | null;
  campus_scope: string | null;
  bonus_percentage: number | null;
  fixed_bonus_amount: number | null;
  max_commission_pct: number | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  banner_text: string | null;
  terms: string | null;
  milestones: Array<{
    id: string;
    milestone_code: string | null;
    name: string;
    description: string | null;
    threshold_type: string;
    threshold_value: number;
    bonus_amount: number;
    display_order: number;
    achieved: boolean;
    my_progress: number;
    achieved_at: string | null;
  }>;
};

async function resolveAmbassadorId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("campus_ambassador_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

/** Pick the most specific active published rule for (program, plan). */
function pickRule(
  rules: CommissionRule[],
  programId: string,
  plan: PricingPlan,
): CommissionRule | null {
  const now = Date.now();
  const applicable = rules.filter((r) => {
    if (!r.is_active) return false;
    if (r.visibility !== "published") return false;
    if (new Date(r.effective_from).getTime() > now) return false;
    if (r.effective_to && new Date(r.effective_to).getTime() < now) return false;
    if (r.program_id && r.program_id !== programId) return false;
    if (r.pricing_plan && r.pricing_plan !== plan) return false;
    return true;
  });
  if (!applicable.length) return null;
  // Specificity score: program+plan > program > plan > generic. Then rule_priority (lower first), then higher %.
  return applicable.sort((a, b) => {
    const scoreA = (a.program_id ? 2 : 0) + (a.pricing_plan ? 1 : 0);
    const scoreB = (b.program_id ? 2 : 0) + (b.pricing_plan ? 1 : 0);
    if (scoreA !== scoreB) return scoreB - scoreA;
    if (a.rule_priority !== b.rule_priority) return a.rule_priority - b.rule_priority;
    return Number(b.commission_percentage) - Number(a.commission_percentage);
  })[0];
}

function mapRule(r: any): CommissionRule {
  return {
    id: r.id,
    rule_code: r.rule_code,
    name: r.name,
    description: r.description ?? null,
    program_id: r.program_id ?? null,
    pricing_plan: r.pricing_plan ?? null,
    campaign_id: r.campaign_id ?? null,
    commission_type: (r.commission_type as CommissionType) ?? "percentage",
    commission_percentage: Number(r.commission_percentage ?? 0),
    fixed_amount: r.fixed_amount != null ? Number(r.fixed_amount) : null,
    base_definition: r.base_definition ?? "verified_program_selling_price",
    rule_priority: Number(r.rule_priority ?? 100),
    max_commission_pct: r.max_commission_pct != null ? Number(r.max_commission_pct) : null,
    version: Number(r.version ?? 1),
    is_active: !!r.is_active,
    visibility: r.visibility ?? "published",
    effective_from: r.effective_from,
    effective_to: r.effective_to,
    eligibility_notes: r.eligibility_notes ?? null,
  };
}

/** Main data for the Commission Structure page. */
export const getAmbassadorCommissionStructure = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const ambassadorId = await resolveAmbassadorId(supabase, userId);

    const [rulesRes, coursesRes, catsRes, campaignsRes, milestonesRes] = await Promise.all([
      supabase
        .from("ambassador_commission_rules")
        .select(
          "id, rule_code, name, description, program_id, pricing_plan, campaign_id, commission_type, commission_percentage, fixed_amount, base_definition, rule_priority, max_commission_pct, version, is_active, visibility, effective_from, effective_to, eligibility_notes",
        )
        .eq("visibility", "published"),
      supabase
        .from("courses")
        .select("id, slug, name, offer_price, base_price, category_id, display_order")
        .eq("is_published", true)
        .eq("status", "published")
        .order("display_order", { ascending: true }),
      supabase.from("course_categories").select("id, name, slug").eq("is_active", true),
      supabase
        .from("ambassador_bonus_campaigns")
        .select(
          "id, campaign_code, name, description, campaign_type, program_id, pricing_plan, campus_scope, bonus_percentage, fixed_bonus_amount, max_commission_pct, starts_at, ends_at, status, banner_text, terms",
        )
        .eq("visibility", "published")
        .in("status", ["scheduled", "active", "paused"]),
      supabase
        .from("ambassador_campaign_milestones")
        .select("id, campaign_id, milestone_code, name, description, threshold_type, threshold_value, bonus_amount, display_order, is_active")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

    const allRules = (rulesRes.data ?? []).map(mapRule) as CommissionRule[];
    const courses = (coursesRes.data ?? []) as any[];
    const cats = new Map((catsRes.data ?? []).map((c: any) => [c.id, c.name as string]));
    const campaignsRaw = (campaignsRes.data ?? []) as any[];
    const allMilestones = (milestonesRes.data ?? []) as any[];

    // Achievements for this ambassador
    let achievements: any[] = [];
    let verifiedCount = 0;
    let referralCount = 0;
    let commissionEarned = 0;
    if (ambassadorId) {
      const [achRes, vc, rc, ce] = await Promise.all([
        supabase
          .from("ambassador_campaign_milestone_achievements")
          .select("milestone_id, achieved_at, eligibility_status")
          .eq("ambassador_id", ambassadorId),
        supabase
          .from("ambassador_commissions")
          .select("id", { count: "exact", head: true })
          .eq("ambassador_id", ambassadorId)
          .in("status", ["approved", "available", "paid", "payout_processing"]),
        supabase
          .from("ambassador_referral_leads")
          .select("id", { count: "exact", head: true })
          .eq("ambassador_id", ambassadorId),
        supabase
          .from("ambassador_commissions")
          .select("calculated_commission")
          .eq("ambassador_id", ambassadorId)
          .in("status", ["approved", "available", "paid", "payout_processing"]),
      ]);
      achievements = achRes.data ?? [];
      verifiedCount = vc.count ?? 0;
      referralCount = rc.count ?? 0;
      commissionEarned = (ce.data ?? []).reduce(
        (a: number, r: any) => a + Number(r.calculated_commission ?? 0),
        0,
      );
    }
    const achievedMs = new Map(achievements.map((a) => [a.milestone_id, a]));

    // Program cards
    const programCards: ProgramCommissionCard[] = courses.map((c) => {
      const programKey = c.slug as string;
      const plans = PRICING_PLANS.map((plan) => {
        const rule = pickRule(allRules, programKey, plan);
        return { plan, plan_label: PRICING_PLAN_LABELS[plan], rule };
      });
      const withRule = plans.filter((p) => p.rule);
      const best = withRule.length
        ? withRule.reduce((best, p) => {
            const cur = Number(p.rule!.commission_percentage);
            const b = best ? Number(best.commission_percentage) : -1;
            return cur > b ? p.rule! : best;
          }, null as CommissionRule | null)
        : null;
      const hasBonus = campaignsRaw.some(
        (cp) => !cp.program_id || cp.program_id === programKey,
      );
      return {
        program_id: programKey,
        program_slug: c.slug,
        program_name: c.name,
        category: cats.get(c.category_id) ?? null,
        offer_price: c.offer_price ? Number(c.offer_price) : null,
        base_price: c.base_price ? Number(c.base_price) : null,
        plans,
        best_rule: best,
        has_bonus: hasBonus,
      };
    });

    // Filter cards that have at least one applicable rule OR a generic rule that applies
    const eligibleCards = programCards.filter((c) => c.best_rule);

    // Campaigns with progress
    const campaigns: BonusCampaign[] = campaignsRaw.map((cp) => {
      const ms = allMilestones.filter((m) => m.campaign_id === cp.id);
      return {
        id: cp.id,
        campaign_code: cp.campaign_code,
        name: cp.name,
        description: cp.description,
        campaign_type: cp.campaign_type,
        program_id: cp.program_id,
        pricing_plan: cp.pricing_plan,
        campus_scope: cp.campus_scope,
        bonus_percentage: cp.bonus_percentage != null ? Number(cp.bonus_percentage) : null,
        fixed_bonus_amount:
          cp.fixed_bonus_amount != null ? Number(cp.fixed_bonus_amount) : null,
        max_commission_pct:
          cp.max_commission_pct != null ? Number(cp.max_commission_pct) : null,
        starts_at: cp.starts_at,
        ends_at: cp.ends_at,
        status: cp.status,
        banner_text: cp.banner_text,
        terms: cp.terms,
        milestones: ms.map((m) => {
          const progressBase =
            m.threshold_type === "referral_leads"
              ? referralCount
              : m.threshold_type === "commission_earned"
                ? commissionEarned
                : verifiedCount;
          const ach = achievedMs.get(m.id);
          return {
            id: m.id,
            milestone_code: m.milestone_code,
            name: m.name,
            description: m.description,
            threshold_type: m.threshold_type,
            threshold_value: Number(m.threshold_value),
            bonus_amount: Number(m.bonus_amount),
            display_order: Number(m.display_order),
            achieved: !!ach,
            achieved_at: ach?.achieved_at ?? null,
            my_progress: progressBase,
          };
        }),
      };
    });

    // Summary
    const highestRate = eligibleCards.reduce(
      (m, c) => Math.max(m, c.best_rule ? Number(c.best_rule.commission_percentage) : 0),
      0,
    );

    return {
      hasAmbassador: !!ambassadorId,
      programs: eligibleCards,
      allRules,
      campaigns,
      summary: {
        eligibleProgramsCount: eligibleCards.length,
        highestAvailableRate: highestRate,
        activeCampaignsCount: campaigns.filter((c) => c.status === "active").length,
        commissionRulesCount: allRules.length,
      },
    };
  });

/** Details for one program+plan combination. */
export const getAmbassadorCommissionRuleDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { programSlug: string; plan?: PricingPlan }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: course }, rulesRes, campaignsRes] = await Promise.all([
      supabase
        .from("courses")
        .select("id, slug, name, offer_price, base_price, category_id")
        .eq("slug", data.programSlug)
        .maybeSingle(),
      supabase
        .from("ambassador_commission_rules")
        .select("*")
        .eq("visibility", "published"),
      supabase
        .from("ambassador_bonus_campaigns")
        .select("*")
        .eq("visibility", "published")
        .in("status", ["scheduled", "active"]),
    ]);

    if (!course) throw new Error("Program not found");
    const rules = (rulesRes.data ?? []).map(mapRule);
    const plan = data.plan ?? "career_pro";
    const current = pickRule(rules, course.slug, plan);

    // Upcoming = future effective_from
    const now = Date.now();
    const forThisProgram = rules.filter(
      (r) => !r.program_id || r.program_id === course.slug,
    );
    const upcoming = forThisProgram.filter(
      (r) => new Date(r.effective_from).getTime() > now,
    );
    const previous = forThisProgram.filter(
      (r) => r.effective_to && new Date(r.effective_to).getTime() < now,
    );

    const relatedCampaigns = (campaignsRes.data ?? []).filter(
      (c: any) => !c.program_id || c.program_id === course.slug,
    );

    return {
      course: {
        id: course.id,
        slug: course.slug,
        name: course.name,
        offer_price: course.offer_price ? Number(course.offer_price) : null,
        base_price: course.base_price ? Number(course.base_price) : null,
      },
      plan,
      currentRule: current,
      plans: PRICING_PLANS.map((p) => ({
        plan: p,
        plan_label: PRICING_PLAN_LABELS[p],
        rule: pickRule(rules, course.slug, p),
      })),
      upcoming,
      previous,
      relatedCampaigns,
    };
  });

/** Commission Estimator: pure calculation using published rules. */
export const estimateAmbassadorCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        programSlug: z.string().min(1),
        plan: z.enum(PRICING_PLANS),
        exampleAmount: z.number().min(0).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: course }, rulesRes, campaignsRes] = await Promise.all([
      supabase
        .from("courses")
        .select("id, slug, name, offer_price")
        .eq("slug", data.programSlug)
        .maybeSingle(),
      supabase
        .from("ambassador_commission_rules")
        .select("*")
        .eq("visibility", "published"),
      supabase
        .from("ambassador_bonus_campaigns")
        .select("*")
        .eq("visibility", "published")
        .eq("status", "active"),
    ]);
    if (!course) throw new Error("Program not found");
    const rules = (rulesRes.data ?? []).map(mapRule);
    const rule = pickRule(rules, course.slug, data.plan);
    const applicableCampaigns = (campaignsRes.data ?? []).filter(
      (c: any) =>
        (!c.program_id || c.program_id === course.slug) &&
        (!c.pricing_plan || c.pricing_plan === data.plan),
    );

    const eligibleAmount =
      data.exampleAmount ?? (course.offer_price ? Number(course.offer_price) : 0);

    let baseRate = rule && rule.commission_type === "percentage" ? rule.commission_percentage : 0;
    let bonusRate = 0;
    let fixedBonus = 0;
    for (const cp of applicableCampaigns) {
      if (cp.campaign_type === "percentage_bonus" && cp.bonus_percentage != null) {
        bonusRate += Number(cp.bonus_percentage);
      } else if (cp.campaign_type === "fixed_bonus" && cp.fixed_bonus_amount != null) {
        fixedBonus += Number(cp.fixed_bonus_amount);
      }
    }
    const maxCap = rule?.max_commission_pct
      ? Number(rule.max_commission_pct)
      : applicableCampaigns.reduce(
          (m: number, c: any) =>
            c.max_commission_pct != null ? Math.max(m, Number(c.max_commission_pct)) : m,
          0,
        );
    let effectiveRate = baseRate + bonusRate;
    if (maxCap > 0) effectiveRate = Math.min(effectiveRate, maxCap);

    let estimatedCommission = 0;
    if (rule?.commission_type === "fixed" && rule.fixed_amount != null) {
      estimatedCommission = rule.fixed_amount + fixedBonus;
    } else {
      estimatedCommission = (eligibleAmount * effectiveRate) / 100 + fixedBonus;
    }

    return {
      programName: course.name,
      programSlug: course.slug,
      plan: data.plan,
      planLabel: PRICING_PLAN_LABELS[data.plan],
      rule,
      eligibleAmount,
      baseRate,
      bonusRate,
      fixedBonus,
      maxCap: maxCap || null,
      effectiveRate,
      estimatedCommission,
    };
  });
