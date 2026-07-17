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

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function authErrorMessage(message: string | undefined): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid_credentials")) {
    return "OTP verified, but the email/password did not match. If this account was created with Google, use Continue with Google or reset your password.";
  }
  if (m.includes("email not confirmed")) return "OTP verified, but this email still needs confirmation before sign-in.";
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "This email already exists. Switch to Sign in, or use Forgot password if you do not remember the password.";
  }
  if (m.includes("network") || m.includes("fetch")) return "Network error while creating your session. Please retry.";
  return message || "Authentication failed while creating your session.";
}

async function createPasswordAuthClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(process.env.SUPABASE_URL!, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: undefined,
    },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
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
    const mobileStr: string = mobile;

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

    const insertRow: Record<string, unknown> = {
      mobile: mobileStr,
      code_hash: hashCode(code, mobileStr),
      purpose: data.purpose,
      expires_at,
      attempts: 0,
    };
    if (data.email) insertRow.email = normalizeEmail(data.email);
    const { error } = await supabaseAdmin.from("auth_otp_codes").insert(insertRow as any);
    if (error) {
      console.error("[otp] insert failed", error.message);
      return { ok: false as const, error: "Could not generate OTP. Please try again." };
    }

    const { sendSms } = await import("@/lib/sms/pearlsms.server");
    const message = `Your OTP is ${code}. Use this to verify your mobile number on SPPLFW. Valid for 5 minutes.`;
    const smsRes = await sendSms({ to: mobileStr, message, type: "TRANS" });
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

const completeSchema = z.object({
  mobile: z.string().trim().min(6).max(20),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  mode: z.enum(["signin", "signup"]).default("signin"),
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

export const completeOtpPasswordAuth = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => completeSchema.parse(data))
  .handler(async ({ data }) => {
    const mobile = normalizeMobile(data.mobile);
    if (!mobile) return { ok: false as const, step: "otp" as const, error: "Invalid mobile number." };

    const email = normalizeEmail(data.email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: otpReadError } = await supabaseAdmin
      .from("auth_otp_codes")
      .select("id, code_hash, expires_at, consumed_at, attempts, email, purpose")
      .eq("mobile", mobile)
      .eq("email", email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpReadError) {
      console.error("[otp] read failed", otpReadError.message);
      return { ok: false as const, step: "otp" as const, error: "Could not verify OTP. Please retry." };
    }
    if (!row) return { ok: false as const, step: "otp" as const, error: "No active OTP for this email and mobile. Request a new code." };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, step: "otp" as const, error: "OTP expired. Request a new code." };
    }
    if ((row.attempts ?? 0) >= 5) {
      return { ok: false as const, step: "otp" as const, error: "Too many OTP attempts. Request a new code." };
    }

    const expected = hashCode(data.code, mobile);
    if (expected !== row.code_hash) {
      await supabaseAdmin
        .from("auth_otp_codes")
        .update({ attempts: (row.attempts ?? 0) + 1 })
        .eq("id", row.id);
      return { ok: false as const, step: "otp" as const, error: "Invalid OTP. Check the 6-digit code and try again." };
    }

    const authClient = await createPasswordAuthClient();
    if (data.mode === "signup") {
      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: { mobile },
      });
      if (created.error) {
        const m = created.error.message.toLowerCase();
        if (!m.includes("already registered") && !m.includes("already been registered") && !m.includes("already exists")) {
          return { ok: false as const, step: "session" as const, error: authErrorMessage(created.error.message) };
        }
      }
    }

    const authResult = await authClient.auth.signInWithPassword({ email, password: data.password });

    if (authResult.error) {
      return { ok: false as const, step: "session" as const, error: authErrorMessage(authResult.error.message) };
    }

    const session = authResult.data.session;
    const user = authResult.data.user;
    if (!session?.access_token || !session.refresh_token || !user?.id) {
      return {
        ok: false as const,
        step: "session" as const,
        error: "OTP verified, but the session could not be created. Please try Forgot password or Continue with Google if this email uses Google sign-in.",
      };
    }

    const profileStatus = {
      studentProfile: "skipped" as "created_or_updated" | "failed" | "skipped",
      userRole: "skipped" as "created_or_updated" | "failed" | "skipped",
      authMetadata: "skipped" as "created_or_updated" | "failed" | "skipped",
    };

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...(user.user_metadata ?? {}), mobile },
    });
    profileStatus.authMetadata = metadataError ? "failed" : "created_or_updated";
    if (metadataError) console.error("[auth] mobile metadata update failed", metadataError.message);

    const { error: profileError } = await supabaseAdmin
      .from("student_profiles")
      .upsert({ user_id: user.id, email, mobile }, { onConflict: "user_id" });
    profileStatus.studentProfile = profileError ? "failed" : "created_or_updated";
    if (profileError) console.error("[auth] student profile upsert failed", profileError.message);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "student" as any }, { onConflict: "user_id,role" });
    profileStatus.userRole = roleError ? "failed" : "created_or_updated";
    if (roleError) console.error("[auth] user role upsert failed", roleError.message);

    if (profileError || roleError) {
      return {
        ok: false as const,
        step: "profile" as const,
        error: "Session created, but profile setup failed. Please retry or contact support.",
      };
    }

    await supabaseAdmin
      .from("auth_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    return {
      ok: true as const,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
      userId: user.id,
      debug: {
        otp: "verified",
        session: "created",
        profile: profileStatus,
        redirect: "pending_client_navigation",
      },
    };
  });
