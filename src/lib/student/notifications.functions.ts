import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORIES = [
  "learning","program","live_session","project","assignment",
  "certificate","internship","career","interview","ai_mentor",
  "support","account","system",
] as const;
const NOTIF_TYPES = [
  "information","success","reminder","attention","action_required","update",
] as const;

const PREF_CATEGORIES = [
  "learning","live_session","project","assignment","certificate",
  "internship","career","support","ai_mentor","interview",
] as const;

type Category = typeof CATEGORIES[number];
type NotifType = typeof NOTIF_TYPES[number];

// ============================================================
// SYNC — Idempotent notification generator
// Derives current-state notifications for this student from
// real workflow tables using dedupe_key upserts.
// ============================================================
export const syncStudentNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const uid = context.userId;

    // Load preferences (default enabled for missing rows)
    const { data: prefRows } = await sb
      .from("student_notification_preferences")
      .select("category, in_app_enabled")
      .eq("student_user_id", uid);
    const prefs = new Map<string, boolean>();
    (prefRows ?? []).forEach((r: any) => prefs.set(r.category, r.in_app_enabled));
    const enabled = (cat: string) => prefs.get(cat) !== false;

    const toUpsert: any[] = [];
    const push = (n: {
      category: Category;
      notif_type?: NotifType;
      title: string;
      message: string;
      related_entity_type?: string | null;
      related_entity_id?: string | null;
      action_label?: string | null;
      action_route?: string | null;
      is_mandatory?: boolean;
      dedupe_key: string;
    }) => {
      toUpsert.push({
        student_user_id: uid,
        notif_type: "information",
        is_mandatory: false,
        related_entity_type: null,
        related_entity_id: null,
        action_label: null,
        action_route: null,
        ...n,
      });
    };

    // --- Certificates issued ---
    if (enabled("certificate")) {
      const { data: certs } = await sb
        .from("certificates")
        .select("id, course_name, certificate_type, certificate_number, issued_at, revoked_at")
        .eq("student_user_id", uid);
      for (const c of (certs ?? []) as any[]) {
        if (c.revoked_at) {
          push({
            category: "certificate",
            notif_type: "attention",
            title: "Certificate Revoked",
            message: `${c.course_name ?? "Certificate"} has been revoked.`,
            related_entity_type: "certificate",
            related_entity_id: c.id,
            action_label: "View Certificate",
            action_route: `/student/certificates`,
            is_mandatory: true,
            dedupe_key: `certificate_revoked:${c.id}`,
          });
        } else if (c.issued_at) {
          push({
            category: "certificate",
            notif_type: "success",
            title: "Certificate Available",
            message: `Your ${c.course_name ?? "program"} ${c.certificate_type ?? "certificate"} is now available.`,
            related_entity_type: "certificate",
            related_entity_id: c.id,
            action_label: "View Certificate",
            action_route: `/student/certificates`,
            dedupe_key: `certificate_issued:${c.id}`,
          });
        }
      }
    }

    // --- Support ticket updates ---
    if (enabled("support")) {
      const { data: tickets } = await sb
        .from("student_support_tickets")
        .select("id, ticket_code, subject, status, last_activity_at, resolved_at")
        .eq("student_user_id", uid)
        .in("status", ["waiting_student","resolved","closed","in_progress","waiting_support","assigned"]);
      for (const t of (tickets ?? []) as any[]) {
        const base = `/student/support/${t.id}`;
        if (t.status === "waiting_student") {
          push({
            category: "support",
            notif_type: "action_required",
            title: "Support Needs Your Reply",
            message: `Ticket ${t.ticket_code} · ${t.subject}`,
            related_entity_type: "support_ticket",
            related_entity_id: t.id,
            action_label: "View Support Ticket",
            action_route: base,
            dedupe_key: `support_reply_needed:${t.id}:${t.last_activity_at}`,
          });
        } else if (t.status === "resolved") {
          push({
            category: "support",
            notif_type: "success",
            title: "Support Ticket Resolved",
            message: `Ticket ${t.ticket_code} · ${t.subject}`,
            related_entity_type: "support_ticket",
            related_entity_id: t.id,
            action_label: "View Support Ticket",
            action_route: base,
            dedupe_key: `support_resolved:${t.id}:${t.resolved_at ?? t.last_activity_at}`,
          });
        } else if (t.status === "closed") {
          push({
            category: "support",
            notif_type: "update",
            title: "Support Ticket Closed",
            message: `Ticket ${t.ticket_code} · ${t.subject}`,
            related_entity_type: "support_ticket",
            related_entity_id: t.id,
            action_label: "View Support Ticket",
            action_route: base,
            dedupe_key: `support_closed:${t.id}`,
          });
        }
      }
    }

    // --- Project workflow updates ---
    if (enabled("project")) {
      const { data: projs } = await sb
        .from("student_projects")
        .select("id, status, updated_at, course_project_templates(name)")
        .eq("student_user_id", uid)
        .in("status", ["revision_requested","approved","completed","under_review"]);
      for (const p of (projs ?? []) as any[]) {
        const name = p.course_project_templates?.name ?? "Project";
        const route = `/student/projects/${p.id}`;
        if (p.status === "revision_requested") {
          push({
            category: "project",
            notif_type: "action_required",
            title: "Project Revision Requested",
            message: `${name} — review the reviewer's feedback and resubmit.`,
            related_entity_type: "student_project",
            related_entity_id: p.id,
            action_label: "View Project Feedback",
            action_route: route,
            dedupe_key: `project_revision:${p.id}:${p.updated_at}`,
          });
        } else if (p.status === "approved") {
          push({
            category: "project",
            notif_type: "success",
            title: "Project Approved",
            message: `${name} has been approved.`,
            related_entity_type: "student_project",
            related_entity_id: p.id,
            action_label: "View Project",
            action_route: route,
            dedupe_key: `project_approved:${p.id}:${p.updated_at}`,
          });
        } else if (p.status === "under_review") {
          push({
            category: "project",
            notif_type: "information",
            title: "Project Under Review",
            message: `${name} is being reviewed.`,
            related_entity_type: "student_project",
            related_entity_id: p.id,
            action_label: "View Project",
            action_route: route,
            dedupe_key: `project_under_review:${p.id}`,
          });
        } else if (p.status === "completed") {
          push({
            category: "project",
            notif_type: "success",
            title: "Project Completed",
            message: `${name} is complete.`,
            related_entity_type: "student_project",
            related_entity_id: p.id,
            action_label: "View Project",
            action_route: route,
            dedupe_key: `project_completed:${p.id}`,
          });
        }
      }
    }

    // --- Assignment workflow updates ---
    if (enabled("assignment")) {
      const { data: assigns } = await sb
        .from("student_assignments")
        .select("id, status, updated_at, course_assignments(name, due_date)")
        .eq("student_user_id", uid)
        .in("status", ["revision_requested","approved","completed","under_review","not_started","in_progress"]);
      const now = Date.now();
      for (const a of (assigns ?? []) as any[]) {
        const name = a.course_assignments?.name ?? "Assignment";
        const route = `/student/assignments/${a.id}`;
        if (a.status === "revision_requested") {
          push({
            category: "assignment",
            notif_type: "action_required",
            title: "Assignment Revision Requested",
            message: `${name} — review feedback and resubmit.`,
            related_entity_type: "student_assignment",
            related_entity_id: a.id,
            action_label: "View Assignment",
            action_route: route,
            dedupe_key: `assignment_revision:${a.id}:${a.updated_at}`,
          });
        } else if (a.status === "approved") {
          push({
            category: "assignment",
            notif_type: "success",
            title: "Assignment Approved",
            message: `${name} has been approved.`,
            related_entity_type: "student_assignment",
            related_entity_id: a.id,
            action_label: "View Assignment",
            action_route: route,
            dedupe_key: `assignment_approved:${a.id}:${a.updated_at}`,
          });
        } else if (a.status === "under_review") {
          push({
            category: "assignment",
            notif_type: "information",
            title: "Assignment Under Review",
            message: `${name} is being reviewed.`,
            related_entity_type: "student_assignment",
            related_entity_id: a.id,
            action_label: "View Assignment",
            action_route: route,
            dedupe_key: `assignment_under_review:${a.id}`,
          });
        }

        // Due soon reminder (within 3 days, only if not yet submitted/approved)
        const due = a.course_assignments?.due_date;
        if (due && ["not_started","in_progress"].includes(a.status)) {
          const dueMs = new Date(due).getTime();
          const diffDays = (dueMs - now) / (1000 * 60 * 60 * 24);
          if (diffDays > 0 && diffDays <= 3) {
            push({
              category: "assignment",
              notif_type: "reminder",
              title: "Assignment Due Soon",
              message: `${name} is due ${new Date(due).toLocaleDateString()}.`,
              related_entity_type: "student_assignment",
              related_entity_id: a.id,
              action_label: "View Assignment",
              action_route: route,
              dedupe_key: `assignment_due_soon:${a.id}:${new Date(due).toISOString().slice(0,10)}`,
            });
          }
        }
      }
    }

    // --- Internship task updates ---
    if (enabled("internship")) {
      const { data: tasks } = await sb
        .from("student_internship_tasks")
        .select("id, status, updated_at, internship_tasks(title), student_internships!inner(student_user_id, id)")
        .eq("student_internships.student_user_id", uid)
        .in("status", ["revision_requested","approved","completed"]);
      for (const t of (tasks ?? []) as any[]) {
        const name = t.internship_tasks?.title ?? "Internship task";
        const route = `/student/internship`;
        if (t.status === "revision_requested") {
          push({
            category: "internship",
            notif_type: "action_required",
            title: "Internship Task Revision Requested",
            message: `${name} — review feedback and resubmit.`,
            related_entity_type: "internship_task",
            related_entity_id: t.id,
            action_label: "View Internship Task",
            action_route: route,
            dedupe_key: `internship_task_revision:${t.id}:${t.updated_at}`,
          });
        } else if (t.status === "approved") {
          push({
            category: "internship",
            notif_type: "success",
            title: "Internship Task Approved",
            message: `${name} approved.`,
            related_entity_type: "internship_task",
            related_entity_id: t.id,
            action_label: "View Internship Task",
            action_route: route,
            dedupe_key: `internship_task_approved:${t.id}:${t.updated_at}`,
          });
        }
      }
    }

    // --- Live session starting soon (within 30 min for enrolled sessions) ---
    if (enabled("live_session")) {
      const now = Date.now();
      const soon = new Date(now + 30 * 60 * 1000).toISOString();
      const { data: sessions } = await sb
        .from("session_attendance")
        .select("session_id, live_sessions!inner(id, title, scheduled_at, course_id)")
        .eq("student_user_id", uid)
        .gte("live_sessions.scheduled_at", new Date(now).toISOString())
        .lte("live_sessions.scheduled_at", soon);
      for (const s of (sessions ?? []) as any[]) {
        const ls = s.live_sessions;
        if (!ls) continue;
        push({
          category: "live_session",
          notif_type: "reminder",
          title: "Live Session Starting Soon",
          message: `${ls.title} · ${new Date(ls.scheduled_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`,
          related_entity_type: "live_session",
          related_entity_id: ls.id,
          action_label: "View Session",
          action_route: `/student/live-sessions/${ls.id}`,
          dedupe_key: `session_starting_soon:${ls.id}:${new Date(ls.scheduled_at).toISOString().slice(0,16)}`,
        });
      }
    }

    // Bulk upsert
    if (toUpsert.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      for (const row of toUpsert) {
        // Insert only if not already present (unique on student_user_id, dedupe_key)
        await supabaseAdmin
          .from("student_notifications")
          .upsert(row, { onConflict: "student_user_id,dedupe_key", ignoreDuplicates: true });
      }
    }

    return { synced: toUpsert.length };
  });

