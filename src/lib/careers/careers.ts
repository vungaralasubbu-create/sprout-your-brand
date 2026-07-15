/**
 * Careers CMS data access — public reads via Supabase publishable key.
 * RLS on hiring_departments / hiring_roles enforces active / published visibility.
 */
import { supabase } from "@/integrations/supabase/client";

export interface DbDepartment {
  id: string;
  name: string;
  slug: string;
  headline: string | null;
  purpose: string | null;
  focus_areas: string[];
  display_order: number;
  is_active: boolean;
}

export interface DbRole {
  id: string;
  role_code: string | null;
  title: string;
  slug: string;
  department_id: string | null;
  short_summary: string | null;
  overview: string | null;
  responsibilities: string[];
  requirements: string[];
  preferred_qualifications: string[];
  skills: string[];
  employment_type: string;
  work_type: string;
  location_type: string;
  location_display: string | null;
  experience_level: string | null;
  application_open_at: string | null;
  application_close_at: string | null;
  is_published: boolean;
  status: string;
  is_featured: boolean;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface RoleFilters {
  departmentSlug?: string;
  workType?: string;
  locationType?: string;
  experienceLevel?: string;
  search?: string;
  status?: string; // defaults to 'open' for public listing
}

export async function listDepartments(): Promise<DbDepartment[]> {
  const { data } = await supabase
    .from("hiring_departments")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  return (data ?? []) as DbDepartment[];
}

export async function listRoles(
  filters: RoleFilters = {},
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<{ rows: DbRole[]; total: number }> {
  let query = supabase
    .from("hiring_roles")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .eq("status", filters.status ?? "open");

  if (filters.workType) query = query.eq("work_type", filters.workType);
  if (filters.locationType) query = query.eq("location_type", filters.locationType);
  if (filters.experienceLevel) query = query.eq("experience_level", filters.experienceLevel);

  if (filters.departmentSlug) {
    const { data: dept } = await supabase
      .from("hiring_departments")
      .select("id")
      .eq("slug", filters.departmentSlug)
      .maybeSingle();
    if (dept?.id) query = query.eq("department_id", dept.id);
    else return { rows: [], total: 0 };
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `title.ilike.${term},short_summary.ilike.${term},overview.ilike.${term}`,
    );
  }

  const { data, count } = await query
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { rows: (data ?? []) as DbRole[], total: count ?? 0 };
}

export async function listFeaturedRoles(): Promise<DbRole[]> {
  const { data } = await supabase
    .from("hiring_roles")
    .select("*")
    .eq("is_published", true)
    .eq("status", "open")
    .eq("is_featured", true)
    .order("display_order", { ascending: true })
    .limit(8);
  return (data ?? []) as DbRole[];
}

export async function getRoleBySlug(slug: string): Promise<DbRole | null> {
  const { data } = await supabase
    .from("hiring_roles")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as DbRole) ?? null;
}

export async function listRelatedRoles(role: DbRole, take = 4): Promise<DbRole[]> {
  if (!role.department_id) return [];
  const { data } = await supabase
    .from("hiring_roles")
    .select("*")
    .eq("is_published", true)
    .eq("status", "open")
    .eq("department_id", role.department_id)
    .neq("id", role.id)
    .limit(take);
  return (data ?? []) as DbRole[];
}

export const WORK_TYPES: { value: string; label: string }[] = [
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

export const LOCATION_TYPES: { value: string; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-Site" },
];

export const EXPERIENCE_LEVELS: { value: string; label: string }[] = [
  { value: "internship", label: "Internship" },
  { value: "entry", label: "Entry Level" },
  { value: "early_career", label: "Early Career" },
  { value: "experienced", label: "Experienced" },
];

export function formatWorkType(v: string): string {
  return WORK_TYPES.find((x) => x.value === v)?.label ?? v;
}
export function formatLocationType(v: string): string {
  return LOCATION_TYPES.find((x) => x.value === v)?.label ?? v;
}
export function formatExperienceLevel(v: string | null): string | null {
  if (!v) return null;
  return EXPERIENCE_LEVELS.find((x) => x.value === v)?.label ?? v;
}
