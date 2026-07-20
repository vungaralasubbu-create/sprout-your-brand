/**
 * Public scheduler tick — invoked by pg_cron every minute.
 * Resumes waiting/retrying runs whose wait_until has elapsed and dispatches
 * event-triggered workflows from automation_events_queue.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/workflows/tick")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. Resume waiting/retrying runs
        const now = new Date().toISOString();
        const { data: due } = await supabaseAdmin
          .from("automation_workflow_runs")
          .select("id")
          .in("status", ["waiting", "retrying"])
          .lte("wait_until", now)
          .limit(25);

        const { stepRun, startWorkflowRun } = await import("@/lib/automation/workflow-engine.server");
        let resumed = 0;
        for (const row of due ?? []) {
          await supabaseAdmin.from("automation_workflow_runs")
            .update({ status: "running", wait_until: null })
            .eq("id", row.id);
          await stepRun(supabaseAdmin, row.id);
          resumed++;
        }

        // 2. Dispatch event-triggered workflows (queue uses processed_at=null as "queued")
        const { data: events } = await supabaseAdmin
          .from("automation_events_queue")
          .select("id, event_name, payload, source")
          .is("processed_at", null)
          .limit(50);

        let dispatched = 0;
        for (const ev of (events ?? []) as Array<{ id: string; event_name: string; payload: Record<string, unknown>; source: string | null }>) {
          const { data: matches } = await supabaseAdmin
            .from("automation_workflows")
            .select("id, owner_id")
            .eq("status", "active")
            .contains("trigger", { event: ev.event_name } as never);
          for (const wf of ((matches ?? []) as Array<{ id: string; owner_id: string | null }>)) {
            try {
              await startWorkflowRun(supabaseAdmin, wf.owner_id ?? "", wf.id, {
                triggerSource: "event",
                triggerPayload: ev.payload ?? {},
              });
              dispatched++;
            } catch { /* keep processing */ }
          }
          await supabaseAdmin.from("automation_events_queue")
            .update({ processed_at: new Date().toISOString(), jobs_created: dispatched } as never)
            .eq("id", ev.id);
        }

        return Response.json({ ok: true, resumed, dispatched });
      },
    },
  },
});