// ============================================================
// Bell + unread count
// ============================================================
export const getNotificationBell = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const [{ count: unread }, { data: latest }] = await Promise.all([
      sb.from("student_notifications")
        .select("id", { count: "exact", head: true })
        .eq("student_user_id", uid).is("read_at", null),
      sb.from("student_notifications")
        .select("id, category, notif_type, title, message, action_label, action_route, read_at, created_at")
        .eq("student_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    return {
      unread: unread ?? 0,
      latest: (latest ?? []) as any[],
    };
  });

// ============================================================
// Overview metrics
// ============================================================
export const getNotificationOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data } = await sb
      .from("student_notifications")
      .select("id, notif_type, read_at, created_at")
      .eq("student_user_id", uid);
    const rows = (data ?? []) as any[];
    return {
      unread: rows.filter((r) => !r.read_at).length,
      today: rows.filter((r) => new Date(r.created_at) >= today).length,
      thisWeek: rows.filter((r) => new Date(r.created_at) >= weekAgo).length,
      needsAttention: rows.filter((r) => !r.read_at && ["action_required","attention"].includes(r.notif_type)).length,
    };
  });

// ============================================================
// List notifications
// ============================================================
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      filter: z.enum([
        "all","unread","needs_attention",
        "learning","live_session","project","assignment",
        "certificate","internship","career","support",
      ]).default("all"),
      q: z.string().max(120).nullable().optional(),
    }).parse(raw ?? {}),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    let query = sb
      .from("student_notifications")
      .select("id, category, notif_type, title, message, action_label, action_route, related_entity_type, related_entity_id, read_at, created_at")
      .eq("student_user_id", uid)
      .order("created_at", { ascending: false });

    if (data.filter === "unread") query = query.is("read_at", null);
    else if (data.filter === "needs_attention") query = query.is("read_at", null).in("notif_type", ["action_required","attention"]);
    else if (data.filter !== "all") query = query.eq("category", data.filter);

    if (data.q?.trim()) {
      const q = data.q.trim();
      query = query.or(`title.ilike.%${q}%,message.ilike.%${q}%`);
    }
    const { data: rows } = await query.limit(200);
    return (rows ?? []) as any[];
  });

