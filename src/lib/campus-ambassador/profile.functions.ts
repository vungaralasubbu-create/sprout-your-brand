import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Helpers ----
async function loadAmbassador(context: any) {
  const { supabase, userId } = context;
  const { data } = await supabase
    .from("campus_ambassador_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

const COMPLETION_FIELDS: Array<{ key: string; label: string; check: (p: any) => boolean }> = [
  { key: "profile_photo", label: "Add Profile Photo", check: (p) => !!p.profile_photo_url },
  { key: "first_name", label: "Add First Name", check: (p) => !!(p.first_name || "").trim() },
  { key: "last_name", label: "Add Last Name", check: (p) => !!(p.last_name || "").trim() },
  { key: "college", label: "Confirm College / University", check: (p) => !!(p.college_name || "").trim() },
  { key: "degree", label: "Add Course / Degree", check: (p) => !!(p.degree_course || "").trim() },
  { key: "year", label: "Add Academic Year", check: (p) => !!(p.current_year_of_study || "").trim() },
  { key: "grad_year", label: "Add Graduation Year", check: (p) => !!p.expected_graduation_year },
  { key: "city", label: "Add City", check: (p) => !!(p.city || p.campus_city || "").trim() },
  { key: "state", label: "Add State", check: (p) => !!(p.state || "").trim() },
  { key: "contact", label: "Verified Contact Method", check: (p) => !!p.mobile || !!p.email },
];

function computeCompletion(p: any) {
  const items = COMPLETION_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    done: !!f.check(p),
  }));
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  return { pct, items, done, total: items.length };
}

// ---- GET PROFILE ----
export const getAmbassadorProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;

    let level = null;
    if (amb.current_level_id) {
      const { data } = await supabase
        .from("ambassador_levels")
        .select("*")
        .eq("id", amb.current_level_id)
        .maybeSingle();
      level = data;
    }

    const completion = computeCompletion(amb);

    return {
      gate: "ok" as const,
      profile: amb,
      currentLevel: level,
      completion,
    };
  });

// ---- UPDATE PERSONAL / SOCIAL / BIO / ACADEMIC ----
const UPDATE_ALLOWED_FIELDS = z.object({
  first_name: z.string().trim().max(80).optional(),
  last_name: z.string().trim().max(80).optional(),
  display_name: z.string().trim().max(80).optional().nullable(),
  bio: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  campus_city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  degree_course: z.string().trim().max(120).optional().nullable(),
  specialisation: z.string().trim().max(120).optional().nullable(),
  current_year_of_study: z
    .enum(["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Postgraduate", "Other"])
    .optional(),
  expected_graduation_year: z.number().int().min(2020).max(2040).optional().nullable(),
  linkedin_url: z.string().trim().max(300).url().optional().nullable().or(z.literal("")),
  instagram_url: z.string().trim().max(300).optional().nullable(),
  youtube_url: z.string().trim().max(300).url().optional().nullable().or(z.literal("")),
  other_profile_url: z.string().trim().max(300).url().optional().nullable().or(z.literal("")),
  full_name: z.string().trim().max(120).optional(),
});

export const updateAmbassadorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UPDATE_ALLOWED_FIELDS.parse(d))
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;

    const patch: any = { ...data };

    // If Instagram supplied as username, normalise
    if (patch.instagram_url && !patch.instagram_url.startsWith("http")) {
      const u = String(patch.instagram_url).trim().replace(/^@/, "");
      if (/^[a-zA-Z0-9._]{1,30}$/.test(u)) {
        patch.instagram_url = `https://instagram.com/${u}`;
      } else if (patch.instagram_url === "") {
        patch.instagram_url = null;
      } else {
        return { gate: "error" as const, message: "Invalid Instagram profile" };
      }
    }
    if (patch.linkedin_url === "") patch.linkedin_url = null;
    if (patch.youtube_url === "") patch.youtube_url = null;
    if (patch.other_profile_url === "") patch.other_profile_url = null;

    // Merge full_name from first/last if provided
    if (!patch.full_name && (patch.first_name || patch.last_name)) {
      const fn = patch.first_name ?? amb.first_name ?? "";
      const ln = patch.last_name ?? amb.last_name ?? "";
      const merged = `${fn} ${ln}`.trim();
      if (merged) patch.full_name = merged;
    }

    // Recompute completion
    const next = { ...amb, ...patch };
    patch.profile_completion_percentage = computeCompletion(next).pct;

    const { error } = await supabase
      .from("campus_ambassador_profiles")
      .update(patch)
      .eq("id", amb.id);
    if (error) return { gate: "error" as const, message: error.message };

    await supabase.from("ambassador_profile_activity").insert({
      ambassador_id: amb.id,
      event_type: "profile_updated",
      description: "Profile updated",
    });

    // Re-evaluate level after completion change
    await supabase.rpc("evaluate_ambassador_level", { _ambassador_id: amb.id });

    return { gate: "ok" as const };
  });

