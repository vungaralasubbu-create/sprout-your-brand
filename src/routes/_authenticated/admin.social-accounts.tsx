import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Facebook, Instagram, Linkedin, Plus, RefreshCw, Trash2, ExternalLink, Twitter, Send, Building2, User as UserIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  testPublishAccount,
  testPublishAllAccounts,
  listLinkedInOrgs,
  setLinkedInDefaultAuthor,
  testPublishLinkedInAuthor,
} from "@/lib/marketing-os/publisher.functions";


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

type TestResult = {
  status: string;
  platform_post_id: string | null;
  platform_url: string | null;
  error_code: string | null;
  error_message: string | null;
  published_at?: string | null;
};

function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const runTestOne = useServerFn(testPublishAccount);
  const runTestAll = useServerFn(testPublishAllAccounts);
  const runListLiOrgs = useServerFn(listLinkedInOrgs);
  const runSetLiAuthor = useServerFn(setLinkedInDefaultAuthor);
  const runTestLiAuthor = useServerFn(testPublishLinkedInAuthor);

  type LiOrg = { id: string; urn: string; name: string; vanityName: string | null; logoUrn: string | null; role: string; state: string };
  type LiPickerState = {
    loading: boolean;
    person: { urn: string; name: string } | null;
    orgs: LiOrg[];
    defaultUrn: string | null;
    reconnectRequired: boolean;
    error: string | null;
    open: boolean;
  };
  const [liPicker, setLiPicker] = useState<Record<string, LiPickerState>>({});

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

  // Silent auto-refresh: if any X/LinkedIn account's access token has expired
  // or is within 10 minutes of expiring, call its refresh endpoint in the
  // background. offline.access refresh tokens rotate on every refresh.
  useEffect(() => {
    if (loading || accounts.length === 0) return;
    const now = Date.now();
    const soon = 10 * 60 * 1000;
    const stale = accounts.filter((a) => {
      if (a.platform !== "x" && a.platform !== "linkedin") return false;
      if (!a.refresh_token_ciphertext) return false;
      if (!a.token_expires_at) return false;
      return new Date(a.token_expires_at).getTime() - now < soon;
    });
    if (stale.length === 0) return;
    void (async () => {
      for (const a of stale) {
        try {
          await supabase.functions.invoke(fnFor(a.platform, "refresh"), { body: { account_id: a.id } });
        } catch {
          // surfaced via the manual refresh button if it recurs
        }
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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

  const applyResult = (accountId: string, r: TestResult, platformLabel: string) => {
    setResults((prev) => ({ ...prev, [accountId]: r }));
    if (r.status === "posted" || r.status === "succeeded") {
      toast.success(`Published to ${platformLabel}${r.platform_post_id ? ` · ${r.platform_post_id}` : ""}`);
    } else {
      toast.error(`${platformLabel}: ${r.error_message ?? r.error_code ?? r.status}`);
    }
  };

  const testPublish = async (id: string, platform: string) => {
    const label = platform === "x" ? "X" : platform === "linkedin" ? "LinkedIn" : platform === "facebook" ? "Facebook" : "Instagram";
    const message = prompt(`Post text to publish on ${label}:`, `Testing Glintr AI Publishing 🚀`);
    if (!message) return;
    setBusy(id);
    try {
      const r = (await runTestOne({ data: { account_id: id, message } })) as TestResult;
      applyResult(id, r, label);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const testPublishAll = async () => {
    const message = prompt("Post text to publish on ALL connected accounts:", `Testing Glintr AI Publishing 🚀`);
    if (!message) return;
    setBusy("test-all");
    try {
      const res = (await runTestAll({ data: { message } })) as { total: number; results: Array<TestResult & { account_id: string; platform: string }> };
      const next: Record<string, TestResult> = {};
      let ok = 0;
      let failed = 0;
      for (const r of res.results ?? []) {
        next[r.account_id] = r;
        if (r.status === "posted" || r.status === "succeeded") ok++;
        else failed++;
      }
      setResults((prev) => ({ ...prev, ...next }));
      if (ok && !failed) toast.success(`Published to all ${ok} account(s)`);
      else if (ok && failed) toast.warning(`Published ${ok}, failed ${failed}`);
      else toast.error(`Failed on all ${failed} account(s)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };


  const openLiPicker = async (accountId: string) => {
    setLiPicker((prev) => ({
      ...prev,
      [accountId]: { ...(prev[accountId] ?? { orgs: [], person: null, defaultUrn: null, reconnectRequired: false, error: null, open: false }), loading: true, open: true, error: null },
    }));
    try {
      const res = await runListLiOrgs({ data: { account_id: accountId } });
      setLiPicker((prev) => ({
        ...prev,
        [accountId]: {
          loading: false,
          open: true,
          person: res.person ?? null,
          orgs: res.organizations ?? [],
          defaultUrn: res.default?.urn ?? res.person?.urn ?? null,
          reconnectRequired: !!res.reconnect_required,
          error: res.error ?? null,
        },
      }));
    } catch (e) {
      setLiPicker((prev) => ({
        ...prev,
        [accountId]: { ...(prev[accountId] ?? { orgs: [], person: null, defaultUrn: null, reconnectRequired: false, open: true, loading: false, error: null }), loading: false, open: true, error: (e as Error).message },
      }));
    }
  };

  const closeLiPicker = (accountId: string) => {
    setLiPicker((prev) => ({ ...prev, [accountId]: { ...(prev[accountId]!), open: false } }));
  };

  const chooseLiAuthor = async (
    accountId: string,
    author: { urn: string; kind: "person" | "organization"; name: string },
  ) => {
    setBusy(accountId);
    try {
      await runSetLiAuthor({ data: { account_id: accountId, author_urn: author.urn, author_kind: author.kind, author_name: author.name } });
      setLiPicker((prev) => ({ ...prev, [accountId]: { ...(prev[accountId]!), defaultUrn: author.urn } }));
      toast.success(`Default LinkedIn destination set to ${author.name}`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const testLiCompanyPage = async (accountId: string, org: LiOrg) => {
    const message = prompt(`Post text for "${org.name}":`, `Testing Glintr AI Publishing to LinkedIn Company Page 🚀`);
    if (!message) return;
    setBusy(accountId);
    try {
      const r = (await runTestLiAuthor({ data: { account_id: accountId, author_urn: org.urn, message } })) as TestResult;
      applyResult(accountId, r, `LinkedIn · ${org.name}`);
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
          <Button variant="outline" onClick={testPublishAll} disabled={busy === "test-all" || accounts.filter((x) => x.connection_status === "connected").length === 0}>
            <Send className="mr-2 h-4 w-4" />
            {busy === "test-all" ? "Publishing…" : "Test Publish (All)"}
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
                const lastSynced = a.last_synced_at ? new Date(a.last_synced_at) : null;
                const hasRefresh = !!a.refresh_token_ciphertext;
                const rotatingRefresh = hasRefresh && (a.platform === "x" || a.platform === "linkedin");
                const accessExpired = expires && expires.getTime() < Date.now();
                // Warn only when there's no refresh token AND access token is close to expiring.
                const warn = !hasRefresh && expires && expires.getTime() - Date.now() < 7 * 86400_000;
                const fmt = (d: Date | null) => (d ? d.toLocaleString() : "—");
                return (
                  <li key={a.id} className="py-3 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{a.account_name ?? a.account_external_id}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="capitalize">{a.platform}</span> · ID {a.account_external_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={a.connection_status === "connected" ? "success" : "muted"}>
                          {a.connection_status ?? "unknown"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => refresh(a.id, a.platform)} disabled={busy === a.id} title="Refresh token now">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {a.connection_status === "connected" && (
                          <Button variant="outline" size="sm" onClick={() => testPublish(a.id, a.platform)} disabled={busy === a.id || busy === "test-all"}>
                            <Send className="mr-1 h-3.5 w-3.5" />
                            Test Publish
                          </Button>
                        )}
                        {a.platform === "linkedin" && a.connection_status === "connected" && (
                          <Button variant="outline" size="sm" onClick={() => openLiPicker(a.id)} disabled={busy === a.id} title="Choose Personal profile or a Company Page">
                            <Building2 className="mr-1 h-3.5 w-3.5" />
                            Company Page
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => disconnect(a.id, a.platform)} disabled={busy === a.id} title="Disconnect">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {results[a.id] && (
                      <div className={`text-xs rounded-md border p-2 ml-8 ${results[a.id].status === "posted" || results[a.id].status === "succeeded" ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30" : "border-red-200 bg-red-50 dark:bg-red-950/30"}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium capitalize">{results[a.id].status}</span>
                          {results[a.id].platform_post_id && <span>· post_id: <code>{results[a.id].platform_post_id}</code></span>}
                          {results[a.id].platform_url && (
                            <a href={results[a.id].platform_url!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                              open <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {results[a.id].error_code && <span>· {results[a.id].error_code}</span>}
                        </div>
                        {results[a.id].error_message && <div className="mt-1 text-red-700 dark:text-red-300">{results[a.id].error_message}</div>}
                      </div>
                    )}
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs pl-8">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Last refreshed</dt>
                        <dd className="font-medium">{fmt(lastSynced)}</dd>
                      </div>

                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Access token expires</dt>
                        <dd className={`font-medium ${warn ? "text-amber-600" : accessExpired && rotatingRefresh ? "text-muted-foreground" : ""}`}>
                          {fmt(expires)}
                          {accessExpired && rotatingRefresh && <span className="ml-1 text-muted-foreground">(auto-refresh pending)</span>}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Refresh token expires</dt>
                        <dd className="font-medium">
                          {hasRefresh
                            ? rotatingRefresh
                              ? "Never (rotates on refresh)"
                              : "Provider-managed"
                            : "No refresh token"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Auto-refresh</dt>
                        <dd className="font-medium">{rotatingRefresh ? "Enabled" : "Manual only"}</dd>
                      </div>
                    </dl>
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
