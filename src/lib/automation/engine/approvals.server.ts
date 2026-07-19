/**
 * Approval workflows: gate a job on a human decision.
 */
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function requestApproval(input: {
  handler: string;
  requestedBy: string | null;
  approverRole?: string;
  approverId?: string;
  summary: string;
  reason?: string;
  payload?: Record<string, unknown>;
  expiresInSeconds?: number;
}): Promise<string> {
  const sb = await admin();
  const { data, error } = await sb
    .from("automation_approvals")
    .insert({
      handler: input.handler,
      requested_by: input.requestedBy,
      approver_id: input.approverId ?? null,
      approver_role: input.approverRole ?? "super_admin",
      summary: input.summary,
      reason: input.reason ?? null,
      payload: (input.payload ?? {}) as any,
      expires_at: input.expiresInSeconds
        ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
        : null,
    })
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data!.id;
}

export async function decide(approvalId: string, decision: "approved" | "rejected", deciderUserId: string, reason?: string) {
  const sb = await admin();
  await sb
    .from("automation_approvals")
    .update({
      status: decision,
      approver_id: deciderUserId,
      decided_at: new Date().toISOString(),
      reason: reason ?? null,
    })
    .eq("id", approvalId);

  // Advance any waiting jobs bound to this approval.
  if (decision === "approved") {
    await sb
      .from("automation_jobs")
      .update({ status: "queued", run_at: new Date().toISOString() })
      .eq("approval_id", approvalId)
      .eq("status", "waiting_approval");
  } else {
    await sb
      .from("automation_jobs")
      .update({ status: "cancelled", completed_at: new Date().toISOString(), last_error: "approval_rejected" })
      .eq("approval_id", approvalId)
      .eq("status", "waiting_approval");
  }
}

export async function expirePending(): Promise<number> {
  const sb = await admin();
  const { data } = await sb
    .from("automation_approvals")
    .update({ status: "expired", decided_at: new Date().toISOString() })
    .lt("expires_at", new Date().toISOString())
    .eq("status", "pending")
    .select("id");
  const expired = data?.length ?? 0;
  if (expired) {
    await sb
      .from("automation_jobs")
      .update({ status: "cancelled", completed_at: new Date().toISOString(), last_error: "approval_expired" })
      .in("approval_id", (data ?? []).map((r: any) => r.id))
      .eq("status", "waiting_approval");
  }
  return expired;
}
