// Client landing page at /auth/meta/callback.
// Meta redirects the user here with ?code=...&state=...
// We forward those to the `oauth-callback` Supabase edge function,
// which verifies state, exchanges tokens, and stores the accounts.
// The trailing underscore on `auth_` opts out of nesting under /auth.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth_/meta/callback")({
  component: MetaCallbackPage,
  head: () => ({
    meta: [
      { title: "Connecting Meta • Glintr" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Status = "processing" | "success" | "error";

function MetaCallbackPage() {
  const [status, setStatus] = useState<Status>("processing");
  const [message, setMessage] = useState<string>("Finalising your Meta connection...");
  const [connected, setConnected] = useState<Array<{ platform: string; account_name: string }>>([]);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const err = params.get("error");
      const errDesc = params.get("error_description");

      if (err) {
        setStatus("error");
        setMessage(errDesc || err);
        return;
      }
      if (!code || !state) {
        setStatus("error");
        setMessage("Missing authorization response from Meta.");
        return;
      }

      try {
        const { data: sess } = await supabase.auth.getSession();
        const bearer = sess.session?.access_token;
        const res = await supabase.functions.invoke("oauth-callback", {
          body: { code, state },
          headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
        });
        if (res.error) throw new Error(res.error.message);
        const data = res.data as { ok?: boolean; connected?: Array<{ platform: string; account_name: string }>; error?: string };
        if (!data?.ok) throw new Error(data?.error || "Unknown error");
        setConnected(data.connected ?? []);
        setStatus("success");
        setMessage(`Connected ${(data.connected ?? []).length} Meta account(s).`);
      } catch (e) {
        setStatus("error");
        setMessage((e as Error).message);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {status === "processing" && "Connecting Meta…"}
            {status === "success" && "Meta connected"}
            {status === "error" && "Connection failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {status === "success" && connected.length > 0 && (
            <ul className="text-sm space-y-1">
              {connected.map((c, i) => (
                <li key={i}>
                  <span className="font-medium capitalize">{c.platform}</span>: {c.account_name}
                </li>
              ))}
            </ul>
          )}
          <Button
            onClick={() => {
              window.location.href = "/admin/social-accounts";
            }}
          >
            Return to Social Accounts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
