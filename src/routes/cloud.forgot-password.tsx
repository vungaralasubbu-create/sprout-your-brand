import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudLogo } from "@/components/marketing-cloud/logo";
import { AuthPreview } from "@/components/marketing-cloud/auth-preview";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cloud/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — AI Marketing Cloud" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    if (!email) return toast.error("Enter your email");
    setPending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/cloud/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not send reset email");
    } finally {
      setPending(false);
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
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent ? "Check your inbox for a secure reset link." : "Enter your email and we'll send you a reset link."}
          </p>

          {!sent ? (
            <div className="mt-8 space-y-4">
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" />
              </div>
              <Button className="h-11 w-full" onClick={submit} disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send reset link
              </Button>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border bg-card p-6">
              <div className="text-sm">We sent a reset link to <strong>{email}</strong>. The link expires in 60 minutes.</div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setSent(false)}>Change email</Button>
                <Button variant="ghost" onClick={submit} disabled={pending}>Resend</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <AuthPreview />
    </div>
  );
}
