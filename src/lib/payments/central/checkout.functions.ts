import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  enrollmentFormSchema,
  generateOrderId,
  resolveCourseAmount,
  utrSchema,
} from "./shared";
import { resolveActiveAccountForCourse } from "./gateway.functions";

const createInput = z.object({
  courseId: z.string().uuid(),
  form: enrollmentFormSchema,
});

export const createCoursePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { courseId, form } = data;

    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id, name, slug, base_price, offer_price, self_paced_price")
      .eq("id", courseId)
      .maybeSingle();
    if (courseErr) throw new Error(courseErr.message);
    if (!course) throw new Error("Course not found");

    const base = resolveCourseAmount(course as any);
    if (!base) throw new Error("This course does not have a price configured yet.");

    // Reuse an existing pending order for the same user+course to avoid duplicates.
    const { data: existing } = await supabase
      .from("course_payments")
      .select("id, order_id, status")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .in("status", ["pending", "submitted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.order_id) {
      return { orderId: existing.order_id, reused: true };
    }

    // Resolve the payment account for this course via the gateway (course
    // override → routing mode → active pool). Falls back to the legacy
    // `payment_settings` singleton so pre-gateway installs keep working.
    const account = await resolveActiveAccountForCourse(supabase, courseId);

    const { data: settings } = await supabase
      .from("payment_settings")
      .select("id, version, upi_id, merchant_name, is_active, is_enabled, maintenance_mode")
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!account && settings && (settings.maintenance_mode || settings.is_enabled === false)) {
      throw new Error("Payments are temporarily unavailable. Please try again shortly.");
    }
    if (!account && !settings) {
      throw new Error("Payments are temporarily unavailable. Please try again shortly.");
    }

    const orderId = generateOrderId();
    const { error: insErr } = await supabase.from("course_payments").insert({
      order_id: orderId,
      user_id: userId,
      course_id: courseId,
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone,
      college: form.college ?? null,
      degree: form.degree ?? null,
      graduation_year: form.graduationYear ?? null,
      city: form.city ?? null,
      state: form.state ?? null,
      country: form.country ?? null,
      referral_code: form.referralCode ?? null,
      coupon_code: form.couponCode ?? null,
      base_amount_inr: base,
      discount_inr: 0,
      final_amount_inr: base,
      status: "pending",
      provider: "upi_manual",
      settings_id: settings?.id ?? null,
      qr_version_used: account?.version ?? settings?.version ?? null,
      upi_id_used: account?.upi_id ?? settings?.upi_id ?? null,
      merchant_name_used: account?.merchant_name ?? settings?.merchant_name ?? null,
      payment_account_id: account?.id ?? null,
      account_version_used: account?.version ?? null,
    });
    if (insErr) throw new Error(insErr.message);

    return { orderId, reused: false };
  });

/** Display data for the student payment page. Prefers the snapshotted
 * gateway account for this order; falls back to legacy `payment_settings`. */
export const getPaymentDisplayForOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase
      .from("course_payments")
      .select("user_id, payment_account_id, upi_id_used, merchant_name_used, account_version_used")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (!p || p.user_id !== userId) throw new Error("Forbidden");

    if (p.payment_account_id) {
      const { data: acc } = await supabase
        .from("payment_accounts")
        .select("id, merchant_name, upi_id, qr_image_url, status, version")
        .eq("id", p.payment_account_id)
        .maybeSingle();
      if (acc) {
        return {
          source: "account" as const,
          merchant_name: acc.merchant_name,
          upi_id: acc.upi_id,
          qr_image_url: acc.qr_image_url as string | null,
          maintenance: acc.status === "maintenance" || acc.status === "inactive",
          version: acc.version,
        };
      }
    }
    return null;
  });

export const getMyPayment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("course_payments")
      .select(
        "id, order_id, user_id, course_id, status, base_amount_inr, discount_inr, final_amount_inr, utr_number, screenshot_url, rejection_reason, info_request_note, created_at, updated_at, enrollment_id, courses:course_id(id, name, slug, category_id)",
      )
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Order not found");
    if (row.user_id !== userId) throw new Error("Forbidden");
    return row;
  });

const submitInput = z.object({
  orderId: z.string().min(1),
  utrNumber: utrSchema,
  screenshotPath: z.string().max(500).optional().nullable(),
});

export const submitPaymentConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: payment, error: fetchErr } = await supabase
      .from("course_payments")
      .select("id, user_id, status")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!payment) throw new Error("Order not found");
    if (payment.user_id !== userId) throw new Error("Forbidden");
    if (!["pending", "submitted"].includes(payment.status)) {
      throw new Error(`Cannot update a payment in status "${payment.status}"`);
    }

    // Reject duplicate UTR (partial unique index also enforces this).
    const { data: dupe } = await supabase
      .from("course_payments")
      .select("id")
      .eq("utr_number", data.utrNumber)
      .neq("id", payment.id)
      .limit(1)
      .maybeSingle();
    if (dupe) {
      throw new Error(
        "This UTR reference is already recorded against another order. Please double-check and try again.",
      );
    }

    const { error: updErr } = await supabase
      .from("course_payments")
      .update({
        utr_number: data.utrNumber,
        screenshot_url: data.screenshotPath ?? null,
        status: "submitted",
      })
      .eq("id", payment.id);
    if (updErr) throw new Error(updErr.message);

    await supabase.from("course_payment_events").insert({
      payment_id: payment.id,
      type: "submitted",
      actor_user_id: userId,
      meta: { utr: data.utrNumber, hasScreenshot: !!data.screenshotPath },
    });

    return { ok: true };
  });

/** Returns a signed upload URL for the student's screenshot. */
export const createScreenshotUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orderId: z.string().min(1),
        mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: payment } = await supabase
      .from("course_payments")
      .select("id, user_id")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (!payment || payment.user_id !== userId) throw new Error("Forbidden");

    const ext =
      data.mime === "image/png" ? "png" : data.mime === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${data.orderId}-${Date.now()}.${ext}`;

    const { data: signed, error } = await supabase.storage
      .from("payment-screenshots")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed?.token ?? null, uploadUrl: signed?.signedUrl ?? null };
  });
