import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHash, randomInt } from "crypto";

function mask(v: string | undefined): string {
  if (!v) return "";
  if (v.length <= 6) return "•".repeat(v.length);
  return `${v.slice(0, 3)}${"•".repeat(Math.max(4, v.length - 6))}${v.slice(-3)}`;
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const getAuthDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const smsBase = process.env.PEARLSMS_BASE_URL || "http://sms.pearlsms.com/public/sms/send";
    const config = {
      pearlsms_api_key_set: !!process.env.PEARLSMS_API_KEY,
      pearlsms_api_key_masked: mask(process.env.PEARLSMS_API_KEY),
      pearlsms_sender: process.env.PEARLSMS_SENDER || "",
      pearlsms_base_url: smsBase,
      pearlsms_admin_numbers: (process.env.PEARLSMS_ADMIN_NUMBERS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      ai_provider_configured: !!process.env.OPENAI_API_KEY,
      supabase_url_set: !!process.env.SUPABASE_URL,
      service_role_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // Warnings
    const warnings: string[] = [];
    if (!config.pearlsms_api_key_set) warnings.push("PEARLSMS_API_KEY is not set — OTP SMS cannot be dispatched.");
    if (!config.pearlsms_sender) warnings.push("PEARLSMS_SENDER is not set — provider will reject requests.");
    if (smsBase.startsWith("http://")) warnings.push("PEARLSMS_BASE_URL uses insecure http:// — the edge runtime may block plain-HTTP fetches. Switch to https://.");

    const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [{ count: sent24 }, { count: unconsumed }, { data: recent }] = await Promise.all([
      supabaseAdmin.from("auth_otp_codes").select("id", { count: "exact", head: true }).gte("created_at", since24),
      supabaseAdmin.from("auth_otp_codes").select("id", { count: "exact", head: true }).is("consumed_at", null).gte("expires_at", new Date().toISOString()),
      supabaseAdmin
        .from("auth_otp_codes")
        .select("id, mobile, email, purpose, expires_at, consumed_at, attempts, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const rows = recent ?? [];
    const nowMs = Date.now();
    const failed = rows.filter(
      (r: any) => !r.consumed_at && new Date(r.expires_at).getTime() < nowMs,
    ).length;

    return {
      config,
      warnings,
      counts: {
        sent24h: sent24 ?? 0,
        unconsumed: unconsumed ?? 0,
        expiredUnverified: failed,
      },
      recent: rows.map((r: any) => ({
        id: r.id,
        mobile: r.mobile ? `${r.mobile.slice(0, 2)}••••${r.mobile.slice(-2)}` : "",
        email: r.email
          ? r.email.replace(/^(.).*(@.*)$/, (_: string, a: string, b: string) => `${a}•••${b}`)
          : "",
        purpose: r.purpose,
        expires_at: r.expires_at,
        consumed_at: r.consumed_at,
        attempts: r.attempts,
        created_at: r.created_at,
        status: r.consumed_at
          ? "verified"
          : new Date(r.expires_at).getTime() < nowMs
            ? "expired"
            : "pending",
      })),
    };
  });

const testSmsSchema = z.object({
  mobile: z.string().trim().min(6).max(20),
  message: z.string().trim().min(1).max(300).optional(),
});

export const sendDiagnosticSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => testSmsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { sendSms } = await import("@/lib/sms/pearlsms.server");
    const started = Date.now();
    const res = await sendSms({
      to: data.mobile,
      message: data.message || `Glintr diagnostic ping ${new Date().toISOString()}`,
      type: "TRANS",
    });
    return {
      ok: res.ok,
      durationMs: Date.now() - started,
      provider_response: res.ok ? res.provider_response : null,
      error: res.ok ? null : res.error,
    };
  });

const testOtpSchema = z.object({
  mobile: z.string().trim().min(6).max(20),
  email: z.string().trim().email().optional().nullable(),
});

export const sendDiagnosticOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => testOtpSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const digits = data.mobile.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length < 10) return { ok: false as const, error: "Invalid mobile", provider_response: null };
    const mobile = digits.slice(-10);
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const code_hash = createHash("sha256").update(`${mobile}:${code}:glintr-otp`).digest("hex");
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insErr } = await supabaseAdmin.from("auth_otp_codes").insert({
      mobile,
      code_hash,
      purpose: "login",
      expires_at,
      attempts: 0,
      email: data.email ?? null,
    } as any);
    if (insErr) return { ok: false as const, error: `insert failed: ${insErr.message}`, provider_response: null };

    const { sendSms } = await import("@/lib/sms/pearlsms.server");
    const started = Date.now();
    const res = await sendSms({
      to: mobile,
      message: `Your OTP is ${code}. Use this to verify your mobile number on SPPLFW. Valid for 5 minutes.`,
      type: "TRANS",
    });
    return {
      ok: res.ok,
      durationMs: Date.now() - started,
      provider_response: res.ok ? res.provider_response : null,
      error: res.ok ? null : res.error,
      code_preview: res.ok ? `${code.slice(0, 2)}••••` : code, // reveal only if delivery failed (helps admin verify manually)
    };
  });
