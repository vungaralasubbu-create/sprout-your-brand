import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ============================================================
// Schemas
// ============================================================
const profileSchema = z.object({
  full_name: z.string().trim().max(120).nullish(),
  headline: z.string().trim().max(140).nullish(),
  objective: z.string().trim().max(1000).nullish(),
  city: z.string().trim().max(80).nullish(),
  state: z.string().trim().max(80).nullish(),
  education_level: z.string().trim().max(80).nullish(),
  college: z.string().trim().max(160).nullish(),
  degree: z.string().trim().max(120).nullish(),
  specialisation: z.string().trim().max(120).nullish(),
  graduation_year: z.number().int().min(1950).max(2100).nullish(),
  current_student_status: z.string().trim().max(80).nullish(),
  years_of_experience: z.number().min(0).max(60).nullish(),
});

const educationSchema = z.object({
  id: z.string().uuid().optional(),
  institution: z.string().trim().min(1).max(160),
  degree: z.string().trim().max(120).nullish(),
  specialisation: z.string().trim().max(120).nullish(),
  start_year: z.number().int().min(1950).max(2100).nullish(),
  end_year: z.number().int().min(1950).max(2100).nullish(),
  is_current: z.boolean().default(false),
});

const skillSchema = z.object({
  skill_name: z.string().trim().min(1).max(80),
  skill_source: z.enum(["student_added", "program_skill", "project_skill", "internship_skill"]).default("student_added"),
  skill_level: z.enum(["beginner", "intermediate", "advanced"]).nullish(),
  linked_skill_id: z.string().uuid().nullish(),
  linked_course_id: z.string().uuid().nullish(),
});

const preferencesSchema = z.object({
  preferred_role: z.string().trim().max(120).nullish(),
  preferred_industries: z.array(z.string().trim().max(80)).max(20).default([]),
  preferred_work_types: z.array(z.enum(["full_time", "internship", "contract", "freelance", "open"])).default([]),
  preferred_locations: z.array(z.string().trim().max(80)).max(20).default([]),
  open_to_internship: z.boolean().default(false),
  open_to_entry_level: z.boolean().default(false),
  open_to_remote: z.boolean().default(false),
  open_to_opportunities: z.boolean().default(false),
});

// ============================================================
// Helpers
// ============================================================
async function logActivity(
  supabase: any,
  userId: string,
  event: string,
  metadata: Record<string, unknown> = {},
) {
  // Deduplicate identical events within the same minute.
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { data: existing } = await supabase
    .from("career_activity")
    .select("id")
    .eq("student_user_id", userId)
    .eq("event_type", event)
    .gte("created_at", oneMinuteAgo)
    .limit(1);
  if (existing && existing.length) return;
  await supabase.from("career_activity").insert({
    student_user_id: userId,
    event_type: event,
    metadata,
  });
}

