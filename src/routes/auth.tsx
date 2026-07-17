import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { resolveRedirectForUser } from "@/lib/auth/role-redirect";
import { reconcileRolesForCurrentUser } from "@/lib/auth/reconcile.functions";
import { requestLoginOtp, verifyLoginOtp } from "@/lib/auth/otp.functions";
import { trackEvent } from "@/lib/analytics/client";

const TRUSTED_KEY = "glintr_trusted_emails_v1";
function isTrustedEmail(email: string): boolean {
  try {
    const raw = localStorage.getItem(TRUSTED_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) && list.includes(email.trim().toLowerCase());
  } catch {
    return false;
  }
}
function markEmailTrusted(email: string) {
  try {
    const raw = localStorage.getItem(TRUSTED_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const norm = email.trim().toLowerCase();
    if (!list.includes(norm)) list.push(norm);
    localStorage.setItem(TRUSTED_KEY, JSON.stringify(list));
  } catch {}
}

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Glintr" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

const credsSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  mobile: z.string().trim().regex(/^\d{10}$|^\+?\d{10,15}$/, "Enter a valid mobile number."),
});

type Mode = "signin" | "signup" | "recovery";
type Stage = "creds" | "otp";

async function routeAfterAuth(
  userId: string,
  navigate: ReturnType<typeof useNavigate>,
  reconcile: () => Promise<{ granted: string[] }>,
) {
  try {
    await reconcile();
  } catch (e) {
    console.warn("[auth] reconcile failed", e);
  }
  const { path, role } = await resolveRedirectForUser(userId);
  if (!role) toast.message("Your account workspace is not configured yet.");
  navigate({ to: path as any });
}

