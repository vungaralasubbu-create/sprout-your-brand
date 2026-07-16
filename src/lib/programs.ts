/**
 * Program CMS data access — reads via Supabase publishable key (RLS enforces
 * "published only" for anon). No server function required for public reads.
 */
import { supabase } from "@/integrations/supabase/client";

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  icon: string | null;
  thumbnail_url: string | null;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  accent_style: string | null;
  display_order: number;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
}

export interface DbCourse {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  thumbnail_url: string | null;
  hero_image_url: string | null;
  promo_video_url: string | null;
  is_featured: boolean;
  is_trending: boolean;
  is_popular: boolean;
  is_bestseller: boolean;
  white_label_eligible: boolean;
  partner_sale_eligible: boolean;
  supported_sales_eligible: boolean;
  display_order: number;
  duration: string | null;
  learning_mode: string | null;
  level: string | null;
  language: string | null;
  weekly_commitment: string | null;
  format: string | null;
  prerequisites: string | null;
  eligibility: string | null;
  target_audience: string | null;
  base_price: number | null;
  offer_price: number | null;
  currency: string | null;
  emi_available: boolean;
  emi_starting: number | null;
  scholarship_available: boolean;
  pricing_notes: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
}

export interface CourseFilters {
  category?: string;
  categoryId?: string;
  level?: string;
  mode?: string;
  emi?: boolean;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

function logProgramQueryResult(label: string, data: unknown[] | null, error: unknown) {
  if (!import.meta.env.DEV) return;

  if (error) {
    console.error(`[programs] ${label} query failed`, error);
    return;
  }

  console.debug(`[programs] ${label} query returned ${data?.length ?? 0} records`, data);
}

export async function listCategories(): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from("course_categories")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  logProgramQueryResult("categories", data, error);
  if (error) throw error;
  return (data ?? []) as DbCategory[];
}

export async function getCategoryBySlug(slug: string): Promise<DbCategory | null> {
  const { data, error } = await supabase
    .from("course_categories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_active", true)
    .maybeSingle();
  if (import.meta.env.DEV) {
    if (error) console.error(`[programs] category query failed for ${slug}`, error);
    else console.debug(`[programs] category query for ${slug}`, data);
  }
  if (error) throw error;
  return (data ?? null) as DbCategory | null;
}

export async function listCourses(filters: CourseFilters = {}): Promise<
  (DbCourse & { category: { slug: string; name: string } })[]
> {
  let q = supabase
    .from("courses")
    .select("*, category:course_categories!inner(slug,name)")
    .eq("is_published", true)
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (filters.categoryId) {
    q = q.eq("category_id", filters.categoryId);
  } else if (filters.category) {
    const category = await getCategoryBySlug(filters.category);
    if (!category) return [];
    q = q.eq("category_id", category.id);
  }
  if (filters.level) q = q.eq("level", filters.level);
  if (filters.mode) q = q.eq("learning_mode", filters.mode);
  if (filters.emi) q = q.eq("emi_available", true);
  if (filters.featured) q = q.eq("is_featured", true);
  if (filters.minPrice !== undefined) q = q.gte("offer_price", filters.minPrice);
  if (filters.maxPrice !== undefined) q = q.lte("offer_price", filters.maxPrice);
  if (filters.search) q = q.ilike("name", `%${filters.search}%`);
  const { data, error } = await q;
  logProgramQueryResult("courses", data, error);
  if (error) throw error;
  return (data ?? []) as never;
}

export async function getCourseBySlug(
  categorySlug: string,
  courseSlug: string,
): Promise<
  | (DbCourse & {
      category: DbCategory;
      sections: Array<{ section_type: string; title: string | null; content: unknown; display_order: number }>;
      modules: Array<{
        id: string;
        number: number | null;
        name: string;
        description: string | null;
        duration: string | null;
        display_order: number;
        topics: Array<{ id: string; name: string; description: string | null; display_order: number }>;
      }>;
      skills: string[];
      tools: Array<{ name: string; logo_url: string | null }>;
      career_roles: Array<{ title: string; description?: string | null; salary_min: number | null; salary_max: number | null; currency: string | null; salary_period: string | null }>;
      certifications: Array<{ name: string; description: string | null; image_url: string | null; issuer: string | null }>;
      placement: Array<{ support_type: string; description: string | null }>;
      faqs: Array<{ question: string; answer: string }>;
      projects: Array<{ id: string; name: string; slug: string; short_description: string | null; image_url: string | null; project_type: string | null; difficulty: string | null; duration: string | null; industry: string | null; learning_outcomes: string[] | null }>;
      brochure: { file_url: string; capture_lead: boolean } | null;
    })
  | null
> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return null;
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("category_id", category.id)
    .eq("slug", courseSlug)
    .eq("is_published", true)
    .eq("status", "published")
    .maybeSingle();
  if (import.meta.env.DEV) {
    if (error) console.error(`[programs] course query failed for ${categorySlug}/${courseSlug}`, error);
    else console.debug(`[programs] course query for ${categorySlug}/${courseSlug}`, course);
  }
  if (error) throw error;
  if (!course) return null;

  const [sections, modules, skillsJoin, toolsJoin, rolesJoin, certs, placement, faqs, brochures, projectsJoin] = await Promise.all([
    supabase.from("course_sections").select("section_type,title,content,display_order").eq("course_id", course.id).order("display_order"),
    supabase.from("course_modules").select("id,number,name,description,duration,display_order").eq("course_id", course.id).order("display_order"),
    supabase.from("course_skills").select("skills(name)").eq("course_id", course.id),
    supabase.from("course_tools").select("tools(name,logo_url)").eq("course_id", course.id),
    supabase.from("course_career_roles").select("career_roles(title,description,salary_min,salary_max,currency,salary_period)").eq("course_id", course.id),
    supabase.from("course_certifications").select("name,description,image_url,issuer").eq("course_id", course.id),
    supabase.from("course_placement_support").select("support_type,description").eq("course_id", course.id).order("display_order"),
    supabase.from("course_faqs").select("question,answer").eq("course_id", course.id).order("display_order"),
    supabase.from("course_brochures").select("file_url,capture_lead").eq("course_id", course.id).limit(1),
    supabase.from("course_projects").select("display_order,course_project_templates(id,name,slug,short_description,image_url,project_type,difficulty,duration,industry,learning_outcomes)").eq("course_id", course.id).order("display_order"),
  ]);

  const moduleIds = (modules.data ?? []).map((m) => m.id);
  let topicsByModule: Record<string, Array<{ id: string; name: string; description: string | null; display_order: number }>> = {};
  if (moduleIds.length) {
    const { data: topics } = await supabase
      .from("course_topics")
      .select("id,module_id,name,description,display_order")
      .in("module_id", moduleIds)
      .order("display_order");
    topicsByModule = (topics ?? []).reduce((acc, t: any) => {
      (acc[t.module_id] ||= []).push({ id: t.id, name: t.name, description: t.description, display_order: t.display_order });
      return acc;
    }, {} as typeof topicsByModule);
  }

  return {
    ...(course as DbCourse),
    category,
    sections: (sections.data ?? []) as never,
    modules: (modules.data ?? []).map((m) => ({ ...m, topics: topicsByModule[m.id] ?? [] })) as never,
    skills: ((skillsJoin.data ?? []) as any[]).map((r) => r.skills?.name).filter(Boolean),
    tools: ((toolsJoin.data ?? []) as any[]).map((r) => r.tools).filter(Boolean),
    career_roles: ((rolesJoin.data ?? []) as any[]).map((r) => r.career_roles).filter(Boolean),
    certifications: (certs.data ?? []) as never,
    placement: (placement.data ?? []) as never,
    faqs: (faqs.data ?? []) as never,
    projects: ((projectsJoin.data ?? []) as any[]).map((r) => r.course_project_templates).filter(Boolean),
    brochure: (brochures.data ?? [])[0] ?? null,
  };
}

export async function getRelatedCourses(courseId: string, categoryId: string, limit = 3) {
  const { data } = await supabase
    .from("courses")
    .select("id,name,slug,short_description,duration,level,offer_price,base_price,currency,category:course_categories!inner(slug,name)")
    .eq("category_id", categoryId)
    .eq("is_published", true)
    .eq("status", "published")
    .neq("id", courseId)
    .limit(limit);
  if (import.meta.env.DEV) {
    console.debug(`[programs] related courses query returned ${data?.length ?? 0} records`, data);
  }
  return data ?? [];
}

export function formatPrice(amount: number | null | undefined, currency = "INR") {
  if (amount == null) return "";
  const symbol = currency === "INR" ? "₹" : currency;
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}

/**
 * Structured pricing for cards — supports 6 pricing modes and NEVER
 * returns fake values. Callers hide the pricing block when `null`.
 */
