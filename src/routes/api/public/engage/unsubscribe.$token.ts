/**
 * One-click unsubscribe by signed token. Applies to a single (category,
 * channel) combination stored on engage_subscriptions.
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/engage/unsubscribe/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("engage_subscriptions")
          .update({ is_subscribed: false })
          .eq("unsubscribe_token", params.token)
          .select("category")
          .maybeSingle();
        if (error || !data) {
          return new Response(page("Unable to unsubscribe", "That link is invalid or has expired. Please sign in and manage your preferences instead."), {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
        return new Response(
          page("Unsubscribed", `You've been unsubscribed from “${data.category}” emails. You can re-subscribe anytime from your preferences.`),
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      },
      POST: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("engage_subscriptions")
          .update({ is_subscribed: false })
          .eq("unsubscribe_token", params.token);
        return Response.json({ ok: !error });
      },
    },
  },
});

function page(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Glintr</title></head>
<body style="margin:0;background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
  <div style="max-width:520px;background:#111827;padding:40px;border-radius:20px;border:1px solid #1f2937">
    <div style="font-size:12px;letter-spacing:0.2em;color:#22d3ee;text-transform:uppercase;margin-bottom:16px">Glintr Preferences</div>
    <h1 style="font-size:28px;margin:0 0 12px 0;color:#f8fafc">${title}</h1>
    <p style="color:#cbd5e1;line-height:1.7;margin:0 0 24px 0">${body}</p>
    <a href="https://glintr.com" style="display:inline-block;padding:12px 22px;background:#22d3ee;color:#0f172a;font-weight:600;text-decoration:none;border-radius:10px">Back to Glintr</a>
  </div>
</body></html>`;
}
