import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadAmbassador(context: any) {
  const { supabase, userId } = context;
  const { data: profile } = await supabase
    .from("campus_ambassador_profiles")
    .select("id, full_name, status, ambassador_code, user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return null;
  const status = (profile.status as string) || "active";
  if (status === "terminated" || status === "inactive") return null;
  return profile;
}

async function loadPolicy(supabase: any) {
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", [
      "campus_ambassador.payout.min_amount",
      "campus_ambassador.payout.mode",
      "campus_ambassador.payout.partial_allowed",
    ]);
  const map: Record<string, any> = {};
  for (const r of data ?? []) map[r.key] = r.value;
  const min = Number(map["campus_ambassador.payout.min_amount"] ?? 1000);
  const mode = (map["campus_ambassador.payout.mode"] ?? "request") as "request" | "automatic";
  const partial = Boolean(map["campus_ambassador.payout.partial_allowed"] ?? true);
  return { min_amount: min, mode, partial_allowed: partial };
}

function maskedDestination(profile: any) {
  if (!profile) return null;
  if (profile.payout_method === "bank_account") {
    return [profile.bank_name, profile.account_number_masked].filter(Boolean).join(" • ");
  }
  if (profile.payout_method === "upi") {
    return profile.upi_id_masked;
  }
  return null;
}

// ============= OVERVIEW =============
export const getPayoutsOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const };
    const { supabase } = context;

    const [commRes, profRes, payoutRes, policy] = await Promise.all([
      supabase
        .from("ambassador_commissions")
        .select("id, status, calculated_commission")
        .eq("ambassador_id", profile.id),
      supabase
        .from("ambassador_payout_profiles")
        .select("id, profile_code, status, payout_method, bank_name, account_number_masked, upi_id_masked, beneficiary_name, admin_public_message, verified_at, submitted_at, updated_at")
        .eq("ambassador_id", profile.id)
        .maybeSingle(),
      supabase
        .from("ambassador_payouts")
        .select("id, payout_code, amount, status, requested_at, paid_at, payout_method, masked_destination")
        .eq("ambassador_id", profile.id)
        .order("created_at", { ascending: false }),
      loadPolicy(supabase),
    ]);

    const commissions = commRes.data ?? [];
    const sum = (statuses: string[]) =>
      commissions.filter((c: any) => statuses.includes(c.status)).reduce((s: number, c: any) => s + Number(c.calculated_commission ?? 0), 0);

    const available = sum(["available"]);
    const processing = sum(["payout_processing"]);
    const paid = sum(["paid"]);

    const payouts = payoutRes.data ?? [];
    const lastPaid = payouts.find((p: any) => p.status === "paid");

    return {
      gate: "ok" as const,
      profile: { id: profile.id, ambassador_code: profile.ambassador_code, full_name: profile.full_name },
      summary: {
        available,
        processing,
        paid,
        last_payout: lastPaid ? { amount: Number(lastPaid.amount), paid_at: lastPaid.paid_at } : null,
      },
      payout_profile: profRes.data ?? null,
      payouts: payouts.slice(0, 25),
      policy,
    };
  });

// ============= PROFILE =============
const bankSchema = z.object({
  payout_method: z.literal("bank_account"),
  account_holder_name: z.string().trim().min(2).max(120),
  bank_name: z.string().trim().min(2).max(120),
  account_number: z.string().trim().regex(/^\d{6,20}$/, "Invalid account number"),
  confirm_account_number: z.string().trim(),
  ifsc_code: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Invalid IFSC"),
  account_type: z.enum(["savings", "current"]),
}).refine((v) => v.account_number === v.confirm_account_number, {
  message: "Account numbers do not match",
  path: ["confirm_account_number"],
});

const upiSchema = z.object({
  payout_method: z.literal("upi"),
  upi_id: z.string().trim().regex(/^[a-zA-Z0-9._-]{2,}@[a-zA-Z][a-zA-Z0-9.]{1,}$/, "Invalid UPI ID"),
  confirm_upi_id: z.string().trim(),
  beneficiary_name: z.string().trim().min(2).max(120),
}).refine((v) => v.upi_id === v.confirm_upi_id, {
  message: "UPI IDs do not match",
  path: ["confirm_upi_id"],
});

