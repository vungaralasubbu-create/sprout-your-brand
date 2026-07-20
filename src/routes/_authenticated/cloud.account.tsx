import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/cloud/account")({
  component: Account,
});

function Account() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  const signOut = async () => {
    try {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      navigate({ to: "/cloud" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign out failed");
    }
  };
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-24 sm:px-6 lg:px-10">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Account</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your account</h1>

      <div className="mt-8 rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-medium">{email || "—"}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-6">
        <div className="text-sm font-medium">Security</div>
        <p className="mt-1 text-sm text-muted-foreground">
          You sign in via one-time passcode or Google. Manage sign-in methods from Settings.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <div className="text-sm font-medium text-red-600 dark:text-red-400">Sign out</div>
        <p className="mt-1 text-sm text-muted-foreground">
          End your session on this device.
        </p>
        <Button onClick={signOut} variant="outline" className="mt-4">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
