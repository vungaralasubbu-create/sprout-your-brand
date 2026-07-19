// Bulk generation orchestrator with queue + rate limits.
import { getAdmin } from "./service-client.server";
import { getTemplate } from "./template-registry.server";
import { generateAndStorePage } from "./pipeline.server";

export type BulkItem = {
  variables: Record<string, string>;
  keywords?: string[];
  extraContext?: string;
};

export async function createBatch(input: {
  name: string;
  templateId: string;
  items: BulkItem[];
  autoPublish?: boolean;
  createdBy?: string | null;
  priority?: number;
}): Promise<{ batch_id: string; enqueued: number }> {
  const admin = await getAdmin();
  const { data: tpl } = await admin.from("pseo_templates").select("page_type").eq("id", input.templateId).maybeSingle();
  const { data: batch } = await admin.from("pseo_batches").insert({
    name: input.name,
    template_id: input.templateId,
    page_type: tpl?.page_type ?? null,
    total: input.items.length,
    status: "queued",
    config: { autoPublish: !!input.autoPublish },
    created_by: input.createdBy ?? null,
  }).select("id").single();

  if (!batch?.id) throw new Error("batch creation failed");

  // Enqueue jobs (chunked insert).
  const jobs = input.items.map((it) => ({
    batch_id: batch.id,
    job_type: "generate",
    status: "pending",
    priority: input.priority ?? 100,
    payload: {
      template_id: input.templateId,
      variables: it.variables,
      keywords: it.keywords ?? [],
      extraContext: it.extraContext ?? null,
      autoPublish: !!input.autoPublish,
    },
    scheduled_for: new Date().toISOString(),
  }));
  const chunk = 500;
  for (let i = 0; i < jobs.length; i += chunk) {
    await admin.from("pseo_generation_jobs").insert(jobs.slice(i, i + chunk));
  }
  return { batch_id: batch.id, enqueued: jobs.length };
}

// Process up to `limit` pending jobs, respecting the daily generation limit.
export async function processBatchQueue(limit = 25): Promise<{
  processed: number; succeeded: number; failed: number; skipped: number;
}> {
  const admin = await getAdmin();
  const settings = await admin.from("pseo_settings").select("*").eq("id", 1).maybeSingle();
  const dailyLimit = (settings.data?.daily_generation_limit as number | undefined) ?? 2000;
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from("pseo_pages").select("id", { count: "exact", head: true })
    .gte("updated_at", since);
  if ((recentCount ?? 0) >= dailyLimit) return { processed: 0, succeeded: 0, failed: 0, skipped: limit };

  const capacity = Math.max(0, dailyLimit - (recentCount ?? 0));
  const take = Math.min(limit, capacity);

  const { data: jobs } = await admin
    .from("pseo_generation_jobs")
    .select("*")
    .eq("status", "pending")
    .eq("job_type", "generate")
    .lte("scheduled_for", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("scheduled_for", { ascending: true })
    .limit(take);

  let succeeded = 0, failed = 0;
  for (const job of jobs ?? []) {
    await admin.from("pseo_generation_jobs").update({
      status: "processing", started_at: new Date().toISOString(),
      attempts: (job.attempts ?? 0) + 1,
    }).eq("id", job.id);
    try {
      const payload = (job.payload ?? {}) as {
        template_id: string; variables: Record<string, string>;
        keywords?: string[]; extraContext?: string; autoPublish?: boolean;
      };
      const tpl = await getTemplate(payload.template_id);
      if (!tpl) throw new Error("template not found");
      const result = await generateAndStorePage({
        template: tpl,
        variables: payload.variables,
        batchId: job.batch_id ?? null,
        extraContext: payload.extraContext,
        keywords: payload.keywords,
        autoPublish: !!payload.autoPublish,
      });
      await admin.from("pseo_generation_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        page_id: result.page_id, last_error: null,
      }).eq("id", job.id);
      if (job.batch_id) {
        await admin.from("pseo_batches")
          .update({ succeeded: (await sumBatchSucceeded(admin, job.batch_id)) })
          .eq("id", job.batch_id);
      }
      succeeded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const attempts = (job.attempts ?? 0) + 1;
      const nextStatus = attempts >= 3 ? "failed" : "pending";
      const nextScheduled = new Date(Date.now() + Math.min(60 * 60_000, Math.pow(2, attempts) * 60_000)).toISOString();
      await admin.from("pseo_generation_jobs").update({
        status: nextStatus, last_error: msg,
        scheduled_for: nextStatus === "pending" ? nextScheduled : job.scheduled_for,
      }).eq("id", job.id);
      if (nextStatus === "failed" && job.batch_id) {
        await admin.from("pseo_batches")
          .update({ failed: (await sumBatchFailed(admin, job.batch_id)) })
          .eq("id", job.batch_id);
      }
      failed++;
    }
  }

  // Complete batches when queue is drained.
  const batchIds = new Set((jobs ?? []).map((j) => j.batch_id).filter(Boolean) as string[]);
  for (const bid of batchIds) {
    const { count: remaining } = await admin
      .from("pseo_generation_jobs").select("id", { count: "exact", head: true })
      .eq("batch_id", bid).in("status", ["pending", "processing"]);
    if ((remaining ?? 0) === 0) {
      await admin.from("pseo_batches").update({
        status: "completed", completed_at: new Date().toISOString(),
      }).eq("id", bid);
    }
  }

  return { processed: jobs?.length ?? 0, succeeded, failed, skipped: 0 };
}

async function sumBatchSucceeded(admin: Awaited<ReturnType<typeof getAdmin>>, batchId: string): Promise<number> {
  const { count } = await admin.from("pseo_generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId).eq("status", "completed");
  return count ?? 0;
}
async function sumBatchFailed(admin: Awaited<ReturnType<typeof getAdmin>>, batchId: string): Promise<number> {
  const { count } = await admin.from("pseo_generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId).eq("status", "failed");
  return count ?? 0;
}