const payoutProfileSchema = z.union([bankSchema, upiSchema]);

export const submitPayoutProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => payoutProfileSchema.parse(v))
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: existing } = await supabase
      .from("ambassador_payout_profiles")
      .select("id, status")
      .eq("ambassador_id", profile.id)
      .maybeSingle();

    const payload: any = {
      ambassador_id: profile.id,
      user_id: profile.user_id,
      status: "submitted",
      payout_method: data.payout_method,
    };

    if (data.payout_method === "bank_account") {
      Object.assign(payload, {
        account_holder_name: data.account_holder_name,
        bank_name: data.bank_name,
        account_number: data.account_number,
        ifsc_code: data.ifsc_code.toUpperCase(),
        account_type: data.account_type,
        beneficiary_name: data.account_holder_name,
        upi_id: null,
      });
    } else {
      Object.assign(payload, {
        upi_id: data.upi_id,
        beneficiary_name: data.beneficiary_name,
        account_holder_name: null,
        bank_name: null,
        account_number: null,
        ifsc_code: null,
        account_type: null,
      });
    }

    let profileId = existing?.id;
    if (existing) {
      const { error } = await supabase
        .from("ambassador_payout_profiles")
        .update(payload)
        .eq("id", existing.id);
      if (error) return { gate: "error" as const, message: error.message };
    } else {
      const { data: inserted, error } = await supabase
        .from("ambassador_payout_profiles")
        .insert(payload)
        .select("id")
        .single();
      if (error) return { gate: "error" as const, message: error.message };
      profileId = inserted.id;
    }

    await supabase.from("ambassador_payout_activity").insert({
      ambassador_id: profile.id,
      profile_id: profileId,
      event_type: existing ? "profile_updated" : "profile_submitted",
      description: existing
        ? "Payout profile updated and re-submitted for verification"
        : "Payout profile submitted for verification",
    });

    return { gate: "ok" as const, profile_id: profileId };
  });

// ============= PAYOUT ELIGIBILITY =============
async function computeEligibility(supabase: any, ambassadorId: string) {
  const [{ data: payoutProfile }, { data: available }, policy, { data: activePayouts }] = await Promise.all([
    supabase
      .from("ambassador_payout_profiles")
      .select("id, status, payout_method")
      .eq("ambassador_id", ambassadorId)
      .maybeSingle(),
    supabase
      .from("ambassador_commissions")
      .select("id, calculated_commission")
      .eq("ambassador_id", ambassadorId)
      .eq("status", "available"),
    loadPolicy(supabase),
    supabase
      .from("ambassador_payouts")
      .select("id, status")
      .eq("ambassador_id", ambassadorId)
      .in("status", ["requested", "under_review", "approved", "processing"]),
  ]);

  const availableAmount = (available ?? []).reduce((s: number, c: any) => s + Number(c.calculated_commission ?? 0), 0);
  const reasons: string[] = [];

  if (!payoutProfile) reasons.push("Set up your payout profile before requesting a payout.");
  else if (payoutProfile.status !== "verified") reasons.push("Your payout profile must be verified before requesting a payout.");

  if (availableAmount < policy.min_amount) reasons.push(`Minimum payout amount is ₹${policy.min_amount.toLocaleString("en-IN")}.`);
  if ((activePayouts ?? []).length > 0) reasons.push("You already have an active payout in progress.");

  return {
    eligible: reasons.length === 0,
    reasons,
    available_amount: availableAmount,
    policy,
    payout_profile_status: payoutProfile?.status ?? "not_added",
  };
}

export const getPayoutEligibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const };
    return { gate: "ok" as const, ...(await computeEligibility(context.supabase, profile.id)) };
  });

