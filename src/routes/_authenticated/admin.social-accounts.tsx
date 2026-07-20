import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Facebook, Instagram, Linkedin, Plus, RefreshCw, Trash2, ExternalLink, Twitter } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/social-accounts")({
  component: SocialAccountsPage,
  head: () => ({
    meta: [
      { title: "Social Accounts · Admin · Glintr" },
      { name: "description", content: "Connect and manage Meta (Facebook & Instagram) and LinkedIn publishing accounts." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Account = {
  id: string;
  platform: string;
  account_name: string | null;
  account_external_id: string | null;
  connection_status: string | null;
  token_expires_at: string | null;
  refresh_token_ciphertext: string | null;
  last_synced_at: string | null;
  metadata: Record<string, unknown> | null;
};

function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sess } = await supabase.auth.getUser();
    const uid = sess.user?.id;
    if (!uid) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("soc_accounts")
      .select("id, platform, account_name, account_external_id, connection_status, token_expires_at, last_synced_at, metadata, refresh_token_ciphertext")
      .eq("owner_id", uid)
      .in("platform", ["facebook", "instagram", "linkedin", "x"])
      .order("platform", { ascending: true });
    if (error) toast.error(error.message);
    setAccounts((data ?? []) as Account[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startOAuth = async (provider: "meta" | "linkedin" | "x") => {
    const key = `connect-${provider}`;
    setBusy(key);
    try {
      const fnName = provider === "meta" ? "connect-meta" : provider === "linkedin" ? "connect-linkedin" : "connect-x";
      const { data, error } = await supabase.functions.invoke(fnName, { body: {} });
      if (error) throw new Error(error.message);
      const url = (data as { authorize_url?: string })?.authorize_url;
      if (!url) throw new Error("No authorize URL returned");
      // Break out of preview iframe — providers set X-Frame-Options: DENY.
      if (window.top && window.top !== window.self) {
        window.top.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  const fnFor = (platform: string, action: "disconnect" | "refresh") => {
    if (platform === "linkedin") {
      return action === "disconnect" ? "disconnect-linkedin" : "refresh-linkedin-token";
    }
    if (platform === "x") {
      return action === "disconnect" ? "disconnect-x" : "refresh-x-token";
    }
    return action === "disconnect" ? "disconnect-meta" : "refresh-meta-token";
  };

  const disconnect = async (id: string, platform: string) => {
    if (!confirm("Disconnect this account? Its access token will be revoked.")) return;
    setBusy(id);
    try {
      const { data, error } = await supabase.functions.invoke(fnFor(platform, "disconnect"), { body: { account_id: id } });
      if (error) throw new Error(error.message);
      const err = (data as { error?: string })?.error;
      if (err) throw new Error(err);
      toast.success("Disconnected");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const refresh = async (id: string, platform: string) => {
    setBusy(id);
    try {
      const { data, error } = await supabase.functions.invoke(fnFor(platform, "refresh"), { body: { account_id: id } });
      if (error) throw new Error(error.message);
      const err = (data as { error?: string })?.error;
      if (err) throw new Error(err);
      toast.success("Token refreshed");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const testPublish = async (id: string, platform: string) => {
    if (platform !== "linkedin" && platform !== "x") {
      toast.info("Test publish is available for LinkedIn and X.");
      return;
    }
    const label = platform === "x" ? "X" : "LinkedIn";
    const message = prompt(`Post text to publish on ${label}:`, `Hello from Glintr 🚀`);
    if (!message) return;
    const fn = platform === "x" ? "publish-x" : "publish-linkedin";
    setBusy(id);
    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { account_id: id, message },
      });
      if (error) throw new Error(error.message);
      const err = (data as { error?: string })?.error;
      if (err) throw new Error(err);
      toast.success(`Published to ${label}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Social Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect Meta (Facebook & Instagram), LinkedIn, and X for publishing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => startOAuth("meta")} disabled={busy === "connect-meta"}>
            <Plus className="mr-2 h-4 w-4" />
            {busy === "connect-meta" ? "Redirecting…" : "Connect Meta"}
          </Button>
          <Button variant="secondary" onClick={() => startOAuth("linkedin")} disabled={busy === "connect-linkedin"}>
            <Linkedin className="mr-2 h-4 w-4" />
            {busy === "connect-linkedin" ? "Redirecting…" : "Connect LinkedIn"}
          </Button>
          <Button variant="secondary" onClick={() => startOAuth("x")} disabled={busy === "connect-x"}>
            <Twitter className="mr-2 h-4 w-4" />
            {busy === "connect-x" ? "Redirecting…" : "Connect X"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : accounts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No Meta accounts connected yet. Click <strong>Connect Meta</strong> to link a Facebook Page or Instagram Business account.
            </div>
          ) : (
            <ul className="divide-y">
              {accounts.map((a) => {
                const Icon = a.platform === "facebook" ? Facebook : a.platform === "linkedin" ? Linkedin : a.platform === "x" ? Twitter : Instagram;
                const expires = a.token_expires_at ? new Date(a.token_expires_at) : null;
                const hasRefresh = !!a.refresh_token_ciphertext;
                // X & LinkedIn use OAuth2 with rotating refresh tokens: the access token expires
                // in ~2h but the connection stays alive via auto-refresh. Only warn when no
                // refresh token is stored (e.g. Meta long-lived tokens nearing expiry).
                const expiresSoon = !hasRefresh && expires && expires.getTime() - Date.now() < 7 * 86400_000;
                const expiryLabel = hasRefresh
                  ? "Auto-renews"
                  : expires
                    ? `Token expires ${expires.toLocaleDateString()}`
                    : null;
                const expiryTitle = expires
                  ? `Access token expires ${expires.toLocaleString()}${hasRefresh ? " · refreshed automatically" : ""}`
                  : undefined;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{a.account_name ?? a.account_external_id}</div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                          <span className="capitalize">{a.platform}</span>
                          <span>·</span>
                          <span>ID {a.account_external_id}</span>
                          {expiryLabel && (
                            <>
                              <span>·</span>
                              <span className={expiresSoon ? "text-amber-600" : ""} title={expiryTitle}>
                                {expiryLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={a.connection_status === "connected" ? "success" : "muted"}>
                        {a.connection_status ?? "unknown"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => refresh(a.id, a.platform)} disabled={busy === a.id} title="Refresh token">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {(a.platform === "linkedin" || a.platform === "x") && (
                        <Button variant="outline" size="sm" onClick={() => testPublish(a.id, a.platform)} disabled={busy === a.id}>
                          Test Publish
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => disconnect(a.id, a.platform)} disabled={busy === a.id} title="Disconnect">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup checklist</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            OAuth redirect URI configured in Meta App:{" "}
            <code className="text-foreground">https://glintr.com/auth/meta/callback</code>
          </p>
          <p>Required permissions: pages_show_list, pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish, business_management.</p>
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Open Meta for Developers <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
