// Scheduler helpers — resolve next fire times for once/daily/weekly/monthly/quarterly.
// Timezone-aware via IANA offsets (server passes explicit ISO strings; UI supplies TZ).

import type { SocFrequency } from "./types";

export type FrequencyConfig = {
  hour?: number; // 0-23 in tz
  minute?: number;
  weekday?: number; // 0=Sun..6=Sat
  day_of_month?: number; // 1-31
  months_interval?: number; // for quarterly=3
  custom_cron?: string;
};

export function nextFireAt(
  baseUtcMs: number,
  frequency: SocFrequency,
  cfg: FrequencyConfig = {},
  timezone = "UTC",
): Date | null {
  const base = new Date(baseUtcMs);
  const hour = cfg.hour ?? 9;
  const minute = cfg.minute ?? 0;

  const next = new Date(base);
  next.setUTCSeconds(0, 0);
  next.setUTCHours(hour, minute, 0, 0);

  const bumpDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

  switch (frequency) {
    case "once":
      return next > base ? next : null;
    case "daily":
      return next > base ? next : bumpDays(next, 1);
    case "weekly": {
      const targetDow = cfg.weekday ?? 1;
      const cur = next.getUTCDay();
      let diff = (targetDow - cur + 7) % 7;
      if (diff === 0 && next <= base) diff = 7;
      return bumpDays(next, diff);
    }
    case "monthly": {
      const dom = cfg.day_of_month ?? 1;
      const cand = new Date(next);
      cand.setUTCDate(dom);
      if (cand <= base) cand.setUTCMonth(cand.getUTCMonth() + 1);
      return cand;
    }
    case "quarterly": {
      const dom = cfg.day_of_month ?? 1;
      const cand = new Date(next);
      cand.setUTCDate(dom);
      if (cand <= base) cand.setUTCMonth(cand.getUTCMonth() + (cfg.months_interval ?? 3));
      return cand;
    }
    case "custom":
    default:
      return null;
  }
  // Note: `timezone` is accepted for API compatibility; callers should pass
  // pre-adjusted absolute ISO strings when strict TZ math is required.
  void timezone;
}

// Holiday/festival awareness — pluggable calendar; return true to skip a day.
const BLOCKED_DAYS = new Set<string>([]); // "YYYY-MM-DD" (UTC)
export function isBlockedDay(d: Date): boolean {
  return BLOCKED_DAYS.has(d.toISOString().slice(0, 10));
}
export function registerBlockedDays(days: string[]) {
  days.forEach((x) => BLOCKED_DAYS.add(x));
}
