import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PartnerProgramCard = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  duration: string | null;
  learning_mode: string | null;
  level: string | null;
  base_price: number | null;
  offer_price: number | null;
  category: { id: string; name: string; slug: string } | null;
};

export const listPartnerPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: courses, error } = await supabase
      .from("courses")
      .select(
        "id, name, slug, short_description, duration, learning_mode, level, base_price, offer_price, display_order, category_id",
      )
      .eq("is_published", true)
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;

    const { data: cats, error: catErr } = await supabase
      .from("course_categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (catErr) throw catErr;

    const catMap = new Map((cats ?? []).map((c) => [c.id, c]));
    const items: PartnerProgramCard[] = (courses ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      short_description: c.short_description,
      duration: c.duration,
      learning_mode: c.learning_mode,
      level: c.level,
      base_price: c.base_price ? Number(c.base_price) : null,
      offer_price: c.offer_price ? Number(c.offer_price) : null,
      category: catMap.get(c.category_id) ?? null,
    }));

    return { items, categories: cats ?? [] };
  });

export type ProgramFaq = { question: string; answer: string };
export type ProgramObjection = { objection: string; response: string };

export type PartnerProgramDetails = {
  course: {
    id: string;
    name: string;
    slug: string;
    short_description: string | null;
    full_description: string | null;
    duration: string | null;
    learning_mode: string | null;
    level: string | null;
    language: string | null;
    target_audience: string | null;
    base_price: number | null;
    offer_price: number | null;
  };
  category: { id: string; name: string; slug: string } | null;
  certification: {
    name: string | null;
    description: string | null;
  } | null;
  sales: {
    talking_points: string[];
    ideal_learners: string[];
    faqs: ProgramFaq[];
    objections: ProgramObjection[];
  };
};

export const getPartnerProgramDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data, context }): Promise<PartnerProgramDetails> => {
    const { supabase } = context;
    const { data: course, error } = await supabase
      .from("courses")
      .select(
        "id, name, slug, short_description, full_description, duration, learning_mode, level, language, target_audience, base_price, offer_price, category_id",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!course) throw new Error("Program not found");

    const [{ data: category }, { data: sales }, { data: certRow }] = await Promise.all([
      supabase
        .from("course_categories")
        .select("id, name, slug")
        .eq("id", course.category_id)
        .maybeSingle(),
      supabase
        .from("course_sales_content")
        .select("talking_points, ideal_learners, faqs, objections")
        .eq("course_id", course.id)
        .maybeSingle(),
      supabase
        .from("course_certifications")
        .select("name, description")
        .eq("course_id", course.id)
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      course: {
        id: course.id,
        name: course.name,
        slug: course.slug,
        short_description: course.short_description,
        full_description: course.full_description,
        duration: course.duration,
        learning_mode: course.learning_mode,
        level: course.level,
        language: course.language,
        target_audience: course.target_audience,
        base_price: course.base_price ? Number(course.base_price) : null,
        offer_price: course.offer_price ? Number(course.offer_price) : null,
      },
      category: category ?? null,
      certification: certRow
        ? { name: certRow.name ?? null, description: certRow.description ?? null }
        : null,
      sales: {
        talking_points: (sales?.talking_points as string[] | null) ?? [],
        ideal_learners: (sales?.ideal_learners as string[] | null) ?? [],
        faqs: (sales?.faqs as ProgramFaq[] | null) ?? [],
        objections: (sales?.objections as ProgramObjection[] | null) ?? [],
      },
    };
  });
