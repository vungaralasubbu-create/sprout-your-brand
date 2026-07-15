import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Bell, ShieldCheck, Eye, Activity, Loader2, Save, LogOut, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getAmbassadorSettings,
  updateNotificationPreferences,
  updatePrivacyPreferences,
  listProfileActivity,
} from "@/lib/campus-ambassador/profile.functions";
import {
  getNotificationCategoriesAndPrefs,
  updateNotificationCategoryPreference,
} from "@/lib/campus-ambassador/notifications.functions";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ambassador/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AmbassadorShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Account Settings</h1>
          <p className="text-sm text-slate-600 mt-1">Manage notifications, privacy and security preferences.</p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="bg-white border p-1">
            <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1.5" />Notifications</TabsTrigger>
            <TabsTrigger value="privacy"><Eye className="h-3.5 w-3.5 mr-1.5" />Privacy</TabsTrigger>
            <TabsTrigger value="security"><ShieldCheck className="h-3.5 w-3.5 mr-1.5" />Security</TabsTrigger>
            <TabsTrigger value="activity"><Activity className="h-3.5 w-3.5 mr-1.5" />Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications"><NotificationsPanel /></TabsContent>
          <TabsContent value="privacy"><PrivacyPanel /></TabsContent>
          <TabsContent value="security"><SecurityPanel /></TabsContent>
          <TabsContent value="activity"><ActivityPanel /></TabsContent>
        </Tabs>
      </div>
    </AmbassadorShell>
  );
}

function NotificationsPanel() {
  const getCats = useServerFn(getNotificationCategoriesAndPrefs);
  const saveCat = useServerFn(updateNotificationCategoryPreference);
  const getSettings = useServerFn(getAmbassadorSettings);
  const saveChannels = useServerFn(updateNotificationPreferences);
  const qc = useQueryClient();

  const cats = useQuery({
    queryKey: ["amb-notif-cats"],
    queryFn: () => getCats({ data: undefined as never }),
  });
  const settings = useQuery({
    queryKey: ["amb-settings"],
    queryFn: () => getSettings({ data: undefined as never }),
  });
  const [channels, setChannels] = useState<{ channel_in_app: boolean; channel_email: boolean } | null>(null);

  useEffect(() => {
    if (settings.data?.gate === "ok") {
      const p: any = settings.data.notificationPrefs ?? {};
      setChannels({
        channel_in_app: p.channel_in_app ?? true,
        channel_email: p.channel_email ?? true,
      });
    }
  }, [settings.data]);

  const toggleCat = useMutation({
    mutationFn: (v: { category_key: string; enabled: boolean }) => saveCat({ data: v }),
    onSuccess: (r: any) => {
      if (r?.gate === "ok") qc.invalidateQueries({ queryKey: ["amb-notif-cats"] });
      else if (r?.gate === "mandatory") toast.error("This category is mandatory and can't be turned off");
      else toast.error("Failed to save preference");
    },
    onError: () => toast.error("Failed to save preference"),
  });

  const saveCh = useMutation({
    mutationFn: (d: any) => saveChannels({ data: d }),
    onSuccess: (r: any) => {
      if (r?.gate === "ok") { toast.success("Preferences saved"); qc.invalidateQueries({ queryKey: ["amb-settings"] }); }
      else toast.error(r?.message || "Failed");
    },
  });

  if (cats.isLoading || settings.isLoading || !channels) return <Skeleton className="h-80 w-full" />;
  if (cats.data?.gate !== "ok") {
    return <Card className="p-6 text-sm text-slate-600">Complete your ambassador profile to manage notification preferences.</Card>;
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Delivery Channels</h3>
        <p className="text-xs text-slate-500 mb-4">Choose how you receive updates. Turning off in-app suppresses all optional in-app notifications.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleRow
            label="In-App Notifications"
            checked={channels.channel_in_app}
            onChange={(v: boolean) => setChannels({ ...channels, channel_in_app: v })}
          />
          <ToggleRow
            label="Email Notifications"
            checked={channels.channel_email}
            onChange={(v: boolean) => setChannels({ ...channels, channel_email: v })}
          />
        </div>
        <Button size="sm" className="mt-3" onClick={() => saveCh.mutate(channels)} disabled={saveCh.isPending}>
          {saveCh.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Channels
        </Button>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Category Controls</h3>
        <p className="text-xs text-slate-500 mb-4">
          Toggle optional categories. Account security and critical payment notifications are always sent.
        </p>
        <div className="space-y-2">
          {cats.data.items.map((c: any) => (
            <ToggleRow
              key={c.category_key}
              label={c.label}
              description={c.description}
              checked={c.enabled}
              mandatory={c.mandatory}
              onChange={(v: boolean) =>
                toggleCat.mutate({ category_key: c.category_key, enabled: v })
              }
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ToggleRow({ label, description, checked, onChange, mandatory }: any) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-white">
      <div className="min-w-0">
        <div className="text-sm font-medium flex items-center gap-2">
          {label}
          {mandatory && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-500 border rounded px-1.5 py-0.5">
              <Lock className="h-3 w-3" /> Required
            </span>
          )}
        </div>
        {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
      </div>
      <Switch checked={!!checked} disabled={!!mandatory} onCheckedChange={onChange} />
    </div>
  );
}

function PrivacyPanel() {
  const get = useServerFn(getAmbassadorSettings);
  const save = useServerFn(updatePrivacyPreferences);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["amb-settings"],
    queryFn: () => get({ data: undefined as never }),
  });
  const [f, setF] = useState<any>(null);

  useEffect(() => {
    if (data?.gate === "ok") {
      const p = data.profile as any;
      setF({
        leaderboard_show_first_name: p.leaderboard_show_first_name ?? true,
        leaderboard_show_college: p.leaderboard_show_college ?? true,
        leaderboard_show_photo: p.leaderboard_show_photo ?? true,
        leaderboard_display_name: p.leaderboard_display_name || "",
      });
    }
  }, [data]);

  const m = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: (r: any) => {
      if (r.gate === "ok") { toast.success("Privacy updated"); qc.invalidateQueries({ queryKey: ["amb-settings"] }); qc.invalidateQueries({ queryKey: ["ambassador-profile"] }); }
      else toast.error(r.message || "Failed");
    },
  });

  if (isLoading || !f) return <Skeleton className="h-60 w-full" />;

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h3 className="font-semibold mb-1">Leaderboard visibility</h3>
        <p className="text-xs text-slate-500 mb-4">Choose what's shown when you appear on public leaderboards.</p>
        <div className="space-y-2">
          <ToggleRow label="Show first name" description="Otherwise your ambassador code is shown" checked={f.leaderboard_show_first_name} onChange={(v: boolean) => setF({ ...f, leaderboard_show_first_name: v })} />
          <ToggleRow label="Show college" checked={f.leaderboard_show_college} onChange={(v: boolean) => setF({ ...f, leaderboard_show_college: v })} />
          <ToggleRow label="Show profile photo" checked={f.leaderboard_show_photo} onChange={(v: boolean) => setF({ ...f, leaderboard_show_photo: v })} />
        </div>
      </div>
      <div>
        <Label>Public display name (optional)</Label>
        <Input value={f.leaderboard_display_name} onChange={(e) => setF({ ...f, leaderboard_display_name: e.target.value })} placeholder="e.g. Priya S." maxLength={60} />
        <p className="text-xs text-slate-500 mt-1">Overrides your first name on leaderboards. Leave blank to use default.</p>
      </div>
      <Button onClick={() => m.mutate(f)} disabled={m.isPending}>
        {m.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save privacy settings
      </Button>
    </Card>
  );
}

