import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * ---------- Public reads ----------
 */
export const listPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const c = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await c
    .from("bill_plans")
    .select("id,code,name,tier,tagline,description,monthly_price_inr,yearly_price_inr,trial_days,is_recommended,sort_order,features,limits")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order");
  if (error) return { plans: [] };
  return { plans: data ?? [] };
});

/**
 * ---------- Authenticated: my workspace billing snapshot ----------
 */
export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: ws } = await supabase
      .from("mc_workspace_members")
      .select("workspace_id,role,mc_workspaces(id,name,slug)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!ws?.workspace_id) return { workspace: null };
    const workspaceId = ws.workspace_id;

    const [subRes, usageRes, invRes, plansRes] = await Promise.all([
      supabase
        .from("bill_subscriptions")
        .select("id,plan_id,status,billing_cycle,current_period_start,current_period_end,trial_end,cancel_at_period_end,provider,bill_plans(name,code,tier,monthly_price_inr,yearly_price_inr,limits,features)")
        .eq("workspace_id", workspaceId)
        .in("status", ["trialing", "active", "past_due"])
        .maybeSingle(),
      supabase.from("bill_workspace_usage").select("*").eq("workspace_id", workspaceId).maybeSingle(),
      supabase
        .from("bill_invoices")
        .select("id,invoice_number,status,total_inr,issued_at,created_at,pdf_url")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("bill_plans").select("id,code,name,tier,monthly_price_inr,yearly_price_inr").eq("is_active", true).order("sort_order"),
    ]);

    return {
      workspace: ws.mc_workspaces,
      role: ws.role,
      subscription: subRes.data ?? null,
      usage: usageRes.data ?? null,
      recentInvoices: invRes.data ?? [],
      plans: plansRes.data ?? [],
    };
  });

/**
 * ---------- Usage details ----------
 */
export const getUsageDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("mc_workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws?.workspace_id) return { transactions: [], usage: null };
    const [tx, usage] = await Promise.all([
      supabase
        .from("bill_credit_transactions")
        .select("id,delta,balance_after,reason,ref_type,created_at")
        .eq("workspace_id", ws.workspace_id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("bill_workspace_usage").select("*").eq("workspace_id", ws.workspace_id).maybeSingle(),
    ]);
    return { transactions: tx.data ?? [], usage: usage.data ?? null };
  });

/**
 * ---------- Invoices ----------
 */
export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("mc_workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws?.workspace_id) return { invoices: [] };
    const { data } = await supabase
      .from("bill_invoices")
      .select("id,invoice_number,status,total_inr,subtotal_inr,tax_inr,discount_inr,issued_at,due_at,paid_at,created_at,pdf_url,gst_number")
      .eq("workspace_id", ws.workspace_id)
      .order("created_at", { ascending: false });
    return { invoices: data ?? [] };
  });

/**
 * ---------- Payment methods ----------
 */
export const listPaymentMethods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("mc_workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws?.workspace_id) return { methods: [] };
    const { data } = await supabase
      .from("bill_payment_methods")
      .select("*")
      .eq("workspace_id", ws.workspace_id)
      .order("created_at", { ascending: false });
    return { methods: data ?? [] };
  });

/**
 * ---------- Payment history ----------
 */
export const listPaymentHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("mc_workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws?.workspace_id) return { payments: [] };
    const { data } = await supabase
      .from("bill_payments")
      .select("id,amount_inr,currency,status,method_type,provider,failure_reason,paid_at,refunded_at,created_at")
      .eq("workspace_id", ws.workspace_id)
      .order("created_at", { ascending: false });
    return { payments: data ?? [] };
  });

/**
 * ---------- Coupons ----------
 */
export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("bill_coupons")
      .select("id,code,kind,percent_off,amount_off_inr,free_trial_days,expires_at,max_redemptions,redemptions_used")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    return { coupons: data ?? [] };
  });

