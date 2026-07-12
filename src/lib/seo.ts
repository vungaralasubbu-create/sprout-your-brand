import { supabase } from "@/integrations/supabase/client";

export interface CourseSeoData {
  name: string;
  seo_title: string | null;
  seo_description: string | null;
  short_description: string | null;
  og_image_url: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  level: string | null;
  language: string | null;
  category: { slug: string; name: string };
}

export interface CategorySeoData {
  name: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  short_description: string | null;
  hero_image_url: string | null;
}

export async function getCourseSeo(categorySlug: string, courseSlug: string): Promise<CourseSeoData | null> {
  const { data } = await supabase
    .from("courses")
    .select(
      "name,seo_title,seo_description,short_description,og_image_url,hero_image_url,thumbnail_url,duration,level,language,category:course_categories!inner(slug,name,status,is_active)"
    )
    .eq("slug", courseSlug)
    .eq("is_published", true)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  const cat = Array.isArray((data as any).category) ? (data as any).category[0] : (data as any).category;
  if (!cat || cat.slug !== categorySlug || cat.status !== "published" || !cat.is_active) return null;
  return {
    name: (data as any).name,
    seo_title: (data as any).seo_title,
    seo_description: (data as any).seo_description,
    short_description: (data as any).short_description,
    og_image_url: (data as any).og_image_url,
    hero_image_url: (data as any).hero_image_url,
    thumbnail_url: (data as any).thumbnail_url,
    duration: (data as any).duration,
    level: (data as any).level,
    language: (data as any).language,
    category: { slug: cat.slug, name: cat.name },
  };
}

export async function getCategorySeo(slug: string): Promise<CategorySeoData | null> {
  const { data } = await supabase
    .from("course_categories")
    .select("name,slug,seo_title,seo_description,short_description,hero_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_active", true)
    .maybeSingle();
  return (data as CategorySeoData | null) ?? null;
}
