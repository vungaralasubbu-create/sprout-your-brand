/**
 * Glintr Blog data access.
 * RLS restricts anon reads to published + past-published-at posts.
 */
import { supabase } from "@/integrations/supabase/client";

export interface BlogTopic {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  display_order: number;
  is_active: boolean;
  visual_style: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_summary: string;
  intro: string | null;
  content_markdown: string;
  topic_id: string | null;
  category_id: string | null;
  program_category_slug: string | null;
  related_course_slug: string | null;
  related_course_category_slug: string | null;
  author_display_name: string;
  author_display_role: string | null;
  author_bio: string | null;
  featured_image_url: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  is_trending: boolean;
  status: string;
  is_published: boolean;
  published_at: string | null;
  editorial_updated_at: string | null;
  reading_time_minutes: number | null;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
  keywords: string[];
  topic?: BlogTopic | null;
  category?: BlogCategory | null;
}

const POST_SELECT =
  "*, topic:blog_topics(id,name,slug,short_description,display_order,is_active,visual_style), category:blog_categories(id,name,slug,display_order,is_active)";

export async function listTopics(): Promise<BlogTopic[]> {
  const { data, error } = await supabase
    .from("blog_topics")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as BlogTopic[];
}

export async function listCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as BlogCategory[];
}

export interface BlogFilters {
  topic?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listPosts(filters: BlogFilters = {}): Promise<BlogPost[]> {
  let q = supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .order("published_at", { ascending: false });
  if (filters.topic) {
    const { data: t } = await supabase.from("blog_topics").select("id").eq("slug", filters.topic).maybeSingle();
    if (!t) return [];
    q = q.eq("topic_id", t.id);
  }
  if (filters.category) {
    const { data: c } = await supabase.from("blog_categories").select("id").eq("slug", filters.category).maybeSingle();
    if (!c) return [];
    q = q.eq("category_id", c.id);
  }
  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, "");
    q = q.or(`title.ilike.%${s}%,short_summary.ilike.%${s}%`);
  }
  if (filters.limit != null) {
    const from = filters.offset ?? 0;
    q = q.range(from, from + filters.limit - 1);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const { data } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("is_featured", true)
    .order("display_order")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data ?? null) as BlogPost | null;
}

export async function listTrendingPosts(limit = 8): Promise<BlogPost[]> {
  const { data } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("is_trending", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as BlogPost[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  return (data ?? null) as BlogPost | null;
}

export async function listRelatedPosts(post: BlogPost, limit = 4): Promise<BlogPost[]> {
  let q = supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (post.topic_id) q = q.eq("topic_id", post.topic_id);
  const { data } = await q;
  if ((data ?? []).length >= limit || !post.category_id) return (data ?? []) as BlogPost[];
  const need = limit - (data ?? []).length;
  const seen = new Set([post.id, ...(data ?? []).map((d) => d.id)]);
  const { data: more } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("category_id", post.category_id)
    .not("id", "in", `(${[...seen].map((s) => `"${s}"`).join(",")})`)
    .order("published_at", { ascending: false })
    .limit(need);
  return [...(data ?? []), ...(more ?? [])] as BlogPost[];
}

export function formatPublished(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
