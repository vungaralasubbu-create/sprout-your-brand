import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudLogo } from "@/components/marketing-cloud/logo";
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
  const [pending, setPending] = useState<null | "email" | "google">(null);

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

  const handleEmail = () => {
    // Delegate to the shared /auth screen (OTP/email/password) with return-to Cloud.
    const url = `/auth?redirect=${encodeURIComponent("/cloud/dashboard")}${
      email ? `&email=${encodeURIComponent(email)}` : ""
    }${mode === "signup" ? "&mode=signup" : ""}`;
    window.location.assign(url);
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16 sm:px-6">
      <div className="w-full">
        <div className="flex justify-center">
          <CloudLogo />
        </div>
        <div className="mt-8 rounded-2xl border bg-card p-8 shadow-lg">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Sign in to your workspace" : "Create your workspace"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Welcome back — pick up where you left off."
              : "Free forever plan. No credit card required."}
          </p>

          {ENABLE_GOOGLE_AUTH && (
            <Button
              variant="outline"
              className="mt-6 w-full"
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

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEmail}
              disabled={pending !== null}
            >
              <Mail className="mr-2 h-4 w-4" />
              {mode === "login" ? "Continue with email" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "login" ? (
              <>
                New here?{" "}
                <Link to="/cloud/signup" className="text-primary hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/cloud/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link to="/cloud/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/cloud/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.5v2.9h3.9c2.3-2.1 3.5-5.2 3.5-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-2.9c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4C5.2 13.7 5 13 5 12.2s.2-1.5.4-2.2V7H1.4C.5 8.7 0 10.4 0 12.2s.5 3.5 1.4 5.2l4-2z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.3l4 3.1C6.3 6.7 8.9 4.7 12 4.7z"
      />
    </svg>
  );
}
