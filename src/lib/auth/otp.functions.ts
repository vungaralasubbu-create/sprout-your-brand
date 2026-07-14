import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomInt } from "crypto";

function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length < 10) return null;
  // Store the last 10 digits as canonical for lookup consistency.
  return digits.slice(-10);
}

function hashCode(code: string, mobile: string): string {
  return createHash("sha256").update(`${mobile}:${code}:glintr-otp`).digest("hex");
}

const requestSchema = z.object({
  mobile: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().nullable(),
  purpose: z.enum(["login", "signup"]).default("login"),
});

export const requestLoginOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    const mobile = normalizeMobile(data.mobile);
    if (!mobile) return { ok: false as const, error: "Enter a valid 10-digit mobile number." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Basic rate limit: max 3 unconsumed codes in the last 10 min per mobile.
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("auth_otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("mobile", mobile)
      .is("consumed_at", null)
      .gte("created_at", tenMinAgo);
    if ((count ?? 0) >= 3) {
      return { ok: false as const, error: "Too many OTP requests. Please wait a few minutes." };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.from("auth_otp_codes").insert({
      email: data.email ?? null,
      mobile,
      code_hash: hashCode(code, mobile),
      purpose: data.purpose,
      expires_at,
      attempts: 0,
    });
    if (error) {
      console.error("[otp] insert failed", error.message);
      return { ok: false as const, error: "Could not generate OTP. Please try again." };
    }

    const { sendSms } = await import("@/lib/sms/pearlsms.server");
    const message = `Your OTP is ${code}. Use this to verify your mobile number on SPPLFW. Valid for 5 minutes.`;
    const smsRes = await sendSms({ to: mobile, message, type: "TRANS" });
    if (!smsRes.ok) {
      console.error("[otp] sms send failed", smsRes.error);
      return { ok: false as const, error: "Could not send SMS. Please try again." };
    }
    return { ok: true as const };
  });

const verifySchema = z.object({
  mobile: z.string().trim().min(6).max(20),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const verifyLoginOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const mobile = normalizeMobile(data.mobile);
    if (!mobile) return { ok: false as const, error: "Invalid mobile number." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("auth_otp_codes")
      .select("id, code_hash, expires_at, consumed_at, attempts")
      .eq("mobile", mobile)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return { ok: false as const, error: "No active OTP. Request a new code." };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "OTP expired. Request a new code." };
    }
    if ((row.attempts ?? 0) >= 5) {
      return { ok: false as const, error: "Too many attempts. Request a new code." };
    }

    const expected = hashCode(data.code, mobile);
    if (expected !== row.code_hash) {
      await supabaseAdmin
        .from("auth_otp_codes")
        .update({ attempts: (row.attempts ?? 0) + 1 })
        .eq("id", row.id);
      return { ok: false as const, error: "Incorrect OTP." };
    }

    await supabaseAdmin
      .from("auth_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);
    return { ok: true as const };
  });
