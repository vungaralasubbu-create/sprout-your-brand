import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const urlOptional = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .refine(
    (v) =>
      !v ||
      /^(https?:\/\/)[^\s]+\.[^\s]+/i.test(v) ||
      /^[a-z0-9_.]+$/i.test(v),
    { message: "Enter a valid URL or handle" },
  );

const applicationInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  mobile: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v.replace(/\D/g, "").length >= 8, {
      message: "Enter a valid mobile number",
    }),
  college_name: z.string().trim().min(2).max(200),
  campus_city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  degree_course: z.string().trim().min(2).max(150),
  specialisation: z.string().trim().max(150).optional().nullable(),
  current_year_of_study: z.string().trim().min(1).max(50),
  expected_graduation_year: z
    .number()
    .int()
    .min(2020)
    .max(2050)
    .optional()
    .nullable(),
  instagram_url: urlOptional,
  linkedin_url: urlOptional,
  other_social_url: urlOptional,
  campus_network_size: z.string().trim().max(50).optional().nullable(),
  motivation: z.string().trim().min(20, "Please write at least 20 characters").max(2000),
  introduction_plan: z.string().trim().max(2000).optional().nullable(),
  previous_ambassador: z.boolean().default(false),
  previous_brand: z.string().trim().max(200).optional().nullable(),
  acknowledged_commission_program: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the commission program" }),
  }),
  confirmed_information_accuracy: z.literal(true, {
    errorMap: () => ({ message: "You must confirm the information is accurate" }),
  }),
});

export type CampusAmbassadorApplicationInput = z.infer<typeof applicationInput>;

const ACTIVE_STATUSES = ["submitted", "under_review", "more_info_required", "approved"] as const;

export const getCampusAmbassadorContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: appRows } = await supabase
      .from("campus_ambassador_applications")
      .select("*")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(5);
    const applications = appRows ?? [];
    const activeApp = applications.find((a) => ACTIVE_STATUSES.includes(a.status));
    const latestApp = applications[0] ?? null;

    const { data: profile } = await supabase
      .from("campus_ambassador_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: authUser } = await supabase.auth.getUser();
    const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, any>;
    const prefill = {
      full_name: meta.full_name || meta.name || "",
      email: authUser?.user?.email || "",
      mobile: meta.phone || authUser?.user?.phone || "",
    };

    return {
      applications,
      activeApp: activeApp ?? null,
      latestApp,
      profile: profile ?? null,
      canApply: !activeApp,
      prefill,
      userId,
    };
  });

export const submitCampusAmbassadorApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => applicationInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Prevent duplicate active applications
    const { data: existing } = await supabase
      .from("campus_ambassador_applications")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ACTIVE_STATUSES);
    if (existing && existing.length > 0) {
      throw new Error(
        "You already have an active Campus Ambassador application. Please check your application status.",
      );
    }

    const { data: inserted, error } = await supabase
      .from("campus_ambassador_applications")
      .insert({
        user_id: userId,
        full_name: data.full_name,
        email: data.email,
        mobile: data.mobile,
        college_name: data.college_name,
        campus_city: data.campus_city,
        state: data.state,
        degree_course: data.degree_course,
        specialisation: data.specialisation || null,
        current_year_of_study: data.current_year_of_study,
        expected_graduation_year: data.expected_graduation_year ?? null,
        instagram_url: data.instagram_url || null,
        linkedin_url: data.linkedin_url || null,
        other_social_url: data.other_social_url || null,
        campus_network_size: data.campus_network_size || null,
        motivation: data.motivation,
        introduction_plan: data.introduction_plan || null,
        previous_ambassador: data.previous_ambassador,
        previous_brand: data.previous_brand || null,
        acknowledged_commission_program: data.acknowledged_commission_program,
        confirmed_information_accuracy: data.confirmed_information_accuracy,
        status: "submitted",
      })
      .select("id, application_code, status, submitted_at")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("campus_ambassador_activity").insert({
      application_id: inserted.id,
      user_id: userId,
      actor_role: "applicant",
      event: "campus_ambassador_application_submitted",
      detail: "Campus Ambassador application submitted",
    });

    return inserted;
  });

export const withdrawCampusAmbassadorApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: app } = await supabase
      .from("campus_ambassador_applications")
      .select("id, status, user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!app || app.user_id !== userId) throw new Error("Application not found");
    if (!["submitted", "under_review", "more_info_required"].includes(app.status)) {
      throw new Error("This application cannot be withdrawn.");
    }

    const { error } = await supabase
      .from("campus_ambassador_applications")
      .update({ status: "withdrawn" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabase.from("campus_ambassador_activity").insert({
      application_id: data.id,
      user_id: userId,
      actor_role: "applicant",
      event: "campus_ambassador_application_withdrawn",
      detail: "Application withdrawn by applicant",
    });
    return { ok: true };
  });

export const submitMoreInfoResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      id: z.string().uuid(),
      message: z.string().trim().min(5).max(2000),
      document_paths: z.array(z.string().max(500)).max(10).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app } = await supabase
      .from("campus_ambassador_applications")
      .select("id, status, user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!app || app.user_id !== userId) throw new Error("Application not found");
    if (app.status !== "more_info_required") {
      throw new Error("This application is not awaiting additional information.");
    }

    const { error } = await supabase
      .from("campus_ambassador_applications")
      .update({
        applicant_reply: data.message,
        applicant_reply_at: new Date().toISOString(),
        status: "under_review",
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabase.from("campus_ambassador_activity").insert({
      application_id: data.id,
      user_id: userId,
      actor_role: "applicant",
      event: "additional_information_submitted",
      detail: "Applicant submitted additional information",
      meta: { document_paths: data.document_paths ?? [] },
    });
    return { ok: true };
  });

export const getApplicationTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows } = await supabase
      .from("campus_ambassador_activity")
      .select("id, event, detail, created_at, actor_role")
      .eq("application_id", data.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return rows ?? [];
  });

export const acknowledgeCommissionProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("campus_ambassador_profiles")
      .select("id, commission_ack_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile) throw new Error("Ambassador profile not found");
    if (profile.commission_ack_at) return { ok: true, alreadyAcknowledged: true };

    const version = "1.0";
    const { error } = await supabase
      .from("campus_ambassador_profiles")
      .update({ commission_ack_at: new Date().toISOString(), commission_ack_version: version })
      .eq("id", profile.id);
    if (error) throw new Error(error.message);

    await supabase.from("campus_ambassador_activity").insert({
      ambassador_profile_id: profile.id,
      user_id: userId,
      actor_role: "ambassador",
      event: "commission_program_acknowledged",
      detail: "Ambassador acknowledged commission program",
      meta: { version },
    });
    return { ok: true, alreadyAcknowledged: false };
  });

const uploadInput = z.object({
  filename: z.string().min(1).max(200),
  content_type: z.string().min(1).max(150),
  size: z.number().int().min(1).max(10 * 1024 * 1024),
});

export const createDocumentUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => uploadInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(data.content_type.toLowerCase())) {
      throw new Error("Only PDF, JPG, JPEG or PNG files are allowed");
    }
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const path = `${userId}/${Date.now()}_${safe}`;
    const { data: signed, error } = await supabase.storage
      .from("campus-ambassador-docs")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });
