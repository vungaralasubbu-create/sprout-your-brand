// PearlSMS transactional SMS helper (server-only).
//
// Config (env):
//   PEARLSMS_API_KEY       (required) - saved via Lovable secrets
//   PEARLSMS_BASE_URL      (required) - http://sms.pearlsms.com/public/sms/send
//   PEARLSMS_SENDER        (required at runtime) - DLT-approved 6-char sender ID
//   PEARLSMS_ADMIN_NUMBERS (optional) - comma-separated list, e.g. "919812345678,919900000000"
//
// Numbers must be 10-digit (India) or with country code, digits only.

export type SmsResult =
  | { ok: true; provider_response: string }
  | { ok: false; error: string };

function normalizeNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // PearlSMS accepts 10 digit or 12 digit (91XXXXXXXXXX). Strip leading 0.
  return digits.replace(/^0+/, "");
}

export async function sendSms(opts: {
  to: string | string[];
  message: string;
  type?: "TRANS" | "PROMO" | "OTP";
}): Promise<SmsResult> {
  const apikey = process.env.PEARLSMS_API_KEY;
  const base = process.env.PEARLSMS_BASE_URL || "http://sms.pearlsms.com/public/sms/send";
  const sender = process.env.PEARLSMS_SENDER;

  if (!apikey) return { ok: false, error: "PEARLSMS_API_KEY not configured" };
  if (!sender) return { ok: false, error: "PEARLSMS_SENDER not configured" };

  const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to])
    .map(normalizeNumber)
    .filter((n): n is string => !!n);
  if (recipients.length === 0) return { ok: false, error: "No valid recipient numbers" };

  const url = new URL(base);
  url.searchParams.set("sender", sender);
  url.searchParams.set("smstype", opts.type ?? "TRANS");
  url.searchParams.set("numbers", recipients.join(","));
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("message", opts.message);

  try {
    const res = await fetch(url.toString(), { method: "GET" });
    const body = await res.text();
    if (!res.ok) {
      console.error("[pearlsms] failed", res.status, body);
      return { ok: false, error: `PearlSMS ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true, provider_response: body.slice(0, 500) };
  } catch (err: any) {
    console.error("[pearlsms] error", err?.message);
    return { ok: false, error: err?.message ?? "SMS request failed" };
  }
}

export function adminNumbers(): string[] {
  const raw = process.env.PEARLSMS_ADMIN_NUMBERS;
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
