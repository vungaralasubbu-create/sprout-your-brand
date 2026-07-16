import { BookOpen, Compass, GraduationCap, Users } from "lucide-react";

/**
 * Micro trust module. No invented statistics, no fake reviews.
 * Reusable across the site to reinforce credibility.
 */
export function TrustBadges({ compact = false }: { compact?: boolean }) {
  const items = [
    { icon: GraduationCap, label: "Structured Learning", desc: "Sequenced, outcome-oriented programs." },
    { icon: BookOpen, label: "Practical Knowledge", desc: "Projects, tools and real-world workflows." },
    { icon: Compass, label: "Modern Curriculum", desc: "Kept current with emerging tools and roles." },
    { icon: Users, label: "Learning Community", desc: "Peers, mentors and campus partners." },
  ];
  return (
    <div
      className={
        "grid gap-3 " +
        (compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
      }
    >
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-border bg-card/60 p-4"
        >
          <div className="flex items-center gap-2">
            <it.icon className="size-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold text-foreground">{it.label}</p>
          </div>
          {!compact && <p className="mt-2 text-xs text-muted-foreground">{it.desc}</p>}
        </div>
      ))}
    </div>
  );
}