// ---- UPDATE PROFILE PHOTO ----
export const updateProfilePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ storagePath: z.string().min(1).max(500).nullable() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;

    let url: string | null = null;
    if (data.storagePath) {
      const { data: signed } = await supabase.storage
        .from("ambassador-profile-photos")
        .createSignedUrl(data.storagePath, 60 * 60 * 24 * 365);
      url = signed?.signedUrl || null;
    }

    const next = { ...amb, profile_photo_url: url };
    const pct = computeCompletion(next).pct;

    await supabase
      .from("campus_ambassador_profiles")
      .update({ profile_photo_url: url, profile_completion_percentage: pct })
      .eq("id", amb.id);

    await supabase.from("ambassador_profile_activity").insert({
      ambassador_id: amb.id,
      event_type: url ? "profile_photo_updated" : "profile_photo_removed",
      description: url ? "Profile photo updated" : "Profile photo removed",
    });

    return { gate: "ok" as const, url };
  });

// ---- INSTITUTION SUGGESTION ----
export const suggestInstitution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(3).max(200),
        city: z.string().trim().max(80).optional(),
        state: z.string().trim().max(80).optional(),
        website: z.string().trim().max(300).url().optional().or(z.literal("")),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("ambassador_institution_suggestions")
      .insert({
        ambassador_id: amb.id,
        suggested_name: data.name,
        city: data.city || null,
        state: data.state || null,
        official_website: data.website || null,
      })
      .select("id")
      .single();
    if (error) return { gate: "error" as const, message: error.message };
    await supabase.from("ambassador_profile_activity").insert({
      ambassador_id: amb.id,
      event_type: "institution_suggested",
      description: `Suggested institution: ${data.name}`,
    });
    return { gate: "ok" as const, id: row.id };
  });

// ---- COLLEGE CHANGE REQUEST ----
export const requestCollegeChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        requestedCollege: z.string().trim().min(3).max(200),
        requestedCity: z.string().trim().max(80).optional(),
        requestedState: z.string().trim().max(80).optional(),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("ambassador_college_change_requests")
      .insert({
        ambassador_id: amb.id,
        current_college_name: amb.college_name || "",
        requested_college_name: data.requestedCollege,
        requested_city: data.requestedCity || null,
        requested_state: data.requestedState || null,
        change_reason: data.reason || null,
      })
      .select("id")
      .single();
    if (error) return { gate: "error" as const, message: error.message };
    await supabase.from("ambassador_profile_activity").insert({
      ambassador_id: amb.id,
      event_type: "college_change_requested",
      description: `Requested college change to: ${data.requestedCollege}`,
    });
    return { gate: "ok" as const, id: row.id };
  });