// ============================================================
// Overview: computes profile, readiness, metrics, tasks
// ============================================================
export const getCareerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const sb = context.supabase;

    const [
      profileRes,
      educationRes,
      skillsRes,
      prefsRes,
      portfolioRes,
      certsRes,
      internshipsRes,
    ] = await Promise.all([
      sb.from("career_profiles").select("*").eq("student_user_id", uid).maybeSingle(),
      sb.from("student_education").select("*").eq("student_user_id", uid).order("display_order").order("start_year", { ascending: false }),
      sb.from("student_skills").select("*").eq("student_user_id", uid).order("created_at", { ascending: false }),
      sb.from("student_career_preferences").select("*").eq("student_user_id", uid).maybeSingle(),
      sb
        .from("student_projects")
        .select("id, course_id, project_id, status, completed_at, portfolio_added, portfolio_selected_at")
        .eq("student_user_id", uid)
        .eq("status", "completed")
        .eq("portfolio_added", true),
      sb
        .from("certificates")
        .select("id, course_id, course_name, certificate_number, certificate_type, issued_at, revoked_at")
        .eq("student_user_id", uid)
        .is("revoked_at", null)
        .order("issued_at", { ascending: false }),
      sb
        .from("student_internships")
        .select("id, course_id, status, started_at, completed_at, progress_percent")
        .eq("student_user_id", uid),
    ]);

    const profile = profileRes.data ?? null;
    const education = educationRes.data ?? [];
    const skills = skillsRes.data ?? [];
    const preferences = prefsRes.data ?? null;
    const portfolio = portfolioRes.data ?? [];
    const certificates = certsRes.data ?? [];
    const internships = internshipsRes.data ?? [];

    // Portfolio project details (join course names)
    const courseIds = Array.from(
      new Set([
        ...portfolio.map((p: any) => p.course_id),
        ...certificates.map((c: any) => c.course_id),
        ...internships.map((i: any) => i.course_id),
      ]),
    );
    let coursesById = new Map<string, { title: string; slug: string }>();
    if (courseIds.length) {
      const { data: courses } = await sb.from("courses").select("id, title, slug").in("id", courseIds);
      coursesById = new Map((courses ?? []).map((c: any) => [c.id, { title: c.title, slug: c.slug }]));
    }

    const portfolioProjects = await Promise.all(
      portfolio.map(async (p: any) => {
        const { data: tmpl } = await sb
          .from("course_project_templates")
          .select("name, project_type, portfolio_eligible")
          .eq("id", p.project_id)
          .maybeSingle();
        const { data: latestSub } = await sb
          .from("student_project_submissions")
          .select("title, repository_url, live_url, submitted_at, status")
          .eq("student_project_id", p.id)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();
        return {
          id: p.id,
          title: latestSub?.title || tmpl?.name || "Portfolio project",
          project_type: tmpl?.project_type ?? null,
          course_title: coursesById.get(p.course_id)?.title ?? "Program",
          completed_at: p.completed_at,
          repository_url: latestSub?.repository_url ?? null,
          live_url: latestSub?.live_url ?? null,
          portfolio_eligible: tmpl?.portfolio_eligible ?? false,
        };
      }),
    );

    // Program skills (skills linked to enrolled courses)
    const { data: enrollments } = await sb
      .from("enrollments")
      .select("course_id")
      .eq("student_user_id", uid);
    const enrolledCourseIds = Array.from(new Set((enrollments ?? []).map((e: any) => e.course_id)));
    let programSkillOptions: { skill_id: string; skill_name: string; course_id: string; course_title: string }[] = [];
    if (enrolledCourseIds.length) {
      const { data: courseSkills } = await sb
        .from("course_skills")
        .select("skill_id, course_id, skill:skills(name)")
        .in("course_id", enrolledCourseIds);
      const { data: enrolledCourses } = await sb
        .from("courses")
        .select("id, title")
        .in("id", enrolledCourseIds);
      const titleById = new Map((enrolledCourses ?? []).map((c: any) => [c.id, c.title]));
      programSkillOptions = ((courseSkills ?? []) as any[])
        .map((cs) => ({
          skill_id: cs.skill_id,
          skill_name: cs.skill?.name ?? "Skill",
          course_id: cs.course_id,
          course_title: (titleById.get(cs.course_id) as string) ?? "Program",
        }))
        .filter((s) => s.skill_name);
    }

    // Readiness computation
    const sectionChecks: Record<string, boolean> = {
      basic_profile: !!(profile && (profile.headline || profile.city || profile.state)),
      education: education.length > 0,
      skills: skills.length > 0,
      resume: false, // Resume Builder not built yet
      projects: portfolioProjects.length > 0,
      certificates: certificates.length > 0,
      internship: internships.some((i: any) => i.status === "completed" || i.status === "in_progress"),
      career_preferences: !!(preferences && (preferences.preferred_role || preferences.preferred_work_types?.length)),
    };
    const totalSections = Object.keys(sectionChecks).length;
    const completedSections = Object.values(sectionChecks).filter(Boolean).length;
    const readinessPercent = Math.round((completedSections / totalSections) * 100);

    // Interview practice sessions — feature not built yet
    const interviewSessions = 0;

    // Task list derivations
    const tasks = [
      { key: "complete_profile", label: "Complete Career Profile", status: sectionChecks.basic_profile ? "completed" : (profile ? "in_progress" : "not_started") },
      { key: "add_education", label: "Add Education", status: sectionChecks.education ? "completed" : "not_started" },
      { key: "add_skills", label: "Add Skills", status: sectionChecks.skills ? "completed" : "not_started" },
      { key: "select_portfolio_projects", label: "Select Portfolio Projects", status: sectionChecks.projects ? "completed" : "not_started" },
      { key: "add_preferences", label: "Add Career Preferences", status: sectionChecks.career_preferences ? "completed" : "not_started" },
      { key: "prepare_resume", label: "Prepare Resume", status: "not_started" },
      { key: "practice_interview", label: "Practice Interview", status: "not_started" },
    ];
    const tasksCompleted = tasks.filter((t) => t.status === "completed").length;

    // Career guidance from enrolled programs
    let guidance: { title: string; type: string; url: string | null; course_title: string }[] = [];
    if (enrolledCourseIds.length) {
      const { data: placement } = await sb
        .from("course_placement_support")
        .select("course_id, title, resource_type, resource_url")
        .in("course_id", enrolledCourseIds);
      const { data: enrolledCourses } = await sb
        .from("courses")
        .select("id, title")
        .in("id", enrolledCourseIds);
      const titleById = new Map((enrolledCourses ?? []).map((c: any) => [c.id, c.title]));
      guidance = ((placement ?? []) as any[]).map((r) => ({
        title: r.title ?? "Career guide",
        type: r.resource_type ?? "guide",
        url: r.resource_url ?? null,
        course_title: (titleById.get(r.course_id) as string) ?? "Program",
      }));
    }

    // Recent career activity
    const { data: activity } = await sb
      .from("career_activity")
      .select("event_type, metadata, created_at")
      .eq("student_user_id", uid)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      profile,
      education,
      skills,
      preferences,
      portfolioProjects,
      programSkillOptions,
      certificates: certificates.map((c: any) => ({
        ...c,
        course_title: coursesById.get(c.course_id)?.title ?? c.course_name,
      })),
      internships: internships.map((i: any) => ({
        ...i,
        course_title: coursesById.get(i.course_id)?.title ?? "Program",
      })),
      metrics: {
        profileProgressPercent: readinessPercent,
        resumeStatus: "not_started" as const,
        interviewSessions,
        portfolioProjectsCount: portfolioProjects.length,
        careerTasksCompleted: tasksCompleted,
        careerTasksTotal: tasks.length,
      },
      readiness: {
        percent: readinessPercent,
        sections: sectionChecks,
      },
      tasks,
      guidance,
      recentActivity: activity ?? [],
    };
  });