function SecurityPanel() {
  const [signingOut, setSigningOut] = useState(false);

  async function signOutEverywhere() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast.success("Signed out on all devices");
      setTimeout(() => (window.location.href = "/auth"), 800);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-1 flex items-center gap-2"><KeyRound className="h-4 w-4" /> Sign-in method</h3>
        <p className="text-xs text-slate-500 mb-4">You sign in with mobile OTP. Password changes are managed by Glintr.</p>
        <div className="rounded-lg border bg-slate-50 p-4 text-sm">
          Mobile OTP verification is enabled on this account.
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-1 flex items-center gap-2"><LogOut className="h-4 w-4" /> Active sessions</h3>
        <p className="text-xs text-slate-500 mb-4">
          Sign out of every device where your account is signed in. You'll need to sign in again with OTP.
        </p>
        <Button variant="danger" onClick={signOutEverywhere} disabled={signingOut}>
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
          Sign out of all devices
        </Button>
      </Card>
    </div>
  );
}

function ActivityPanel() {
  const get = useServerFn(listProfileActivity);
  const { data, isLoading } = useQuery({
    queryKey: ["amb-profile-activity"],
    queryFn: () => get({ data: { limit: 30 } }),
  });

  if (isLoading || !data || data.gate !== "ok") return <Skeleton className="h-60 w-full" />;

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> Recent account activity</h3>
      {data.activity.length === 0 ? (
        <div className="text-sm text-slate-500 py-8 text-center">No recent activity.</div>
      ) : (
        <ol className="space-y-3">
          {data.activity.map((a: any) => (
            <li key={a.id} className="flex gap-3 text-sm border-l-2 border-slate-200 pl-3 py-1">
              <div className="flex-1">
                <div className="text-slate-900">{a.description || a.event_type.replace(/_/g, " ")}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {new Date(a.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