// ---- PERFORMANCE ----
export const getAmbassadorPerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        period: z.enum(["7d", "30d", "90d", "year", "all"]).default("30d"),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;

    let since: string | null = null;
    const now = new Date();
    if (data.period === "7d") since = new Date(now.getTime() - 7 * 864e5).toISOString();
    else if (data.period === "30d") since = new Date(now.getTime() - 30 * 864e5).toISOString();
    else if (data.period === "90d") since = new Date(now.getTime() - 90 * 864e5).toISOString();
    else if (data.period === "year")
      since = new Date(now.getFullYear(), 0, 1).toISOString();

    // Referral leads
    let leadsQ = supabase
      .from("ambassador_referral_leads")
      .select("id, created_at", { count: "exact", head: false })
      .eq("ambassador_id", amb.id);
    if (since) leadsQ = leadsQ.gte("created_at", since);
    const { data: leadsRows, count: leadsCount } = await leadsQ;

    // Commissions
    let commQ = supabase
      .from("ambassador_commissions")
      .select("id, amount_final, status, created_at, approved_at")
      .eq("ambassador_id", amb.id);
    if (since) commQ = commQ.gte("created_at", since);
    const { data: commRows } = await commQ;

    const verifiedEnrollments = (commRows || []).filter((c: any) =>
      ["approved", "paid", "available"].includes(c.status)
    ).length;
    const commissionEarned = (commRows || [])
      .filter((c: any) => ["approved", "paid", "available"].includes(c.status))
      .reduce((s: number, c: any) => s + Number(c.amount_final || 0), 0);
    const availableEarnings = (commRows || [])
      .filter((c: any) => c.status === "available")
      .reduce((s: number, c: any) => s + Number(c.amount_final || 0), 0);

    const conversion =
      (leadsCount || 0) > 0 ? (verifiedEnrollments / (leadsCount || 1)) * 100 : 0;

    // Marketing resources used (unique)
    let intQ = supabase
      .from("marketing_resource_interactions")
      .select("resource_id, created_at")
      .eq("ambassador_id", amb.id)
      .in("interaction_type", [
        "downloaded",
        "caption_copied",
        "share_message_copied",
        "qr_downloaded",
        "personalised_generated",
      ]);
    if (since) intQ = intQ.gte("created_at", since);
    const { data: intRows } = await intQ;
    const marketingUsed = new Set((intRows || []).map((r: any) => r.resource_id)).size;

    // Trend buckets (last 12 buckets)
    const buckets: Record<string, { label: string; leads: number; enrollments: number; commission: number }> = {};
    const bucketCount = data.period === "7d" ? 7 : data.period === "30d" ? 30 : data.period === "90d" ? 12 : 12;
    const bucketMs = data.period === "7d" ? 864e5 : data.period === "30d" ? 864e5 : 7 * 864e5;
    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * bucketMs);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = {
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        leads: 0,
        enrollments: 0,
        commission: 0,
      };
    }
    (leadsRows || []).forEach((r: any) => {
      const bucketKey = new Date(r.created_at).toISOString().slice(0, 10);
      if (buckets[bucketKey]) buckets[bucketKey].leads++;
    });
    (commRows || []).forEach((c: any) => {
      if (!["approved", "paid", "available"].includes(c.status)) return;
      const key = new Date(c.approved_at || c.created_at).toISOString().slice(0, 10);
      if (buckets[key]) {
        buckets[key].enrollments++;
        buckets[key].commission += Number(c.amount_final || 0);
      }
    });

    return {
      gate: "ok" as const,
      metrics: {
        referralLeads: leadsCount || 0,
        verifiedEnrollments,
        conversionRate: Math.round(conversion * 10) / 10,
        commissionEarned,
        availableEarnings,
        marketingResourcesUsed: marketingUsed,
      },
      trend: Object.values(buckets),
    };
  });

// ---- LEVELS ----
export const getAmbassadorLevels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;

    const { data: levels } = await supabase
      .from("ambassador_levels")
      .select("*")
      .eq("is_published", true)
      .order("level_order");

    const { data: history } = await supabase
      .from("ambassador_level_assignments")
      .select("*, level:ambassador_levels!level_id(name, level_order, icon)")
      .eq("ambassador_id", amb.id)
      .order("achieved_at", { ascending: false });

    // Compute progress
    const [{ data: commRows }, { count: leadsCount }] = await Promise.all([
      supabase
        .from("ambassador_commissions")
        .select("amount_final, status")
        .eq("ambassador_id", amb.id),
      supabase
        .from("ambassador_referral_leads")
        .select("id", { count: "exact", head: true })
        .eq("ambassador_id", amb.id),
    ]);
    const verifiedEnrollments = (commRows || []).filter((c: any) =>
      ["approved", "paid", "available"].includes(c.status)
    ).length;
    const commissionEarned = (commRows || [])
      .filter((c: any) => ["approved", "paid", "available"].includes(c.status))
      .reduce((s: number, c: any) => s + Number(c.amount_final || 0), 0);
    const conversionRate =
      (leadsCount || 0) > 0 ? (verifiedEnrollments / (leadsCount || 1)) * 100 : 0;

    const currentOrder = (levels || []).find((l: any) => l.id === amb.current_level_id)?.level_order || 0;
    const nextLevel = (levels || []).find((l: any) => l.level_order === currentOrder + 1) || null;

    return {
      gate: "ok" as const,
      levels: levels || [],
      currentLevelId: amb.current_level_id,
      history: history || [],
      nextLevel,
      progress: {
        verifiedEnrollments,
        referralLeads: leadsCount || 0,
        commissionEarned,
        conversionRate: Math.round(conversionRate * 10) / 10,
        profileCompletion: amb.profile_completion_percentage || 0,
      },
    };
  });