// ============================================================
// Mark read / mark all
// ============================================================
export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const { error } = await sb
      .from("student_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("student_user_id", uid)
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const { error, count } = await sb
      .from("student_notifications")
      .update({ read_at: new Date().toISOString() }, { count: "exact" })
      .eq("student_user_id", uid)
      .is("read_at", null);
    if (error) throw error;
    return { updated: count ?? 0 };
  });

// ============================================================
// Preferences
// ============================================================
export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { data } = await sb
      .from("student_notification_preferences")
      .select("category, in_app_enabled")
      .eq("student_user_id", context.userId);
    const map: Record<string, boolean> = {};
    for (const c of PREF_CATEGORIES) map[c] = true;
    for (const r of (data ?? []) as any[]) map[r.category] = r.in_app_enabled;
    return map;
  });

export const updateNotificationPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      category: z.enum(PREF_CATEGORIES),
      in_app_enabled: z.boolean(),
    }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const { error } = await sb
      .from("student_notification_preferences")
      .upsert({
        student_user_id: context.userId,
        category: data.category,
        in_app_enabled: data.in_app_enabled,
      }, { onConflict: "student_user_id,category" });
    if (error) throw error;
    return { ok: true };
  });

// ============================================================
// My Activity — merges from existing activity tables
// ============================================================
export const listMyActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      filter: z.enum([
        "all","learning","projects","assignments",
        "live_sessions","internship","career","ai_mentor","support",
      ]).default("all"),
      limit: z.number().int().min(1).max(200).default(60),
    }).parse(raw ?? {}),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const results: {
      id: string; category: string; description: string; created_at: string;
    }[] = [];

    const wants = (c: string) => data.filter === "all" || data.filter === c;

    if (wants("learning") || wants("projects") || wants("live_sessions") || wants("assignments")) {
      const { data: rows } = await sb
        .from("student_activity")
        .select("id, activity_type, description, created_at")
        .eq("student_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      for (const r of (rows ?? []) as any[]) {
        const t = r.activity_type as string;
        let cat = "learning";
        if (t.startsWith("project_")) cat = "projects";
        else if (t.startsWith("assignment_")) cat = "assignments";
        else if (t.startsWith("session_")) cat = "live_sessions";
        if (!wants(cat)) continue;
        results.push({ id: r.id, category: cat, description: r.description, created_at: r.created_at });
      }
    }
    if (wants("internship")) {
      const { data: rows } = await sb
        .from("student_internship_activity")
        .select("id, description, created_at")
        .eq("student_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      for (const r of (rows ?? []) as any[]) {
        results.push({ id: r.id, category: "internship", description: r.description, created_at: r.created_at });
      }
    }
    if (wants("career")) {
      const { data: rows } = await sb
        .from("career_activity")
        .select("id, description, created_at")
        .eq("student_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      for (const r of (rows ?? []) as any[]) {
        results.push({ id: r.id, category: "career", description: r.description, created_at: r.created_at });
      }
    }
    if (wants("ai_mentor")) {
      const { data: rows } = await sb
        .from("ai_mentor_activity")
        .select("id, description, created_at")
        .eq("student_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      for (const r of (rows ?? []) as any[]) {
        results.push({ id: r.id, category: "ai_mentor", description: r.description, created_at: r.created_at });
      }
    }
    if (wants("support")) {
      const { data: rows } = await sb
        .from("student_support_activity")
        .select("id, detail, created_at, actor_role")
        .eq("student_user_id", uid)
        .eq("actor_role", "student")
        .order("created_at", { ascending: false })
        .limit(data.limit);
      for (const r of (rows ?? []) as any[]) {
        results.push({ id: r.id, category: "support", description: r.detail, created_at: r.created_at });
      }
    }
    // Interview activity (if table has student_user_id)
    if (wants("career")) {
      const { data: rows } = await sb
        .from("interview_activity")
        .select("id, description, created_at")
        .eq("student_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      for (const r of (rows ?? []) as any[]) {
        results.push({ id: r.id, category: "career", description: r.description, created_at: r.created_at });
      }
    }

    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return results.slice(0, data.limit);
  });
