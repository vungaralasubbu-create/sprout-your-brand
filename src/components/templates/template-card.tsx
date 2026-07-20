import { Link } from "@tanstack/react-router";
import { Star, Clock, Sparkles, Zap, TrendingUp, Award, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TemplateCard({ t, size = "md" }: { t: any; size?: "md" | "lg" }) {
  const badges: { icon: any; label: string; cls: string }[] = [];
  if (t.is_editors_choice) badges.push({ icon: Award, label: "Editor's Choice", cls: "bg-amber-500/15 text-amber-600" });
  if (t.is_trending) badges.push({ icon: TrendingUp, label: "Trending", cls: "bg-fuchsia-500/15 text-fuchsia-600" });
  if (t.is_agency_pick) badges.push({ icon: Sparkles, label: "Agency Pick", cls: "bg-blue-500/15 text-blue-600" });
  if (t.is_enterprise_ready) badges.push({ icon: Building2, label: "Enterprise", cls: "bg-emerald-500/15 text-emerald-600" });

  return (
    <Link
      to="/templates/$slug"
      params={{ slug: t.slug }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5",
      )}
    >
      {/* Cover */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br from-primary/10 via-fuchsia-500/10 to-blue-500/10", size === "lg" ? "h-56" : "h-44")}>
        {t.cover_image_url ? (
          <img src={t.cover_image_url} alt={t.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {badges.slice(0, 2).map((b, i) => {
            const Icon = b.icon;
            return (
              <span key={i} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur", b.cls)}>
                <Icon className="h-3 w-3" /> {b.label}
              </span>
            );
          })}
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          <Zap className="h-3 w-3" /> {t.estimated_credits} credits
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold leading-tight">{t.title}</div>
          {t.rating_count > 0 && (
            <div className="flex shrink-0 items-center gap-0.5 text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium">{Number(t.rating_avg).toFixed(1)}</span>
              <span className="text-muted-foreground">({t.rating_count})</span>
            </div>
          )}
        </div>
        {t.tagline && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.tagline}</p>}
        <div className="mt-3 flex flex-wrap gap-1">
          {(t.industry ?? []).slice(0, 2).map((i: string) => (
            <span key={i} className="rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{i.replace(/-/g, " ")}</span>
          ))}
          {(t.goals ?? []).slice(0, 1).map((g: string) => (
            <span key={g} className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] capitalize text-primary">{g.replace(/-/g, " ")}</span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t.estimated_time_minutes} min</span>
          <span>·</span>
          <span className="capitalize">{t.difficulty}</span>
          {t.downloads_count > 0 && (<><span>·</span><span>{t.downloads_count.toLocaleString()} uses</span></>)}
        </div>
      </div>
    </Link>
  );
}
