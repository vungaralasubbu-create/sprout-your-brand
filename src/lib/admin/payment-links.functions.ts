import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PLANS = ["self_paced_edge", "career_launch", "career_pro"] as const;
export type PaymentPlan = (typeof PLANS)[number];

const trimmedOrNull = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));


export const PLAN_LABELS: Record<PaymentPlan, string> = {
  self_paced_edge: "Self-Paced Edge",
  career_launch: "Career Launch",
  career_pro: "Career Pro",
};

export const PLAN_DEFAULT_AMOUNT: Record<PaymentPlan, number> = {
  self_paced_edge: 3999,
  career_launch: 5499,
  career_pro: 9999,
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin access required.");
}

/** Summary KPIs for the admin dashboard header. */
export const getPaymentLinkSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const [linksRes, assignRes, verifiedRes] = await Promise.all([
      supabase.from("payment_links").select("status"),
      supabase.from("partner_lead_payment_links").select("id", { count: "exact", head: true }),
      supabase
        .from("partner_payment_submissions")
        .select("amount, status")
        .eq("status", "verified"),
    ]);
    if (linksRes.error) throw new Error(linksRes.error.message);
    if (assignRes.error) throw new Error(assignRes.error.message);
    if (verifiedRes.error) throw new Error(verifiedRes.error.message);

    const links = (linksRes.data ?? []) as { status: string }[];
    const active = links.filter((l) => l.status === "active").length;
    const disabled = links.filter((l) => l.status === "disabled").length;
    const archived = links.filter((l) => l.status === "archived").length;
    const verifiedAmount = (verifiedRes.data ?? []).reduce(
      (s: number, r: any) => s + Number(r.amount || 0),
      0,
    );

    return {
      total: links.length,
      active,
      disabled,
      archived,
      assigned: assignRes.count ?? 0,
      verified: verifiedRes.data?.length ?? 0,
      verifiedAmount,
    };
  });

/** Programs (published courses) usable for new payment links. */
export const listProgramsForLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, slug, status, is_published")
      .eq("status", "published")
      .eq("is_published", true)
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));
  });

/** All master payment links for the admin table. */
export const listPaymentLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        status: z.enum(["all", "active", "disabled", "archived"]).optional().default("all"),
        search: z.string().trim().max(120).optional().default(""),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    let q = supabase
      .from("payment_links")
      .select(
        "id, code, name, plan, amount, url, status, notes, created_at, disabled_at, course_id, merchant_name, upi_id, account_holder, bank_name, qr_image_url, is_default_active, courses:course_id(id, name, slug)",
      )
      .order("created_at", { ascending: false });
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const linkIds = (rows ?? []).map((r: any) => r.id);
    const assignCounts: Record<string, number> = {};
    const verifiedCounts: Record<string, number> = {};
    const verifiedAmounts: Record<string, number> = {};

    if (linkIds.length) {
      const { data: assigns } = await supabase
        .from("partner_lead_payment_links")
        .select("payment_link_id")
        .in("payment_link_id", linkIds);
      for (const a of (assigns ?? []) as any[]) {
        assignCounts[a.payment_link_id] = (assignCounts[a.payment_link_id] ?? 0) + 1;
      }
      const { data: subs } = await supabase
        .from("partner_payment_submissions")
        .select("payment_link_id, amount, status")
        .eq("status", "verified")
        .in("payment_link_id", linkIds);
      for (const s of (subs ?? []) as any[]) {
        verifiedCounts[s.payment_link_id] = (verifiedCounts[s.payment_link_id] ?? 0) + 1;
        verifiedAmounts[s.payment_link_id] =
          (verifiedAmounts[s.payment_link_id] ?? 0) + Number(s.amount || 0);
      }
    }

    const search = data.search.toLowerCase();
    const filtered = (rows ?? []).filter((r: any) => {
      if (!search) return true;
      return (
        (r.code ?? "").toLowerCase().includes(search) ||
        (r.name ?? "").toLowerCase().includes(search) ||
        (r.courses?.name ?? "").toLowerCase().includes(search)
      );
    });

    return filtered.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      plan: r.plan as PaymentPlan,
      plan_label: PLAN_LABELS[r.plan as PaymentPlan],
      amount: Number(r.amount),
      url: r.url as string | null,
      status: r.status as "active" | "disabled" | "archived",
      notes: r.notes ?? null,
      created_at: r.created_at,
      program_id: r.course_id,
      program_name: r.courses?.name ?? "—",
      program_slug: r.courses?.slug ?? null,
      merchant_name: r.merchant_name ?? null,
      upi_id: r.upi_id ?? null,
      account_holder: r.account_holder ?? null,
      bank_name: r.bank_name ?? null,
      qr_image_url: r.qr_image_url ?? null,
      is_default_active: !!r.is_default_active,
      assigned_count: assignCounts[r.id] ?? 0,
      verified_count: verifiedCounts[r.id] ?? 0,
      verified_amount: verifiedAmounts[r.id] ?? 0,
    }));
  });

const createSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    course_id: z.string().uuid(),
    plan: z.enum(PLANS),
    amount: z.coerce.number().min(0).max(10_000_000),
    // Legacy URL is now optional — QR-based accounts don't need it.
    url: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().nullable(),
    merchant_name: trimmedOrNull,
    upi_id: trimmedOrNull,
    account_holder: trimmedOrNull,
    bank_name: trimmedOrNull,
    qr_image_url: trimmedOrNull,
  })
  .refine((v) => !!(v.url && v.url.length) || !!(v.upi_id && v.qr_image_url), {
    message: "Provide either a payment URL, or a UPI ID + QR code image.",
    path: ["upi_id"],
  });

/** Create a master payment link / payment gateway account. */
export const createPaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: course, error: cErr } = await supabase
      .from("courses")
      .select("id, name, status, is_published")
      .eq("id", data.course_id)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!course) throw new Error("Program not found.");
    if (course.status !== "published" || !course.is_published) {
      throw new Error("Program must be published.");
    }

    const { data: inserted, error } = await supabase
      .from("payment_links")
      .insert({
        name: data.name,
        course_id: data.course_id,
        plan: data.plan,
        amount: data.amount,
        url: data.url && data.url.length ? data.url : null,
        notes: data.notes ?? null,
        merchant_name: data.merchant_name,
        upi_id: data.upi_id,
        account_holder: data.account_holder,
        bank_name: data.bank_name,
        qr_image_url: data.qr_image_url,
        status: "active",
        created_by: userId,
      } as any)
      .select("id, code")
      .single();
    if (error) throw new Error(error.message);
    return { id: (inserted as any).id as string, code: (inserted as any).code as string };
  });

const editSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  url: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(["active", "disabled", "archived"]),
  merchant_name: trimmedOrNull,
  upi_id: trimmedOrNull,
  account_holder: trimmedOrNull,
  bank_name: trimmedOrNull,
  qr_image_url: trimmedOrNull,
});

/** Edit safe fields on a payment link — never mutates plan/amount/course. */
export const updatePaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => editSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const patch: Record<string, unknown> = {
      name: data.name,
      url: data.url && data.url.length ? data.url : null,
      notes: data.notes ?? null,
      status: data.status,
      merchant_name: data.merchant_name,
      upi_id: data.upi_id,
      account_holder: data.account_holder,
      bank_name: data.bank_name,
      qr_image_url: data.qr_image_url,
    };
    if (data.status === "disabled") {
      patch.disabled_by = userId;
    } else if (data.status === "active") {
      patch.disabled_by = null;
      patch.disabled_at = null;
    }
    const { error } = await supabase.from("payment_links").update(patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Mark this payment account as the single platform-wide default. */
export const setPaymentLinkActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    // Clear the current default first, then set the new one (partial unique index enforces single row).
    const clr = await supabase
      .from("payment_links")
      .update({ is_default_active: false } as any)
      .eq("is_default_active", true);
    if (clr.error) throw new Error(clr.error.message);
    const upd = await supabase
      .from("payment_links")
      .update({ is_default_active: true, status: "active", disabled_at: null, disabled_by: null } as any)
      .eq("id", data.id);
    if (upd.error) throw new Error(upd.error.message);
    return { ok: true };
  });

/** Clear the platform-wide default (deactivate). */
export const clearPaymentLinkActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from("payment_links")
      .update({ is_default_active: false } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "disabled", "archived"]),
});

