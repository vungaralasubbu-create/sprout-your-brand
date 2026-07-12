import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { resolveRedirectForUser } from "@/lib/auth/role-redirect";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Glintr" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

async function routeAfterAuth(userId: string, navigate: ReturnType<typeof useNavigate>) {
  const { path, role } = await resolveRedirectForUser(userId);
  if (!role) {
    toast.message("Your account workspace is not configured yet.");
  }
  navigate({ to: path as any });
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) routeAfterAuth(data.session.user.id, navigate);
    });
  }, [navigate]);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    setLoading(true);
    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Signed in");
      if (data.user) await routeAfterAuth(data.user.id, navigate);
    } else {
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signUp({
        ...parsed.data,
        options: { emailRedirectTo: redirectTo },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account created. You can sign in now.");
      setMode("signin");
    }
  }

  async function handleForgot() {
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value?.trim();
    if (!email) return toast.error("Enter your email above, then click Forgot Password.");
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setResetting(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent.");
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="py-20">
          <Container className="max-w-md">
            <div className="card-elevated p-8">
              <h1 className="text-heading-xl font-display font-semibold">
                {mode === "signin" ? "Welcome Back To Glintr" : "Create your Glintr account"}
              </h1>
              <p className="text-caption mt-2">
                {mode === "signin"
                  ? "Access your workspace and continue where you left off."
                  : "Get started with Glintr in seconds."}
              </p>
              <form onSubmit={handle} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required className="mt-2 h-11" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required minLength={6} className="mt-2 h-11" />
                </div>
                <Button type="submit" size="lg" variant="gradient" className="w-full" disabled={loading}>
                  {loading ? "…" : mode === "signin" ? "Sign In" : "Create account"}
                </Button>
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
              <button
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="mt-4 text-caption text-primary hover:underline"
              >
                {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
              </button>
              <p className="mt-6 text-caption">
                <Link to="/" className="hover:text-foreground">← Back to home</Link>
              </p>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
