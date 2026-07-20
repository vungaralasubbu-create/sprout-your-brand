/**
 * Public webhook trigger — POST /api/public/workflows/webhook/$slug
 * External systems (Zapier, forms, CRM) call this URL with a shared secret
 * to start a workflow run.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/workflows/webhook/$slug")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const providedSecret = request.headers.get("x-webhook-secret") ?? url.searchParams.get("secret") ?? "";
        const { data: hook } = await supabaseAdmin
          .from("automation_webhooks")
          .select("id, workflow_id, owner_id, secret, is_enabled")
          .eq("slug", params.slug)
          .maybeSingle();
        if (!hook || !hook.is_enabled || hook.secret !== providedSecret) {
          return new Response("Unauthorized", { status: 401 });
        }
        let payload: Record<string, unknown> = {};
        try { payload = (await request.json()) as Record<string, unknown>; } catch { /* empty */ }

        const { startWorkflowRun } = await import("@/lib/automation/workflow-engine.server");
        const runId = await startWorkflowRun(supabaseAdmin, hook.owner_id ?? "", hook.workflow_id, {
          triggerSource: "webhook",
          triggerPayload: payload,
        });
        const { data: cur } = await supabaseAdmin.from("automation_webhooks").select("trigger_count").eq("id", hook.id).maybeSingle();
        await supabaseAdmin.from("automation_webhooks").update({
          last_triggered_at: new Date().toISOString(),
          trigger_count: Number(cur?.trigger_count ?? 0) + 1,
        }).eq("id", hook.id);
        return Response.json({ ok: true, runId });
      },
    },
  },
});