/** Toggle status (Disable / Enable / Archive) with audit fields. */
export const setPaymentLinkStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "disabled") {
      patch.disabled_by = userId;
    } else if (data.status === "active") {
      patch.disabled_by = null;
      patch.disabled_at = null;
    }
    const { error } = await supabase.from("payment_links").update(patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Detailed view: link + analytics + partner performance + lead activity. */
export const getPaymentLinkDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: link, error } = await supabase
      .from("payment_links")
      .select(
        "id, code, name, plan, amount, url, status, notes, created_at, created_by, disabled_by, disabled_at, course_id, courses:course_id(id, name, slug)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!link) throw new Error("Payment link not found.");

    const { data: assigns } = await supabase
      .from("partner_lead_payment_links")
      .select(
        "id, partner_id, lead_id, assigned_at, status, amount, partners:partner_id(id, display_name, full_name), leads:lead_id(id, full_name)",
      )
      .eq("payment_link_id", data.id)
      .order("assigned_at", { ascending: false });

    const { data: subs } = await supabase
      .from("partner_payment_submissions")
      .select("id, partner_id, lead_id, status, amount")
      .eq("payment_link_id", data.id);

    const totalAssignments = assigns?.length ?? 0;
    const uniqueLeads = new Set((assigns ?? []).map((a: any) => a.lead_id)).size;
    const partnersUsing = new Set((assigns ?? []).map((a: any) => a.partner_id)).size;
    const proofsSubmitted = subs?.length ?? 0;
    const verifiedSubs = (subs ?? []).filter((s: any) => s.status === "verified");
    const rejectedSubs = (subs ?? []).filter((s: any) => s.status === "rejected");
    const verifiedRevenue = verifiedSubs.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

    // Partner performance breakdown
    const partnerMap = new Map<
      string,
      {
        partner_id: string;
        name: string;
        assigned: number;
        proofs: number;
        verified: number;
        verified_amount: number;
      }
    >();
    for (const a of (assigns ?? []) as any[]) {
      const key = a.partner_id;
      if (!partnerMap.has(key)) {
        partnerMap.set(key, {
          partner_id: key,
          name: a.partners?.display_name ?? a.partners?.full_name ?? "—",
          assigned: 0,
          proofs: 0,
          verified: 0,
          verified_amount: 0,
        });
      }
      partnerMap.get(key)!.assigned += 1;
    }
    for (const s of (subs ?? []) as any[]) {
      if (!partnerMap.has(s.partner_id)) {
        partnerMap.set(s.partner_id, {
          partner_id: s.partner_id,
          name: "—",
          assigned: 0,
          proofs: 0,
          verified: 0,
          verified_amount: 0,
        });
      }
      const p = partnerMap.get(s.partner_id)!;
      p.proofs += 1;
      if (s.status === "verified") {
        p.verified += 1;
        p.verified_amount += Number(s.amount || 0);
      }
    }

    // Lead activity list
    const leadRows = (assigns ?? []).map((a: any) => {
      const leadSubs = (subs ?? []).filter((s: any) => s.lead_id === a.lead_id);
      const verified = leadSubs.find((s: any) => s.status === "verified");
      const status = verified
        ? "verified"
        : leadSubs.some((s: any) => s.status === "pending_verification")
        ? "pending"
        : leadSubs.some((s: any) => s.status === "rejected")
        ? "rejected"
        : "assigned";
      return {
        lead_id: a.lead_id,
        lead_name: a.leads?.full_name ?? "—",
        partner_name: a.partners?.display_name ?? a.partners?.full_name ?? "—",
        assigned_at: a.assigned_at,
        status,
        verified_amount: verified ? Number(verified.amount || 0) : 0,
      };
    });

    return {
      link: {
        id: link.id,
        code: link.code,
        name: link.name,
        plan: link.plan as PaymentPlan,
        plan_label: PLAN_LABELS[link.plan as PaymentPlan],
        amount: Number(link.amount),
        url: link.url,
        status: link.status,
        notes: link.notes,
        created_at: link.created_at,
        disabled_at: link.disabled_at,
        program_id: link.course_id,
        program_name: link.courses?.name ?? "—",
      },
      analytics: {
        totalAssignments,
        uniqueLeads,
        partnersUsing,
        proofsSubmitted,
        verified: verifiedSubs.length,
        rejected: rejectedSubs.length,
        verifiedRevenue,
        conversion:
          totalAssignments > 0 ? Math.round((verifiedSubs.length / totalAssignments) * 1000) / 10 : 0,
      },
      partnerPerformance: Array.from(partnerMap.values()).sort(
        (a, b) => b.verified_amount - a.verified_amount,
      ),
      leadActivity: leadRows,
    };
  });
