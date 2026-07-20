import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudLogo } from "@/components/marketing-cloud/logo";
import { AuthPreview } from "@/components/marketing-cloud/auth-preview";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cloud/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — AI Marketing Cloud" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase places recovery info in the URL hash on redirect. Once processed,
    // getSession() returns the recovery session and we can call updateUser.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 8) return toast.error("Use at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/cloud/dashboard" }), 1500);
    } catch (e: any) {
      toast.error(e?.message ?? "Reset failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1fr_1.1fr]">
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/cloud"><CloudLogo /></Link>
          <h1 className="mt-10 text-3xl font-semibold tracking-tight sm:text-4xl">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a strong password you don't use anywhere else.</p>

          {done ? (
            <div className="mt-8 rounded-2xl border bg-card p-6">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <div className="mt-3 text-sm">Password updated. Redirecting to your workspace…</div>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {!ready && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  Open this page from the reset email link. Direct visits won't have a recovery session.
                </div>
              )}
              <div>
                <Label htmlFor="password">New password</Label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" autoComplete="new-password" placeholder="8+ characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-9" />
                </div>
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirm" type="password" autoComplete="new-password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 pl-9" />
                </div>
              </div>
              <Button className="h-11 w-full" onClick={submit} disabled={pending || !ready}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </div>
          )}
        </div>
      </div>
      <AuthPreview />
    </div>
  );
}