// ============================================================
// Save profile (upsert)
// ============================================================
export const saveCareerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => profileSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const uid = context.userId;
    const sb = context.supabase;
    const { data: existing } = await sb
      .from("career_profiles")
      .select("id")
      .eq("student_user_id", uid)
      .maybeSingle();
    const payload = { ...data, student_user_id: uid };
    if (existing) {
      const { error } = await sb.from("career_profiles").update(payload).eq("student_user_id", uid);
      if (error) throw error;
      await logActivity(sb, uid, "career_profile_updated");
    } else {
      const { error } = await sb.from("career_profiles").insert(payload);
      if (error) throw error;
      await logActivity(sb, uid, "career_profile_started");
    }
    return { ok: true };
  });

// ============================================================
// Education
// ============================================================
export const upsertEducation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => educationSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const uid = context.userId;
    const sb = context.supabase;
    if (data.id) {
      const { error } = await sb
        .from("student_education")
        .update({
          institution: data.institution,
          degree: data.degree ?? null,
          specialisation: data.specialisation ?? null,
          start_year: data.start_year ?? null,
          end_year: data.end_year ?? null,
          is_current: data.is_current,
        })
        .eq("id", data.id)
        .eq("student_user_id", uid);
      if (error) throw error;
    } else {
      const { error } = await sb.from("student_education").insert({
        student_user_id: uid,
        institution: data.institution,
        degree: data.degree ?? null,
        specialisation: data.specialisation ?? null,
        start_year: data.start_year ?? null,
        end_year: data.end_year ?? null,
        is_current: data.is_current,
      });
      if (error) throw error;
      await logActivity(sb, uid, "education_added", { institution: data.institution });
    }
    return { ok: true };
  });

export const deleteEducation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("student_education")
      .delete()
      .eq("id", data.id)
      .eq("student_user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ============================================================
// Skills
// ============================================================
export const addSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => skillSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const uid = context.userId;
    const sb = context.supabase;
    const { error } = await sb
      .from("student_skills")
      .upsert(
        {
          student_user_id: uid,
          skill_name: data.skill_name,
          skill_source: data.skill_source,
          skill_level: data.skill_level ?? null,
          linked_skill_id: data.linked_skill_id ?? null,
          linked_course_id: data.linked_course_id ?? null,
        },
        { onConflict: "student_user_id,skill_name,skill_source,linked_course_id" },
      );
    if (error) throw error;
    const event = data.skill_source === "program_skill" ? "program_skill_selected" : "skill_added";
    await logActivity(sb, uid, event, { skill_name: data.skill_name });
    return { ok: true };
  });

