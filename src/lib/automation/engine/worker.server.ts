/**
 * Worker: claim ready jobs → run handler with timeout → emit follow-ups + notifications.
 */
import { claim, complete, failOrRetry, enqueue } from "./queue.server";
import { getHandler } from "./handlers.server";
import { emitNotifications } from "./notifications.server";
import type { HandlerContext } from "./types";

export async function runOnce(workerId: string, batchSize = 10): Promise<{ processed: number; ok: number; failed: number }> {
  const jobs = await claim(workerId, batchSize);
  let good = 0, bad = 0;
  await Promise.all(
    jobs.map(async (job) => {
      const handler = getHandler(job.handler);
      const ctx: HandlerContext = {
        jobId: job.id,
        handler: job.handler,
        ownerId: job.owner_id,
        payload: (job.payload as any) ?? {},
        attempts: job.attempts,
        correlationId: job.correlation_id,
        log: (msg, data) => console.log(`[automation ${job.handler}]`, msg, data ?? ""),
      };
      if (!handler) {
        await failOrRetry(job, new Error(`No handler registered for ${job.handler}`));
        bad++;
        return;
      }
      try {
        const timeoutMs = Math.max(5_000, (job.timeout_seconds ?? 60) * 1000);
        const result = await Promise.race([
          handler(ctx),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`handler timeout after ${timeoutMs}ms`)), timeoutMs)),
        ]);
        await complete(job.id, result.data ?? {});
        if (result.notifications?.length) await emitNotifications(job.id, result.notifications);
        if (result.followUps?.length) {
          for (const f of result.followUps) {
            try { await enqueue({ ...f, parentJobId: job.id }); } catch (err) { console.warn("[automation] follow-up failed", err); }
          }
        }
        good++;
      } catch (err) {
        await failOrRetry(job, err);
        bad++;
      }
    }),
  );
  return { processed: jobs.length, ok: good, failed: bad };
}
