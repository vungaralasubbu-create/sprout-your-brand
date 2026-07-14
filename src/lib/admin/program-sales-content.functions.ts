import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

export const adminListProgramSales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabase } = context;
    const { data: courses, error } = await supabase
      .from("courses")
      .select("id, name, slug, category_id")
      .eq("is_published", true)
      .order("name");
    if (error) throw error;

    const { data: cats } = await supabase.from("course_categories").select("id, name");
    const catMap = new Map((cats ?? []).map((c) => [c.id, c.name as string]));

    const { data: sales } = await supabase
      .from("course_sales_content")
      .select("course_id, talking_points, ideal_learners, faqs, objections");
    const salesMap = new Map((sales ?? []).map((s) => [s.course_id, s]));

    return (courses ?? []).map((c) => {
      const s = salesMap.get(c.id);
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        category_name: catMap.get(c.category_id) ?? null,
        talking_points_count: ((s?.talking_points as string[]) ?? []).length,
        ideal_learners_count: ((s?.ideal_learners as string[]) ?? []).length,
        faqs_count: ((s?.faqs as unknown[]) ?? []).length,
        objections_count: ((s?.objections as unknown[]) ?? []).length,
        has_content: !!s,
      };
    });
  });

export const adminGetProgramSales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { courseId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("course_sales_content")
      .select("talking_points, ideal_learners, faqs, objections")
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (error) throw error;
    return {
      talking_points: (row?.talking_points as string[]) ?? [],
      ideal_learners: (row?.ideal_learners as string[]) ?? [],
      faqs: (row?.faqs as Array<{ question: string; answer: string }>) ?? [],
      objections:
        (row?.objections as Array<{ objection: string; response: string }>) ?? [],
    };
  });

export const adminUpsertProgramSales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      courseId: string;
      talking_points: string[];
      ideal_learners: string[];
      faqs: Array<{ question: string; answer: string }>;
      objections: Array<{ objection: string; response: string }>;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const clean = {
      course_id: data.courseId,
      talking_points: data.talking_points.map((s) => s.trim()).filter(Boolean),
      ideal_learners: data.ideal_learners.map((s) => s.trim()).filter(Boolean),
      faqs: data.faqs
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter((f) => f.question && f.answer),
      objections: data.objections
        .map((o) => ({ objection: o.objection.trim(), response: o.response.trim() }))
        .filter((o) => o.objection && o.response),
      updated_by: context.userId,
    };
    const { error } = await context.supabase
      .from("course_sales_content")
      .upsert(clean, { onConflict: "course_id" });
    if (error) throw error;
    return { ok: true };
  });
