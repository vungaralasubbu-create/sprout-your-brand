import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/workspace/panel";
import { useAchievements, useStreak } from "@/lib/workspace/storage";

export const Route = createFileRoute("/my/achievements")({
  component: AchievementsPage,
});

function AchievementsPage() {
  const list = useAchievements();
  const streak = useStreak();
  const unlocked = list.filter((a) => a.unlockedAt).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Milestones
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Learning achievements
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Meaningful milestones — not points or badges to chase. {unlocked} of {list.length} unlocked.
        </p>
      </header>

      <Panel eyebrow="Streak" title="Learning consistency">
        <div className="grid gap-4 sm:grid-cols-3">
          <StreakStat label="Current" value={`${streak.current} days`} />
          <StreakStat label="Longest" value={`${streak.longest} days`} />
          <StreakStat label="Last 30" value={`${streak.history.length} active days`} />
        </div>
        <div className="mt-4 grid grid-cols-15 gap-1 sm:grid-cols-30" style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}>
          {Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const active = streak.history.includes(iso);
            return (
              <div
                key={i}
                title={iso}
                className={
                  "aspect-square rounded-sm " +
                  (active ? "bg-gradient-to-br from-primary to-accent" : "bg-muted")
                }
              />
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Missing days don't reset your journey — keep coming back at your own pace.
        </p>
      </Panel>

      <Panel eyebrow="Milestones" title="Your achievements">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <li
              key={a.id}
              className={
                "relative overflow-hidden rounded-2xl border p-4 " +
                (a.unlockedAt
                  ? "border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10"
                  : "border-dashed border-border/60 bg-card/30 opacity-70")
              }
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold " +
                    (a.unlockedAt
                      ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                      : "bg-muted text-muted-foreground")
                  }
                  aria-hidden
                >
                  ★
                </span>
                {a.unlockedAt && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Unlocked
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
              {a.unlockedAt && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {new Date(a.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function StreakStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