// ============= REQUEST PAYOUT =============
export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      amount: z.number().positive().optional(),
      idempotency_key: z.string().min(6).max(64),
    }).parse(v)
  )
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const };
    const { supabase } = context;

    // Idempotency
    const { data: existing } = await supabase
      .from("ambassador_payouts")
      .select("id")
      .eq("ambassador_id", profile.id)
      .eq("idempotency_key", data.idempotency_key)
      .maybeSingle();
    if (existing) return { gate: "ok" as const, payout_id: existing.id, duplicate: true };

    const elig = await computeEligibility(supabase, profile.id);
    if (!elig.eligible) return { gate: "ineligible" as const, reasons: elig.reasons };

    const { data: available } = await supabase
      .from("ambassador_commissions")
      .select("id, calculated_commission")
      .eq("ambassador_id", profile.id)
      .eq("status", "available")
      .order("available_at", { ascending: true });

    const requested = data.amount ?? elig.available_amount;
    if (requested <= 0) return { gate: "ineligible" as const, reasons: ["Amount must be greater than zero."] };
    if (requested > elig.available_amount) return { gate: "ineligible" as const, reasons: ["Amount exceeds available earnings."] };
    if (!elig.policy.partial_allowed && requested !== elig.available_amount) {
      return { gate: "ineligible" as const, reasons: ["Partial payouts are not permitted; request full available balance."] };
    }
    if (requested < elig.policy.min_amount) {
      return { gate: "ineligible" as const, reasons: [`Minimum payout amount is ₹${elig.policy.min_amount.toLocaleString("en-IN")}.`] };
    }

    // Allocate commissions FIFO up to requested amount (integer allocation of full commission amounts only)
    const chosen: { id: string; amount: number }[] = [];
    let total = 0;
    for (const c of available ?? []) {
      const amt = Number(c.calculated_commission ?? 0);
      if (total + amt > requested) continue;
      chosen.push({ id: c.id, amount: amt });
      total += amt;
      if (total >= requested) break;
    }
    if (total === 0) return { gate: "ineligible" as const, reasons: ["No commissions available to allocate for this amount."] };

    // Latest verified version
    const { data: profRow } = await supabase
      .from("ambassador_payout_profiles")
      .select("id, payout_method, bank_name, account_number_masked, upi_id_masked")
      .eq("ambassador_id", profile.id)
      .maybeSingle();
    const { data: version } = profRow
      ? await supabase
          .from("ambassador_payout_profile_versions")
          .select("id")
          .eq("profile_id", profRow.id)
          .eq("status", "verified")
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    const masked = maskedDestination(profRow);

    const { data: created, error } = await supabase
      .from("ambassador_payouts")
      .insert({
        ambassador_id: profile.id,
        user_id: profile.user_id,
        payout_profile_id: profRow?.id ?? null,
        payout_profile_version_id: version?.id ?? null,
        amount: total,
        payout_method: profRow?.payout_method,
        masked_destination: masked,
        mode: elig.policy.mode === "automatic" ? "automatic" : "request",
        idempotency_key: data.idempotency_key,
      })
      .select("id, payout_code")
      .single();
    if (error) return { gate: "error" as const, message: error.message };

    // Allocations
    const allocations = chosen.map((c) => ({
      payout_id: created.id,
      commission_id: c.id,
      allocated_amount: c.amount,
    }));
    const { error: allocErr } = await supabase.from("ambassador_payout_allocations").insert(allocations);
    if (allocErr) {
      // rollback the payout since allocations failed
      await supabase.from("ambassador_payouts").delete().eq("id", created.id);
      return { gate: "error" as const, message: allocErr.message };
    }

    await supabase.from("ambassador_payout_activity").insert({
      ambassador_id: profile.id,
      payout_id: created.id,
      event_type: "payout_requested",
      description: `Payout requested (${created.payout_code}) for ₹${total.toLocaleString("en-IN")}`,
    });

    return { gate: "ok" as const, payout_id: created.id, payout_code: created.payout_code };
  });

// ============= CANCEL PAYOUT (only while requested) =============
export const cancelPayoutRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const };
    const { supabase } = context;
    const { data: payout } = await supabase
      .from("ambassador_payouts")
      .select("id, status, ambassador_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!payout || payout.ambassador_id !== profile.id) return { gate: "forbidden" as const };
    if (payout.status !== "requested") return { gate: "not_cancellable" as const };

    const { error } = await supabase
      .from("ambassador_payouts")
      .update({ status: "cancelled" })
      .eq("id", payout.id);
    if (error) return { gate: "error" as const, message: error.message };

    await supabase.from("ambassador_payout_activity").insert({
      ambassador_id: profile.id,
      payout_id: payout.id,
      event_type: "payout_cancelled",
      description: "Payout cancelled by ambassador",
    });
    return { gate: "ok" as const };
  });