export type PricingDisplay =
  | {
      mode: "starting-from";
      label: string;
      value: string;
      amount: number;
      original?: string | null;
      savings?: number | null;
      savingsLabel?: string | null;
      emiFrom?: string | null;
      scholarship?: boolean;
      note?: string | null;
    }
  | { mode: "scholarship"; label: string; value: null; note?: string | null }
  | { mode: "contact-advisor"; label: string; value: null; note?: string | null }
  | { mode: "custom"; label: string; value: null; note?: string | null }
  | { mode: "free-intro"; label: string; value: null; note?: string | null };

export interface PricingSettings {
  currency: string;
  emiMonths: number;
  emiMinMonthly: number;
  scholarshipEnabled: boolean;
  scholarshipPercent: number;
  showSavings: boolean;
}

const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  currency: "INR",
  emiMonths: 12,
  emiMinMonthly: 999,
  scholarshipEnabled: true,
  scholarshipPercent: 15,
  showSavings: true,
};

let _pricingSettingsCache: { at: number; value: PricingSettings } | null = null;

/** Reads pricing.* keys from platform_settings — 60s cache. */
export async function getPricingSettings(): Promise<PricingSettings> {
  const now = Date.now();
  if (_pricingSettingsCache && now - _pricingSettingsCache.at < 60_000) return _pricingSettingsCache.value;
  try {
    const { data } = await supabase
      .from("platform_settings")
      .select("key,value")
      .like("key", "pricing.%");
    const map = new Map<string, unknown>();
    for (const row of data ?? []) map.set(row.key, row.value as unknown);
    const parse = <T,>(k: string, fallback: T): T => {
      const v = map.get(k);
      if (v === undefined || v === null) return fallback;
      return v as T;
    };
    const value: PricingSettings = {
      currency: parse("pricing.default_currency", DEFAULT_PRICING_SETTINGS.currency),
      emiMonths: parse("pricing.emi_months", DEFAULT_PRICING_SETTINGS.emiMonths),
      emiMinMonthly: parse("pricing.emi_min_monthly", DEFAULT_PRICING_SETTINGS.emiMinMonthly),
      scholarshipEnabled: parse("pricing.scholarship_enabled", DEFAULT_PRICING_SETTINGS.scholarshipEnabled),
      scholarshipPercent: parse("pricing.scholarship_percent", DEFAULT_PRICING_SETTINGS.scholarshipPercent),
      showSavings: parse("pricing.show_savings", DEFAULT_PRICING_SETTINGS.showSavings),
    };
    _pricingSettingsCache = { at: now, value };
    return value;
  } catch {
    return DEFAULT_PRICING_SETTINGS;
  }
}

export function resolvePricingDisplay(
  course: {
    base_price: number | null;
    offer_price: number | null;
    currency: string | null;
    scholarship_available: boolean;
    pricing_notes: string | null;
  },
  settings?: PricingSettings,
): PricingDisplay | null {
  const s = settings ?? DEFAULT_PRICING_SETTINGS;
  const cur = course.currency ?? s.currency ?? "INR";
  const offer = course.offer_price;
  const base = course.base_price;
  const price = offer ?? base;
  if (typeof price === "number" && price > 0) {
    const hasDiscount = typeof offer === "number" && typeof base === "number" && offer > 0 && base > offer;
    const savings = hasDiscount ? (base as number) - (offer as number) : null;
    const emiMonthly = Math.max(s.emiMinMonthly, Math.round(price / Math.max(1, s.emiMonths) / 100) * 100 - 1);
    return {
      mode: "starting-from",
      label: "Starting from",
      value: formatPrice(price, cur),
      amount: price,
      original: hasDiscount ? formatPrice(base as number, cur) : null,
      savings,
      savingsLabel: savings ? `Save ${formatPrice(savings, cur)}` : null,
      emiFrom: `EMI from ${formatPrice(emiMonthly, cur)}/mo`,
      scholarship: !!(s.scholarshipEnabled && course.scholarship_available),
      note: course.pricing_notes,
    };
  }
  if (course.scholarship_available) {
    return { mode: "scholarship", label: "Scholarship Available", value: null, note: course.pricing_notes };
  }
  if (course.pricing_notes) {
    const notes = course.pricing_notes.toLowerCase();
    if (notes.includes("free")) {
      return { mode: "free-intro", label: "Free Intro", value: null, note: course.pricing_notes };
    }
    if (notes.includes("custom")) {
      return { mode: "custom", label: "Custom Pricing", value: null, note: course.pricing_notes };
    }
    if (notes.includes("contact") || notes.includes("advisor")) {
      return { mode: "contact-advisor", label: "Contact Advisor", value: null, note: course.pricing_notes };
    }
  }
  return null;
}


