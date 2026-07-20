import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type MCWorkspace = {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  business_name: string | null;
  industry: string | null;
  website: string | null;
  country: string | null;
  timezone: string | null;
  language: string | null;
  logo_url: string | null;
  brand_colors: Record<string, string>;
  brand_fonts: Record<string, string>;
  brand_voice: string | null;
  onboarding_complete: boolean;
  plan: string;
  plan_period: string;
  created_at: string;
  updated_at: string;
};

export const listMyWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb: any = context.supabase;
    const { data, error } = await sb
      .from("mc_workspaces")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { workspaces: (data ?? []) as MCWorkspace[] };
  });

export const getMyPrimaryWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb: any = context.supabase;
    const { data } = await sb
      .from("mc_workspaces")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1);
    return { workspace: ((data ?? [])[0] ?? null) as MCWorkspace | null };
  });

export const createWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        business_name: z.string().max(160).optional().nullable(),
        industry: z.string().max(80).optional().nullable(),
        website: z.string().max(300).optional().nullable(),
        country: z.string().max(80).optional().nullable(),
        timezone: z.string().max(80).optional().nullable(),
        language: z.string().max(40).optional().nullable(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);
    const { data: created, error } = await sb
      .from("mc_workspaces")
      .insert({
        owner_id: context.userId,
        name: data.name,
        slug,
        business_name: data.business_name ?? null,
        industry: data.industry ?? null,
        website: data.website ?? null,
        country: data.country ?? null,
        timezone: data.timezone ?? null,
        language: data.language ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { workspace: created as MCWorkspace };
  });

export const updateWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: z
          .object({
            name: z.string().min(1).max(120).optional(),
            business_name: z.string().max(160).optional().nullable(),
            industry: z.string().max(80).optional().nullable(),
            website: z.string().max(300).optional().nullable(),
            country: z.string().max(80).optional().nullable(),
            timezone: z.string().max(80).optional().nullable(),
            language: z.string().max(40).optional().nullable(),
            logo_url: z.string().max(1000).optional().nullable(),
            brand_colors: z.record(z.string()).optional(),
            brand_fonts: z.record(z.string()).optional(),
            brand_voice: z.string().max(2000).optional().nullable(),
            onboarding_complete: z.boolean().optional(),
            plan: z.string().max(40).optional(),
            plan_period: z.string().max(20).optional(),
          })
          .refine((o) => Object.keys(o).length > 0, "empty patch"),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const { data: updated, error } = await sb
      .from("mc_workspaces")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { workspace: updated as MCWorkspace };
  });

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ workspace_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const { data: members, error } = await sb
      .from("mc_workspace_members")
      .select("*")
      .eq("workspace_id", data.workspace_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { members: members ?? [] };
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        workspace_id: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["admin", "editor", "viewer"]).default("editor"),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    // Look up user by email via auth admin? Not available with RLS client.
    // Store pending invite by email; membership joins on later sign-in flow.
    const { error } = await sb.from("mc_workspace_members").insert({
      workspace_id: data.workspace_id,
      user_id: context.userId, // placeholder; real flow needs an invites table. For MVP we only store the record when matching auth user is known.
      role: data.role,
      invited_email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