// ============= PAYOUT LIST =============
export const listPayouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      status: z.string().optional(),
      search: z.string().optional(),
    }).parse(v ?? {})
  )
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const, rows: [] };
    const { supabase } = context;
    let q = supabase
      .from("ambassador_payouts")
      .select("id, payout_code, amount, status, payout_method, masked_destination, requested_at, paid_at, provider_reference")
      .eq("ambassador_id", profile.id)
      .order("created_at", { ascending: false });
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    const { data: rows } = await q;
    let list = rows ?? [];
    if (data.search?.trim()) {
      const s = data.search.trim().toLowerCase();
      list = list.filter((r: any) =>
        (r.payout_code || "").toLowerCase().includes(s) ||
        (r.provider_reference || "").toLowerCase().includes(s)
      );
    }
    return { gate: "ok" as const, rows: list };
  });

// ============= PAYOUT DETAILS =============
export const getPayoutDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: payout } = await supabase
      .from("ambassador_payouts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!payout) return { gate: "not_found" as const };
    if (payout.ambassador_id !== profile.id) return { gate: "forbidden" as const };

    const [{ data: allocations }, { data: activity }] = await Promise.all([
      supabase
        .from("ambassador_payout_allocations")
        .select("id, allocated_amount, commission_id")
        .eq("payout_id", payout.id),
      supabase
        .from("ambassador_payout_activity")
        .select("id, event_type, description, created_at")
        .eq("payout_id", payout.id)
        .order("created_at", { ascending: true }),
    ]);

    const commissionIds = (allocations ?? []).map((a: any) => a.commission_id);
    const { data: commissions } = commissionIds.length
      ? await supabase
          .from("ambassador_commissions")
          .select("id, transaction_code, enrollment_id, program_id, calculated_commission")
          .in("id", commissionIds)
      : { data: [] };

    const programIds = Array.from(new Set((commissions ?? []).map((c: any) => c.program_id).filter(Boolean)));
    const { data: courses } = programIds.length
      ? await supabase.from("courses").select("id, name, slug").in("id", programIds)
      : { data: [] };
    const courseMap: Record<string, any> = {};
    for (const c of courses ?? []) courseMap[c.id] = c;

    const enrIds = Array.from(new Set((commissions ?? []).map((c: any) => c.enrollment_id).filter(Boolean)));
    const { data: enrollments } = enrIds.length
      ? await supabase.from("enrollments").select("id, enrollment_code").in("id", enrIds)
      : { data: [] };
    const enrMap: Record<string, any> = {};
    for (const e of enrollments ?? []) enrMap[e.id] = e;

    const items = (allocations ?? []).map((a: any) => {
      const c = (commissions ?? []).find((x: any) => x.id === a.commission_id);
      return {
        allocation_id: a.id,
        commission_id: a.commission_id,
        transaction_code: c?.transaction_code ?? null,
        program_name: c?.program_id ? courseMap[c.program_id]?.name ?? "Program" : "Program",
        enrollment_code: c?.enrollment_id ? enrMap[c.enrollment_id]?.enrollment_code ?? null : null,
        commission_amount: Number(c?.calculated_commission ?? 0),
        allocated_amount: Number(a.allocated_amount),
      };
    });

    return {
      gate: "ok" as const,
      payout: {
        id: payout.id,
        payout_code: payout.payout_code,
        amount: Number(payout.amount),
        currency: payout.currency,
        status: payout.status,
        mode: payout.mode,
        payout_method: payout.payout_method,
        masked_destination: payout.masked_destination,
        provider_reference: payout.provider_reference,
        public_failure_reason: payout.public_failure_reason,
        public_hold_reason: payout.public_hold_reason,
        public_reversal_reason: payout.public_reversal_reason,
        requested_at: payout.requested_at,
        approved_at: payout.approved_at,
        processing_at: payout.processing_at,
        paid_at: payout.paid_at,
        failed_at: payout.failed_at,
        on_hold_at: payout.on_hold_at,
        cancelled_at: payout.cancelled_at,
        reversed_at: payout.reversed_at,
      },
      allocations: items,
      activity: activity ?? [],
    };
  });
