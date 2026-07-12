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

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Glintr" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Signed in");
      navigate({ to: "/admin" });
    } else {
      const redirectTo = `${window.location.origin}/admin`;
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

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="py-20">
          <Container className="max-w-md">
            <div className="card-elevated p-8">
              <h1 className="text-heading-xl font-display font-semibold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
              <p className="text-caption mt-2">Admin & team access to Glintr.</p>
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
                  {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
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