function AuthPage() {
  const navigate = useNavigate();
  const reconcile = useServerFn(reconcileRolesForCurrentUser);
  const sendOtp = useServerFn(requestLoginOtp);
  const verifyOtp = useServerFn(verifyLoginOtp);

  const [mode, setMode] = useState<Mode>("signin");
  const [stage, setStage] = useState<Stage>("creds");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [trustedEmail, setTrustedEmail] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; mobile?: string; code?: string }>({});
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const OTP_TTL_MS = 5 * 60 * 1000;
  const otpRemainingMs = otpSentAt ? Math.max(0, otpSentAt + OTP_TTL_MS - now) : 0;
  const otpExpired = otpSentAt !== null && otpRemainingMs === 0;
  const otpMMSS = (() => {
    const s = Math.ceil(otpRemainingMs / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  })();

  useEffect(() => {
    setTrustedEmail(isTrustedEmail(email));
    setErrors((p) => (p.email ? { ...p, email: undefined } : p));
  }, [email]);

  useEffect(() => {
    setErrors((p) => (p.password && password.length >= 6 ? { ...p, password: undefined } : p));
  }, [password]);

  useEffect(() => {
    setErrors((p) => (p.mobile ? { ...p, mobile: undefined } : p));
  }, [mobile]);

  useEffect(() => {
    setErrors((p) => (p.code ? { ...p, code: undefined } : p));
  }, [code]);

  useEffect(() => {
    if (stage !== "otp" || otpSentAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [stage, otpSentAt]);




  useEffect(() => {
    const isRecovery =
      typeof window !== "undefined" && window.location.hash.includes("type=recovery");
    if (isRecovery) setMode("recovery");

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });

    if (!isRecovery) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) routeAfterAuth(data.session.user.id, navigate, reconcile);
      });
    }
    return () => sub.subscription.unsubscribe();
  }, [navigate, reconcile]);

  async function completePasswordAuth() {
    if (mode === "signup") {
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo, data: { mobile } },
      });
      if (error) return toast.error(error.message);
      trackEvent("student_signup", { dedupe_key: email });
      // With auto-confirm on, signUp signs the user in immediately.
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session?.user) {
        toast.success("Account created");
        await routeAfterAuth(sess.session.user.id, navigate, reconcile);
      } else {
        // Fallback: try signing in with the just-created credentials.
        const { data, error: siErr } = await supabase.auth.signInWithPassword({ email, password });
        if (siErr) return toast.error(siErr.message);
        if (data.user) await routeAfterAuth(data.user.id, navigate, reconcile);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return toast.error(error.message);
      toast.success("Signed in");
      if (data.user) await routeAfterAuth(data.user.id, navigate, reconcile);
    }
  }

  async function handleCredsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (mode === "recovery") {
      if (password.length < 6) return toast.error("Password must be at least 6 characters.");
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Password updated.");
      const { data } = await supabase.auth.getUser();
      if (data.user) await routeAfterAuth(data.user.id, navigate, reconcile);
      return;
    }

    // Trusted device: skip OTP for returning sign-ins from this browser.
    if (mode === "signin" && isTrustedEmail(email)) {
      const emailOk = z.string().email().max(255).safeParse(email.trim()).success;
      if (!emailOk) return toast.error("Enter a valid email.");
      if (password.length < 6) return toast.error("Enter your password.");
      setLoading(true);
      await completePasswordAuth();
      setLoading(false);
      return;
    }

    const parsed = credsSchema.safeParse({ email, password, mobile });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");

    setLoading(true);
    const res = await sendOtp({
      data: { mobile, email, purpose: mode === "signup" ? "signup" : "login" },
    });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("OTP sent to your mobile.");
    setStage("otp");
  }


  async function handleOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!/^\d{6}$/.test(code)) return toast.error("Enter the 6-digit OTP.");
    setLoading(true);
    const v = await verifyOtp({ data: { mobile, code } });
    if (!v.ok) {
      setLoading(false);
      return toast.error(v.error);
    }
    if (email) markEmailTrusted(email);
    await completePasswordAuth();
    setLoading(false);
  }

  async function resendOtp() {
    if (loading) return;
    setLoading(true);
    const res = await sendOtp({
      data: { mobile, email, purpose: mode === "signup" ? "signup" : "login" },
    });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("New OTP sent.");
  }

  async function handleForgot() {
    if (!email) return toast.error("Enter your email above, then click Forgot Password.");
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setResetting(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent.");
  }

  async function handleGoogle() {
    if (loading) return;
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) {
        setLoading(false);
        return toast.error(result.error.message || "Google sign-in failed.");
      }
      if (result.redirected) return; // browser navigates away
      // Session set — route based on role.
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        if (data.user.email) markEmailTrusted(data.user.email);
        await routeAfterAuth(data.user.id, navigate, reconcile);
      }
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }



  const titleText =
    mode === "recovery"
      ? "Set a new password"
      : mode === "signin"
      ? stage === "otp"
        ? "Verify your mobile"
        : "Welcome Back To Glintr"
      : stage === "otp"
      ? "Verify your mobile"
      : "Create your Glintr account";

  const subtitleText =
    mode === "recovery"
      ? "Choose a new password for your Glintr account."
      : stage === "otp"
      ? `We sent a 6-digit code to ${mobile}. It's valid for 5 minutes.`
      : mode === "signin"
      ? "Access your workspace and continue where you left off."
      : "Get started with Glintr in seconds.";

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="py-20">
          <Container className="max-w-md">
            <div className="card-elevated p-8">
              <h1 className="text-heading-xl font-display font-semibold">{titleText}</h1>
              <p className="text-caption mt-2">{subtitleText}</p>

              {stage === "creds" ? (
                <form onSubmit={handleCredsSubmit} className="mt-6 space-y-4">
                  {mode !== "recovery" && (
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2 h-11"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="password">
                      {mode === "recovery" ? "New password" : "Password"}
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-2 h-11"
                    />
                  </div>
                  {mode !== "recovery" && !(mode === "signin" && trustedEmail) && (
                    <div>
                      <Label htmlFor="mobile">Mobile number</Label>
                      <Input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit mobile"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="mt-2 h-11"
                      />
                      <p className="text-caption mt-1 text-muted-foreground">
                        We'll text you a one-time code to verify.
                      </p>
                    </div>
                  )}


                  <Button
                    type="submit"
                    size="lg"
                    variant="gradient"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading
                      ? "…"
                      : mode === "recovery"
                      ? "Update password"
                      : mode === "signin"
                      ? trustedEmail
                        ? "Sign in"
                        : "Send OTP & Sign In"
                      : "Send OTP & Create account"}
                  </Button>
                  {mode !== "recovery" && (
                    <>
                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-caption">
                          <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={handleGoogle}
                        disabled={loading}
                      >
                        <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" aria-hidden="true">
                          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1-3.32 0-6.03-2.74-6.03-6.12S8.68 5.96 12 5.96c1.9 0 3.16.8 3.88 1.5l2.64-2.55C16.86 3.4 14.66 2.4 12 2.4 6.87 2.4 2.7 6.57 2.7 11.7S6.87 21 12 21c6.93 0 9.3-4.87 9.3-7.4 0-.5-.05-.86-.12-1.4H12z"/>
                        </svg>
                        Continue with Google
                      </Button>
                    </>
                  )}
                  {mode === "signin" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={handleForgot}
                      disabled={resetting}
                    >
                      {resetting ? "Sending…" : "Forgot Password"}
                    </Button>
                  )}
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="code">6-digit OTP</Label>
                    <Input
                      id="code"
                      name="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="mt-2 h-11 tracking-[0.5em] text-center text-lg"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    variant="gradient"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Verifying…" : mode === "signup" ? "Verify & Create account" : "Verify & Sign In"}
                  </Button>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="text-caption text-primary hover:underline"
                      onClick={resendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                    <button
                      type="button"
                      className="text-caption text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setStage("creds");
                        setCode("");
                      }}
                    >
                      ← Change details
                    </button>
                  </div>
                </form>
              )}

              {stage === "creds" && mode !== "recovery" && (
                <button
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="mt-4 text-caption text-primary hover:underline"
                >
                  {mode === "signin"
                    ? "New here? Create an account"
                    : "Already have an account? Sign in"}
                </button>
              )}
              <p className="mt-6 text-caption">
                <Link to="/" className="hover:text-foreground">
                  ← Back to home
                </Link>
              </p>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