export const toggleSkillVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), show_in_profile: z.boolean() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("student_skills")
      .update({ show_in_profile: data.show_in_profile })
      .eq("id", data.id)
      .eq("student_user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const removeSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("student_skills")
      .delete()
      .eq("id", data.id)
      .eq("student_user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ============================================================
// Preferences
// ============================================================
export const saveCareerPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => preferencesSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const uid = context.userId;
    const sb = context.supabase;
    const { data: existing } = await sb
      .from("student_career_preferences")
      .select("id")
      .eq("student_user_id", uid)
      .maybeSingle();
    const payload = { ...data, student_user_id: uid };
    if (existing) {
      const { error } = await sb
        .from("student_career_preferences")
        .update(payload)
        .eq("student_user_id", uid);
      if (error) throw error;
    } else {
      const { error } = await sb.from("student_career_preferences").insert(payload);
      if (error) throw error;
    }
    await logActivity(sb, uid, "career_preferences_updated");
    return { ok: true };
  });

// ============================================================
// Portfolio project selection (toggle)
// ============================================================
export const togglePortfolioProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ student_project_id: z.string().uuid(), include: z.boolean() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const uid = context.userId;
    const sb = context.supabase;
    // Verify ownership + eligibility
    const { data: sp } = await sb
      .from("student_projects")
      .select("id, student_user_id, project_id, status")
      .eq("id", data.student_project_id)
      .maybeSingle();
    if (!sp || sp.student_user_id !== uid) throw new Error("Not authorised");
    if (sp.status !== "completed") throw new Error("Only completed projects can be added to your portfolio");
    const { data: tmpl } = await sb
      .from("course_project_templates")
      .select("portfolio_eligible")
      .eq("id", sp.project_id)
      .maybeSingle();
    if (!tmpl?.portfolio_eligible) throw new Error("Project is not portfolio-eligible");

    const { error } = await sb
      .from("student_projects")
      .update({
        portfolio_added: data.include,
        portfolio_selected_at: data.include ? new Date().toISOString() : null,
      })
      .eq("id", data.student_project_id)
      .eq("student_user_id", uid);
    if (error) throw error;
    if (data.include) await logActivity(sb, uid, "portfolio_project_selected");
    return { ok: true };
  });

export const listEligiblePortfolioProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const sb = context.supabase;
    const { data: sps } = await sb
      .from("student_projects")
      .select("id, course_id, project_id, status, portfolio_added, completed_at")
      .eq("student_user_id", uid)
      .eq("status", "completed");
    const rows = sps ?? [];
    if (rows.length === 0) return [] as any[];
    const templateIds = Array.from(new Set(rows.map((r: any) => r.project_id)));
    const { data: templates } = await sb
      .from("course_project_templates")
      .select("id, name, project_type, portfolio_eligible")
      .in("id", templateIds);
    const tmplById = new Map((templates ?? []).map((t: any) => [t.id, t]));
    const courseIds = Array.from(new Set(rows.map((r: any) => r.course_id)));
    const { data: courses } = await sb.from("courses").select("id, title").in("id", courseIds);
    const courseTitle = new Map((courses ?? []).map((c: any) => [c.id, c.title]));
    return rows
      .filter((r: any) => tmplById.get(r.project_id)?.portfolio_eligible)
      .map((r: any) => {
        const t = tmplById.get(r.project_id) as any;
        return {
          id: r.id,
          title: t?.name ?? "Project",
          project_type: t?.project_type ?? null,
          course_title: courseTitle.get(r.course_id) ?? "Program",
          completed_at: r.completed_at,
          portfolio_added: r.portfolio_added,
        };
      });
  });

// ============================================================
// Career activity logging (for Resume / Interview entry points)
// ============================================================
export const logCareerEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        event_type: z.enum([
          "resume_builder_opened",
          "interview_practice_opened",
          "career_resource_opened",
        ]),
        metadata: z.record(z.any()).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    await logActivity(context.supabase, context.userId, data.event_type, data.metadata ?? {});
    return { ok: true };
  });
