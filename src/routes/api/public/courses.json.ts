import { createFileRoute } from "@tanstack/react-router";

/**
 * Machine-readable course catalog for AI search engines, agents, and
 * partner integrations. Emits a single JSON document containing every
 * published course with schema.org Course fields plus Glintr-specific
 * metadata (category, pricing, level, mode). Cached at the edge.
 *
 * Consumers: OpenAI/ChatGPT search, Perplexity, Claude, Gemini, custom
 * RAG pipelines. Referenced from /llms.txt and /robots.txt.
 */
export const Route = createFileRoute("/api/public/courses.json")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const url = process.env.SUPABASE_URL!;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const supabase = createClient(url, key, {
            auth: { persistSession: false },
            global: {
              fetch: (input, init) => {
                const h = new Headers(init?.headers);
                if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                  h.delete("Authorization");
                }
                h.set("apikey", key);
                return fetch(input, { ...init, headers: h });
              },
            },
          });

          const { data: categories } = await supabase
            .from("course_categories")
            .select("id, name, slug, short_description");

          const { data: courses } = await supabase
            .from("courses")
            .select(
              "id, category_id, name, slug, short_description, full_description, thumbnail_url, hero_image_url, duration, learning_mode, level, language, weekly_commitment, format, prerequisites, target_audience, base_price, offer_price, currency, emi_available, is_featured, is_bestseller, seo_title, seo_description",
            )
            .eq("is_published", true)
            .order("display_order", { ascending: true });

          const catById = new Map<string, { name: string; slug: string }>();
          (categories ?? []).forEach((c: any) =>
            catById.set(c.id, { name: c.name, slug: c.slug }),
          );

          const origin = "https://glintr.com";

          const items = (courses ?? []).map((c: any) => {
            const cat = catById.get(c.category_id);
            const path = cat ? `/programs/${cat.slug}/${c.slug}` : `/programs/${c.slug}`;
            return {
              "@type": "Course",
              "@id": `${origin}${path}`,
              url: `${origin}${path}`,
              name: c.name,
              slug: c.slug,
              category: cat?.name,
              categorySlug: cat?.slug,
              description: c.short_description || c.seo_description || null,
              longDescription: c.full_description || null,
              image: c.hero_image_url || c.thumbnail_url || null,
              inLanguage: c.language || "en",
              educationalLevel: c.level || null,
              timeRequired: c.duration || null,
              learningMode: c.learning_mode || null,
              format: c.format || null,
              weeklyCommitment: c.weekly_commitment || null,
              prerequisites: c.prerequisites || null,
              targetAudience: c.target_audience || null,
              offers: {
                "@type": "Offer",
                price: c.offer_price ?? c.base_price ?? null,
                basePrice: c.base_price ?? null,
                priceCurrency: c.currency || "INR",
                emiAvailable: !!c.emi_available,
                availability: "https://schema.org/InStock",
              },
              provider: {
                "@type": "EducationalOrganization",
                name: "Glintr",
                url: origin,
              },
              flags: {
                featured: !!c.is_featured,
                bestseller: !!c.is_bestseller,
              },
            };
          });

          const body = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Glintr — Course Catalog",
            description:
              "Machine-readable catalog of every published Glintr program. Covers AI, Data Science, Cyber Security, Cloud Computing, VLSI, Robotics, IoT and more.",
            url: `${origin}/api/public/courses.json`,
            provider: {
              "@type": "EducationalOrganization",
              name: "Glintr",
              url: origin,
            },
            generatedAt: new Date().toISOString(),
            totalItems: items.length,
            itemListElement: items,
          };

          return new Response(JSON.stringify(body, null, 2), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "public, max-age=1800, s-maxage=3600",
              "access-control-allow-origin": "*",
              "x-robots-tag": "all",
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: "catalog_unavailable", message: String((err as Error)?.message ?? err) }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }
      },
    },
  },
});
