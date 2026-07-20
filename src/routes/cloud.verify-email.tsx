import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudLogo } from "@/components/marketing-cloud/logo";
import { AuthPreview } from "@/components/marketing-cloud/auth-preview";
import { supabase } from "@/integrations/supabase/client";

type Search = { email?: string };

export const Route = createFileRoute("/cloud/verify-email")({
  head: () => ({ meta: [{ title: "Verify your email — AI Marketing Cloud" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // If the user opens the confirmation link, Supabase sets a session automatically.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email_confirmed_at) {
        setVerified(true);
        setTimeout(() => navigate({ to: "/cloud/onboarding" }), 1200);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user?.email_confirmed_at) {
        setVerified(true);
        setTimeout(() => navigate({ to: "/cloud/onboarding" }), 1200);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const resend = async () => {
    if (!email) return toast.error("No email on file — sign up again");
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success("Verification email sent");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1fr_1.1fr]">
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/cloud"><CloudLogo /></Link>
          <button onClick={() => navigate({ to: "/cloud/login" })} className="mt-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </button>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="mt-8">
            {verified ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-8 w-8" />
              </div>
            )}
          </motion.div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            {verified ? "You're verified!" : "Check your email"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {verified ? (
              "Setting up your workspace…"
            ) : (
              <>
                We sent a verification link to{" "}
                <strong className="text-foreground">{email ?? "your email"}</strong>. Click the link to activate your workspace.
              </>
            )}
          </p>

          {!verified && (
            <div className="mt-8 grid gap-2">
              <Button className="h-11 w-full" onClick={resend} disabled={resending}>
                {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend email
              </Button>
              <Button variant="outline" className="h-11 w-full" onClick={() => navigate({ to: "/cloud/signup" })}>
                Change email
              </Button>
            </div>
          )}

          <p className="mt-8 text-xs text-muted-foreground">
            Didn't get it? Check spam, or {" "}
            <Link to="/cloud/contact" className="underline">contact support</Link>.
          </p>
        </div>
      </div>
      <AuthPreview />
    </div>
  );
}
