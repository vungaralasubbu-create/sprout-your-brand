/**
 * Sequence tick worker — advances active sequence enrollments and dispatches
 * emails whose delay has elapsed. Called by pg_cron every minute via a
 * public /api/public/* endpoint (auth bypassed on this prefix; we verify the
 * caller by requiring the Supabase anon key in the `apikey` header).
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/engage/hooks/sequence-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
        if (!expected || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1) Enroll pending events into matching sequences.
        const { data: events } = await supabaseAdmin
          .from("engage_events")
          .select("id, event, user_id, brand_id, payload")
          .is("processed_at", null)
          .order("created_at", { ascending: true })
          .limit(200);

        let enrolled = 0;
        for (const ev of events ?? []) {
          const { data: sequences } = await supabaseAdmin
            .from("engage_sequences")
            .select("id, steps")
            .eq("trigger_event", ev.event)
            .eq("is_active", true);
          for (const seq of sequences ?? []) {
            const firstStep = (seq.steps as unknown as Array<{ delay_hours?: number }> | null)?.[0];
            const delayHours = firstStep?.delay_hours ?? 0;
            const nextRun = new Date(Date.now() + delayHours * 3600 * 1000).toISOString();
            await supabaseAdmin
              .from("engage_sequence_enrollments")
              .upsert(
                {
                  sequence_id: seq.id,
                  user_id: ev.user_id,
                  current_step: 0,
                  status: "active",
                  next_run_at: nextRun,
                  context: ev.payload as never,
                },
                { onConflict: "sequence_id,user_id" as never, ignoreDuplicates: true },
              );
            enrolled++;
          }
          await supabaseAdmin
            .from("engage_events")
            .update({ processed_at: new Date().toISOString() })
            .eq("id", ev.id);
        }

        // 2) Fire due steps.
        const { data: due } = await supabaseAdmin
          .from("engage_sequence_enrollments")
          .select("id, sequence_id, user_id, current_step, context, engage_sequences(steps, brand_id)")
          .eq("status", "active")
          .lte("next_run_at", new Date().toISOString())
          .limit(200);

        let fired = 0;
        const { sendViaEngage } = await import("../../../../../lib/engage/send.server");
        for (const enrollment of due ?? []) {
          const seq = (enrollment as { engage_sequences?: { steps?: unknown; brand_id?: string | null } }).engage_sequences;
          const steps = (seq?.steps as Array<{ delay_hours: number; template_key: string; channel: "email" | "push" | "inapp" }> | undefined) ?? [];
          const step = steps[(enrollment as { current_step: number }).current_step];
          if (!step) {
            await supabaseAdmin
              .from("engage_sequence_enrollments")
              .update({ status: "completed", completed_at: new Date().toISOString() })
              .eq("id", (enrollment as { id: string }).id);
            continue;
          }

          // Fetch recipient email.
          let email: string | null = null;
          const userId = (enrollment as { user_id: string | null }).user_id;
          if (userId) {
            const { data: prof } = await supabaseAdmin
              .from("student_profiles")
              .select("email, full_name")
              .eq("user_id", userId)
              .maybeSingle();
            email = (prof as { email?: string | null } | null)?.email ?? null;
          }
          if (!email) {
            await supabaseAdmin
              .from("engage_sequence_enrollments")
              .update({ status: "failed", last_error: "no_email" })
              .eq("id", (enrollment as { id: string }).id);
            continue;
          }

          await sendViaEngage({
            templateKey: step.template_key,
            recipient: email,
            userId,
            brandId: seq?.brand_id ?? null,
            channel: step.channel ?? "email",
            sequenceEnrollmentId: (enrollment as { id: string }).id,
            idempotencyKey: `seq:${(enrollment as { id: string }).id}:${(enrollment as { current_step: number }).current_step}`,
            category: "nurture",
            context: {
              recipient: email,
              first_name: "there",
              brand_name: "Glintr",
              app_url: process.env.APP_URL ?? "https://glintr.com",
              ...((enrollment as { context?: Record<string, unknown> }).context ?? {}),
            },
          });

          const nextIndex = (enrollment as { current_step: number }).current_step + 1;
          const nextStep = steps[nextIndex];
          if (nextStep) {
            const nextRun = new Date(Date.now() + (nextStep.delay_hours ?? 0) * 3600 * 1000).toISOString();
            await supabaseAdmin
              .from("engage_sequence_enrollments")
              .update({ current_step: nextIndex, next_run_at: nextRun })
              .eq("id", (enrollment as { id: string }).id);
          } else {
            await supabaseAdmin
              .from("engage_sequence_enrollments")
              .update({ status: "completed", completed_at: new Date().toISOString(), current_step: nextIndex })
              .eq("id", (enrollment as { id: string }).id);
          }
          fired++;
        }

        return Response.json({ ok: true, enrolled, fired });
      },
    },
  },
});
