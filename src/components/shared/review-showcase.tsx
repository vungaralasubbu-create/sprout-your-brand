/**
 * ReviewShowcase — public, SEO-optimized review carousel.
 * Drop into homepage, course pages, landing pages, blog posts.
 * Emits Review/AggregateRating JSON-LD schema.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star, Quote, TrendingUp, Video as VideoIcon, Linkedin } from "lucide-react";
import { getPublicReviews } from "@/lib/admin/reviews.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Location = "homepage" | "course_pages" | "landing_pages" | "blogs" | "any";

interface Props {
  location?: Location;
  targetId?: string;
  targetType?: string;
  limit?: number;
  minRating?: number;
  heading?: string;
  subheading?: string;
  className?: string;
}

export function ReviewShowcase({
  location = "any",
  targetId,
  targetType,
  limit = 9,
  minRating = 4,
  heading = "What our learners say",
  subheading = "Real stories from Glintr students who transformed their careers.",
  className = "",
}: Props) {
  const fn = useServerFn(getPublicReviews);
  const { data } = useQuery({
    queryKey: ["public-reviews", location, targetId, targetType, limit, minRating],
    queryFn: () => fn({ data: { location, target_id: targetId, target_type: targetType, limit, min_rating: minRating } }),
    staleTime: 5 * 60 * 1000,
  });

  const reviews = data?.reviews || [];
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;

  const schema = {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: avg.toFixed(1),
    reviewCount: reviews.length,
    bestRating: 5,
    itemReviewed: { "@type": "Organization", name: "Glintr" },
    review: reviews.slice(0, 5).map((r: any) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.reviewer_name },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: (r.review_text || "").slice(0, 500),
      datePublished: r.published_at,
    })),
  };

  return (
    <section className={`py-16 ${className}`} aria-label="Student reviews">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") }} />
      <div className="max-w-7xl mx-auto px-4">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
              ))}
            </div>
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">· {reviews.length} verified reviews</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">{heading}</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{subheading}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r: any) => (
            <Card key={r.id} className="p-5 relative flex flex-col">
              <Quote className="w-6 h-6 text-primary/20 absolute top-4 right-4" />
              <div className="flex items-center gap-3 mb-3">
                {r.reviewer_avatar_url
                  ? <img src={r.reviewer_avatar_url} alt={r.reviewer_name} loading="lazy" className="w-11 h-11 rounded-full object-cover" />
                  : <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-semibold">{(r.reviewer_name || "?")[0]}</div>}
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1">
                    {r.reviewer_name}
                    {r.reviewer_linkedin_url && <a href={r.reviewer_linkedin_url} target="_blank" rel="noopener noreferrer nofollow" aria-label="LinkedIn"><Linkedin className="w-3.5 h-3.5 text-blue-500" /></a>}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.target_label}{r.company_name && ` · ${r.company_name}`}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                ))}
                {r.video_url && <Badge variant="info" className="ml-2 text-[10px]"><VideoIcon className="w-3 h-3 mr-1" /> Video</Badge>}
                {r.featured && <Badge variant="featured" className="text-[10px]">Featured</Badge>}
              </div>

              {r.title && <div className="font-semibold text-sm mb-1">{r.title}</div>}
              <p className="text-sm text-muted-foreground line-clamp-5 flex-1">{r.review_text}</p>

              {r.salary_growth_pct && (
                <div className="mt-3 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 self-start">
                  <TrendingUp className="w-3 h-3" /> +{r.salary_growth_pct}% salary growth
                </div>
              )}

              {r.seo_slug && (
                <a href={`/success-stories/${r.seo_slug}`} className="text-xs text-primary mt-3 hover:underline self-start">Read full story →</a>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
