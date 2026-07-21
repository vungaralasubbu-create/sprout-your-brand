import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAYMENT_STATUSES } from "./shared";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const listInput = z.object({
  status: z.enum(["all", ...PAYMENT_STATUSES]).optional().default("all"),
  q: z.string().trim().max(120).optional().nullable(),
  limit: z.number().int().min(1).max(200).optional().default(100),
});

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    let q: any = supabase
      .from("course_payments")
      .select(
        "id, order_id, status, first_name, last_name, email, phone, final_amount_inr, utr_number, created_at, courses:course_id(name, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const search = (data.q ?? "").trim();
    if (search) {
      q = q.or(
        [
          `order_id.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `utr_number.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
        ].join(","),
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPaymentDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { data: row, error } = await supabase
      .from("course_payments")
      .select(
        "*, courses:course_id(id, name, slug, category_id), events:course_payment_events(id, type, meta, created_at, actor_user_id)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");

    let screenshotSignedUrl: string | null = null;
    if (row.screenshot_url) {
      const { data: signed } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(row.screenshot_url, 60 * 10);
      screenshotSignedUrl = signed?.signedUrl ?? null;
    }
    return { ...row, screenshotSignedUrl };
  });

export const approvePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { data: payment, error } = await supabase
      .from("course_payments")
      .select("id, user_id, course_id, final_amount_inr, status, enrollment_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!payment) throw new Error("Not found");
    if (payment.status === "verified") return { ok: true, alreadyVerified: true };

    // Create an enrollment row using only well-known columns.
    let enrollmentId = payment.enrollment_id;
    if (!enrollmentId) {
      const { data: enrRow, error: enrErr } = await supabase
        .from("enrollments")
        .insert({
          user_id: payment.user_id,
          course_id: payment.course_id,
          status: "active",
          gross_revenue: payment.final_amount_inr,
        } as any)
        .select("id")
        .single();
      if (enrErr) {
        // Fallback: if the `status` enum does not have 'active', try omitting it.
        const { data: enrRow2, error: enrErr2 } = await supabase
          .from("enrollments")
          .insert({
            user_id: payment.user_id,
            course_id: payment.course_id,
            gross_revenue: payment.final_amount_inr,
          } as any)
          .select("id")
          .single();
        if (enrErr2) throw new Error(enrErr2.message);
        enrollmentId = enrRow2.id;
      } else {
        enrollmentId = enrRow.id;
      }
    }

    const { error: updErr } = await supabase
      .from("course_payments")
      .update({
        status: "verified",
        verified_by: userId,
        verified_at: new Date().toISOString(),
        enrollment_id: enrollmentId,
      })
      .eq("id", payment.id);
    if (updErr) throw new Error(updErr.message);

    await supabase.from("course_payment_events").insert({
      payment_id: payment.id,
      type: "verified",
      actor_user_id: userId,
      meta: { enrollmentId },
    });

    return { ok: true, enrollmentId };
  });

export const rejectPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), reason: z.string().trim().min(3).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { error } = await supabase
      .from("course_payments")
      .update({ status: "rejected", rejection_reason: data.reason })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabase.from("course_payment_events").insert({
      payment_id: data.id,
      type: "rejected",
      actor_user_id: userId,
      meta: { reason: data.reason },
    });
    return { ok: true };
  });

export const requestPaymentInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), note: z.string().trim().min(3).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { error } = await supabase
      .from("course_payments")
      .update({ status: "pending", info_request_note: data.note })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabase.from("course_payment_events").insert({
      payment_id: data.id,
      type: "info_requested",
      actor_user_id: userId,
      meta: { note: data.note },
    });
    return { ok: true };
  });
