import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudLogo } from "@/components/marketing-cloud/logo";
import { AuthPreview } from "@/components/marketing-cloud/auth-preview";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ENABLE_GOOGLE_AUTH } from "@/config/auth-features";

export const Route = createFileRoute("/cloud/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AI Marketing Cloud" },
      { name: "description", content: "Sign in to your AI Marketing Cloud workspace." },
    ],
  }),
  component: () => <AuthCard mode="login" />,
});

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState<null | "email" | "google" | "microsoft" | "github" | "magic">(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/cloud/dashboard" });
    });
  }, [navigate]);

  const handleGoogle = async () => {
    setPending("google");
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if ((res as any).error) throw (res as any).error;
      if ((res as any).redirected) return;
      navigate({ to: "/cloud/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Google sign-in failed");
      setPending(null);
    }
  };

  const handleUnsupported = (provider: string) => {
    toast.info(`${provider} sign-in is rolling out soon — use Google or email for now.`);
  };

  const handleEmail = async () => {
    if (!email) {
      toast.error("Enter your email to continue");
      return;
    }
    setPending("email");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: password || cryptoRandom(),
          options: { emailRedirectTo: `${window.location.origin}/cloud/verify-email` },
        });
        if (error) throw error;
        navigate({ to: "/cloud/verify-email", search: { email } as any });
        return;
      }
      if (!password) {
        // Fall back to OTP flow via existing /auth screen
        const url = `/auth?redirect=${encodeURIComponent("/cloud/dashboard")}&email=${encodeURIComponent(email)}`;
        window.location.assign(url);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/cloud/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign-in failed");
    } finally {
      setPending(null);
    }
  };

  const handleMagic = async () => {
    if (!email) return toast.error("Enter your email first");
    setPending("magic");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/cloud/dashboard` },
      });
      if (error) throw error;
      toast.success("Magic link sent — check your inbox");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not send magic link");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1fr_1.1fr]">
      {/* Left — form */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/cloud" className="inline-flex">
            <CloudLogo />
          </Link>

          <div className="mt-10">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {mode === "login" ? "Welcome back" : "Create your AI marketing workspace"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login"
                ? "Continue building your AI marketing campaigns."
                : "Start free. No credit card required."}
            </p>
          </div>

          {/* Social */}
          <div className="mt-8 grid gap-2">
            {ENABLE_GOOGLE_AUTH && (
              <Button
                variant="outline"
                className="h-11 w-full justify-center"
                onClick={handleGoogle}
                disabled={pending !== null}
              >
                {pending === "google" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleG className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11" onClick={() => handleUnsupported("Microsoft")}>
                <MicrosoftLogo className="mr-2 h-4 w-4" /> Microsoft
              </Button>
              <Button variant="outline" className="h-11" onClick={() => handleUnsupported("GitHub")}>
                <GitHubLogo className="mr-2 h-4 w-4" /> GitHub
              </Button>
            </div>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email/password */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <Link
                    to="/cloud/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "signup" ? "8+ characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                Keep me signed in on this device
              </label>
            )}

            <Button
              className="h-11 w-full"
              onClick={handleEmail}
              disabled={pending !== null}
            >
              {pending === "email" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {mode === "login" ? "Sign in" : "Create account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              className="h-11 w-full text-muted-foreground"
              onClick={handleMagic}
              disabled={pending !== null}
            >
              {pending === "magic" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Email me a magic link instead
            </Button>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <Link to="/cloud/signup" className="font-medium text-foreground hover:underline">
                  Create account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/cloud/login" className="font-medium text-foreground hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/cloud/terms" className="underline">Terms</Link> and{" "}
            <Link to="/cloud/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Right — preview */}
      <AuthPreview />
    </div>
  );
}

function cryptoRandom() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return "Aa1!" + Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.5v2.9h3.9c2.3-2.1 3.5-5.2 3.5-8.6z"/>
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-2.9c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"/>
      <path fill="#FBBC05" d="M5.4 14.4C5.2 13.7 5 13 5 12.2s.2-1.5.4-2.2V7H1.4C.5 8.7 0 10.4 0 12.2s.5 3.5 1.4 5.2l4-2z"/>
      <path fill="#EA4335" d="M12 4.7c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.3l4 3.1C6.3 6.7 8.9 4.7 12 4.7z"/>
    </svg>
  );
}
function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.01-.02-1.98-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.12 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.26 5.69.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12.02C23.5 5.66 18.35.5 12 .5Z"/>
    </svg>
  );
}
