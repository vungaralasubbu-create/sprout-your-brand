import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ws(ctx: any) {
  const { data } = await ctx.supabase
    .from("mc_workspace_members").select("workspace_id,role")
    .eq("user_id", ctx.userId).limit(1).maybeSingle();
  return data ?? null;
}

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await ws(context); if (!m) return { accounts: [] };
    const { data } = await context.supabase.from("intg_accounts")
      .select("id,provider,category,display_name,external_account,status,health,scopes,sync_frequency,last_synced_at,created_at")
      .eq("workspace_id", m.workspace_id).order("created_at", { ascending: false });
    return { accounts: data ?? [] };
  });

export const connectProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    provider: z.string().min(1).max(80),
    category: z.string().min(1).max(40),
    display_name: z.string().max(200).optional(),
    external_account: z.string().max(200).optional(),
    scopes: z.array(z.string()).default([]),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    const { data: row, error } = await context.supabase.from("intg_accounts").upsert({
      workspace_id: m.workspace_id, provider: data.provider, category: data.category,
      display_name: data.display_name ?? data.provider,
      external_account: data.external_account ?? context.userId,
      status: "connected", health: "healthy", scopes: data.scopes,
      connected_by: context.userId, last_synced_at: new Date().toISOString(),
    }, { onConflict: "workspace_id,provider,external_account" }).select().maybeSingle();
    if (error) throw new Error(error.message);
    await context.supabase.from("intg_logs").insert({
      workspace_id: m.workspace_id, account_id: row?.id ?? null, provider: data.provider,
      event_type: "connected", status: "success", actor_id: context.userId,
    });
    return { account: row };
  });

export const disconnectAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    const { data: acc } = await context.supabase.from("intg_accounts")
      .select("id,provider").eq("id", data.id).eq("workspace_id", m.workspace_id).maybeSingle();
    await context.supabase.from("intg_accounts").delete().eq("id", data.id).eq("workspace_id", m.workspace_id);
    if (acc) await context.supabase.from("intg_logs").insert({
      workspace_id: m.workspace_id, provider: acc.provider, event_type: "disconnected",
      status: "info", actor_id: context.userId,
    });
    return { ok: true };
  });

export const syncAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    const now = new Date().toISOString();
    const { data: acc } = await context.supabase.from("intg_accounts")
      .update({ last_synced_at: now, health: "healthy" }).eq("id", data.id)
      .eq("workspace_id", m.workspace_id).select("id,provider").maybeSingle();
    if (acc) await context.supabase.from("intg_logs").insert({
      workspace_id: m.workspace_id, account_id: acc.id, provider: acc.provider,
      event_type: "sync_completed", status: "success", actor_id: context.userId,
    });
    return { ok: true, synced_at: now };
  });

export const updateSyncFrequency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    id: z.string().uuid(),
    sync_frequency: z.enum(["manual","hourly","daily","weekly","realtime"]),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    await context.supabase.from("intg_accounts")
      .update({ sync_frequency: data.sync_frequency }).eq("id", data.id).eq("workspace_id", m.workspace_id);
    return { ok: true };
  });

export const listLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await ws(context); if (!m) return { logs: [] };
    const { data } = await context.supabase.from("intg_logs")
      .select("id,provider,event_type,status,message,created_at")
      .eq("workspace_id", m.workspace_id).order("created_at", { ascending: false }).limit(200);
    return { logs: data ?? [] };
  });

export const listTokens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await ws(context); if (!m) return { tokens: [] };
    const { data } = await context.supabase.from("intg_api_tokens")
      .select("id,name,scopes,token_prefix,expires_at,last_used_at,revoked_at,created_at")
      .eq("workspace_id", m.workspace_id).order("created_at", { ascending: false });
    return { tokens: data ?? [] };
  });

export const createToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    name: z.string().min(1).max(120),
    scopes: z.array(z.string()).default([]),
    expires_in_days: z.number().int().min(1).max(365).optional(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    const bytes = new Uint8Array(24); crypto.getRandomValues(bytes);
    const secret = "glr_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const prefix = secret.slice(0, 10);
    const expires_at = data.expires_in_days
      ? new Date(Date.now() + data.expires_in_days * 86400000).toISOString() : null;
    await context.supabase.from("intg_api_tokens").insert({
      workspace_id: m.workspace_id, name: data.name, scopes: data.scopes,
      token_prefix: prefix, expires_at, created_by: context.userId,
    });
    return { token: secret, prefix };
  });

export const revokeToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    await context.supabase.from("intg_api_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id).eq("workspace_id", m.workspace_id);
    return { ok: true };
  });
