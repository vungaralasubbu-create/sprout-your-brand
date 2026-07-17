import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, xmlResponse, getServerSupabase, type UrlEntry } from "@/lib/seo/sitemap-utils";

export const Route = createFileRoute("/sitemap-images.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getServerSupabase();
        const entries: UrlEntry[] = [];
        if (sb) {
          const [{ data: courses }, { data: cats }, { data: posts }] = await Promise.all([
            sb.from("courses").select("slug,name,hero_image_url,og_image_url,thumbnail_url,category:course_categories!inner(slug,status,is_active)").eq("is_published", true).eq("status", "published"),
            sb.from("course_categories").select("slug,name,hero_image_url").eq("status", "published").eq("is_active", true),
            sb.from("blog_posts").select("slug,title,cover_image_url").eq("is_published", true).eq("status", "published"),
          ]);
          for (const c of (courses ?? []) as any[]) {
            const cat = Array.isArray(c.category) ? c.category[0] : c.category;
            if (!cat || cat.status !== "published" || !cat.is_active) continue;
            const img = c.og_image_url ?? c.hero_image_url ?? c.thumbnail_url;
            if (!img) continue;
            entries.push({ path: `/programs/${cat.slug}/${c.slug}`, images: [{ loc: img, title: c.name }] });
          }
          for (const c of (cats ?? []) as any[]) {
            if (!c.hero_image_url) continue;
            entries.push({ path: `/programs/${c.slug}`, images: [{ loc: c.hero_image_url, title: c.name }] });
          }
          for (const p of (posts ?? []) as any[]) {
            if (!p.cover_image_url) continue;
            entries.push({ path: `/blog/${p.slug}`, images: [{ loc: p.cover_image_url, title: p.title }] });
          }
        }
        return xmlResponse(renderUrlset(entries));
      },
    },
  },
});