export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().trim().min(1).max(64) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: c } = await supabase
      .from("bill_coupons")
      .select("id,code,kind,percent_off,amount_off_inr,free_trial_days,expires_at,max_redemptions,redemptions_used,is_active")
      .ilike("code", data.code)
      .maybeSingle();
    if (!c || !c.is_active) return { valid: false, reason: "Invalid or inactive coupon" };
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { valid: false, reason: "Coupon expired" };
    if (c.max_redemptions && c.redemptions_used >= c.max_redemptions) return { valid: false, reason: "Coupon fully redeemed" };
    return { valid: true, coupon: c };
  });

/**
 * ---------- Checkout: provider-agnostic ----------
 */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        planCode: z.string().min(1),
        billingCycle: z.enum(["monthly", "yearly"]),
        couponCode: z.string().trim().max(64).optional(),
        provider: z.enum(["cashfree", "stripe", "paddle", "razorpay", "lemonsqueezy"]).default("cashfree"),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId, claims } = context;

    // Locate workspace
    const { data: ws } = await supabase
      .from("mc_workspace_members")
      .select("workspace_id,role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws?.workspace_id) throw new Error("No workspace found");
    if (!["owner", "admin"].includes(ws.role ?? "")) throw new Error("Only workspace owners or admins can purchase");

    // Plan lookup
    const { data: plan } = await supabase
      .from("bill_plans")
      .select("id,code,monthly_price_inr,yearly_price_inr,trial_days")
      .eq("code", data.planCode)
      .maybeSingle();
    if (!plan) throw new Error("Plan not found");

    let baseAmount = data.billingCycle === "yearly" ? Number(plan.yearly_price_inr) : Number(plan.monthly_price_inr);
    let discount = 0;

    if (data.couponCode) {
      const { data: c } = await supabase
        .from("bill_coupons")
        .select("id,kind,percent_off,amount_off_inr,is_active,expires_at,max_redemptions,redemptions_used")
        .ilike("code", data.couponCode)
        .maybeSingle();
      if (c?.is_active && (!c.expires_at || new Date(c.expires_at) > new Date())) {
        if (c.kind === "percentage" && c.percent_off) {
          discount = Math.round((baseAmount * Number(c.percent_off)) / 100);
        } else if (c.kind === "flat_amount" && c.amount_off_inr) {
          discount = Math.min(baseAmount, Number(c.amount_off_inr));
        }
      }
    }

    // 18% GST (India)
    const taxable = Math.max(0, baseAmount - discount);
    const tax = Math.round(taxable * 0.18);
    const idempotencyKey = crypto.randomUUID();

    const { getProvider } = await import("./providers/registry.server");
    const provider = getProvider(data.provider);

    const email = (claims as any)?.email ?? `${userId}@glintr.local`;

    const checkout = await provider.createCheckout({
      workspaceId: ws.workspace_id,
      planCode: plan.code,
      billingCycle: data.billingCycle,
      amountInr: baseAmount,
      taxInr: tax,
      discountInr: discount,
      customer: { id: userId, email, workspaceId: ws.workspace_id },
      couponCode: data.couponCode,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      idempotencyKey,
    });

    // Record pending payment via admin client (idempotent)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("bill_payments").insert({
      workspace_id: ws.workspace_id,
      provider: provider.code,
      provider_order_id: checkout.orderId,
      amount_inr: baseAmount,
      tax_inr: tax,
      discount_inr: discount,
      status: "pending",
      idempotency_key: idempotencyKey,
      metadata: { plan_code: plan.code, billing_cycle: data.billingCycle, coupon: data.couponCode ?? null },
    });

    return {
      provider: provider.code,
      orderId: checkout.orderId,
      paymentSessionId: checkout.paymentSessionId,
      paymentUrl: checkout.paymentUrl,
      amount: baseAmount,
      tax,
      discount,
      total: baseAmount + tax - discount,
    };
  });

/**
 * ---------- Cancel subscription (schedule at period end) ----------
 */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("mc_workspace_members")
      .select("workspace_id,role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws?.workspace_id) throw new Error("No workspace");
    if (!["owner", "admin"].includes(ws.role ?? "")) throw new Error("Only owners can cancel");
    await supabase
      .from("bill_subscriptions")
      .update({ cancel_at_period_end: true, canceled_at: new Date().toISOString() })
      .eq("workspace_id", ws.workspace_id)
      .in("status", ["trialing", "active", "past_due"]);
    return { ok: true };
  });