// ---- BADGES ----
export const getAmbassadorBadges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;

    const [{ data: badges }, { data: earned }] = await Promise.all([
      supabase
        .from("ambassador_badges")
        .select("*")
        .eq("is_published", true)
        .order("display_order"),
      supabase
        .from("ambassador_badge_achievements")
        .select("*, badge:ambassador_badges!badge_id(*)")
        .eq("ambassador_id", amb.id)
        .order("achieved_at", { ascending: false }),
    ]);

    const earnedIds = new Set((earned || []).map((e: any) => e.badge_id));

    // Compute progress values
    const [{ data: commRows }, { count: leadsCount }, { data: intRows }] = await Promise.all([
      supabase
        .from("ambassador_commissions")
        .select("amount_final, status")
        .eq("ambassador_id", amb.id),
      supabase
        .from("ambassador_referral_leads")
        .select("id", { count: "exact", head: true })
        .eq("ambassador_id", amb.id),
      supabase
        .from("marketing_resource_interactions")
        .select("resource_id")
        .eq("ambassador_id", amb.id)
        .in("interaction_type", [
          "downloaded",
          "caption_copied",
          "share_message_copied",
          "qr_downloaded",
          "personalised_generated",
        ]),
    ]);
    const verifiedEnrollments = (commRows || []).filter((c: any) =>
      ["approved", "paid", "available"].includes(c.status)
    ).length;
    const commissionEarned = (commRows || [])
      .filter((c: any) => ["approved", "paid", "available"].includes(c.status))
      .reduce((s: number, c: any) => s + Number(c.amount_final || 0), 0);
    const marketingUsed = new Set((intRows || []).map((r: any) => r.resource_id)).size;

    const progressValueFor = (rule: string) => {
      switch (rule) {
        case "referral_leads": return leadsCount || 0;
        case "verified_enrollments": return verifiedEnrollments;
        case "commission_earned": return commissionEarned;
        case "marketing_resources_used": return marketingUsed;
        default: return 0;
      }
    };

    const enriched = (badges || []).map((b: any) => ({
      ...b,
      earned: earnedIds.has(b.id),
      progressValue: progressValueFor(b.rule_type),
      earnedAt: (earned || []).find((e: any) => e.badge_id === b.id)?.achieved_at || null,
    }));

    return {
      gate: "ok" as const,
      badges: enriched,
      earned: earned || [],
      earnedCount: (earned || []).length,
      totalCount: (badges || []).length,
    };
  });

// ---- EVALUATE (client trigger) ----
export const evaluateAmbassadorAchievements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;
    await supabase.rpc("evaluate_ambassador_level", { _ambassador_id: amb.id });
    const { data: granted } = await supabase.rpc("evaluate_ambassador_badges", {
      _ambassador_id: amb.id,
    });
    return { gate: "ok" as const, granted };
  });

// ---- NOTIFICATION / PRIVACY / ACTIVITY / SETTINGS ----
export const getAmbassadorSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;
    const { data: prefs } = await supabase
      .from("ambassador_notification_preferences")
      .select("*")
      .eq("ambassador_id", amb.id)
      .maybeSingle();
    return {
      gate: "ok" as const,
      profile: amb,
      notificationPrefs:
        prefs || {
          referral_updates: true,
          enrollment_updates: true,
          commission_updates: true,
          payout_updates: true,
          campaign_updates: true,
          marketing_updates: true,
          level_badge_updates: true,
          channel_in_app: true,
          channel_email: true,
        },
    };
  });

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        referral_updates: z.boolean().optional(),
        enrollment_updates: z.boolean().optional(),
        commission_updates: z.boolean().optional(),
        payout_updates: z.boolean().optional(),
        campaign_updates: z.boolean().optional(),
        marketing_updates: z.boolean().optional(),
        level_badge_updates: z.boolean().optional(),
        channel_in_app: z.boolean().optional(),
        channel_email: z.boolean().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;
    const { error } = await supabase
      .from("ambassador_notification_preferences")
      .upsert({ ambassador_id: amb.id, ...data }, { onConflict: "ambassador_id" });
    if (error) return { gate: "error" as const, message: error.message };
    await supabase.from("ambassador_profile_activity").insert({
      ambassador_id: amb.id,
      event_type: "notification_preferences_updated",
      description: "Notification preferences updated",
    });
    return { gate: "ok" as const };
  });

export const updatePrivacyPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        leaderboard_show_first_name: z.boolean().optional(),
        leaderboard_show_college: z.boolean().optional(),
        leaderboard_show_photo: z.boolean().optional(),
        leaderboard_display_name: z.string().trim().max(60).optional().nullable(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;
    const { error } = await supabase
      .from("campus_ambassador_profiles")
      .update(data)
      .eq("id", amb.id);
    if (error) return { gate: "error" as const, message: error.message };
    await supabase.from("ambassador_profile_activity").insert({
      ambassador_id: amb.id,
      event_type: "privacy_updated",
      description: "Privacy preferences updated",
    });
    return { gate: "ok" as const };
  });

export const listProfileActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const { supabase } = context;
    const { data: rows } = await supabase
      .from("ambassador_profile_activity")
      .select("*")
      .eq("ambassador_id", amb.id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    return { gate: "ok" as const, activity: rows || [] };
  });

// ---- SIGNED URL FOR UPLOADED PHOTO PATH ----
export const getSignedPhotoUploadPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        fileName: z.string().min(1).max(200),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const amb = await loadAmbassador(context);
    if (!amb) return { gate: "no_profile" as const };
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${context.userId}/${Date.now()}_${safe}`;
    return { gate: "ok" as const, path };
  });
