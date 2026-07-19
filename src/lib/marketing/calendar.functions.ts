/**
 * Marketing calendar — seeds tech days, festivals, hiring seasons, and
 * launch/event slots into mkt_calendar_events. Reads events per month.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { MktContentType } from "./types";

// Curated seed of recurring dates (month-day, category, title, suggested type).
const SEEDS: Array<{ md: string; category: string; title: string; type: MktContentType }> = [
  { md: "01-01", category: "festival", title: "New Year — Skill Reset", type: "learning_tip" },
  { md: "01-26", category: "festival", title: "Republic Day (India)", type: "career_tip" },
  { md: "02-11", category: "tech_day", title: "International Day of Women & Girls in Science", type: "success_story" },
  { md: "03-08", category: "tech_day", title: "International Women's Day", type: "success_story" },
  { md: "03-14", category: "tech_day", title: "Pi Day", type: "learning_tip" },
  { md: "04-22", category: "tech_day", title: "Earth Day — Green Tech", type: "tech_news" },
  { md: "05-01", category: "hiring_season", title: "May Hiring Wave", type: "hiring_update" },
  { md: "05-25", category: "tech_day", title: "Towel Day / Developer Fun", type: "ai_news" },
  { md: "06-05", category: "tech_day", title: "World Environment Day", type: "tech_news" },
  { md: "06-15", category: "hiring_season", title: "Summer Internship Peak", type: "internship" },
  { md: "07-30", category: "tech_day", title: "System Administrator Appreciation Day", type: "career_tip" },
  { md: "08-15", category: "festival", title: "Independence Day (India)", type: "career_tip" },
  { md: "09-05", category: "festival", title: "Teachers' Day", type: "success_story" },
  { md: "09-13", category: "tech_day", title: "Programmer's Day", type: "learning_tip" },
  { md: "10-01", category: "hiring_season", title: "Q4 Hiring Surge", type: "hiring_update" },
  { md: "10-24", category: "tech_day", title: "United Nations Day", type: "tech_news" },
  { md: "11-01", category: "festival", title: "Diwali Season Campaign", type: "discount_campaign" },
  { md: "11-30", category: "tech_day", title: "Cyber Monday", type: "discount_campaign" },
  { md: "12-04", category: "tech_day", title: "Computer Science Education Week", type: "learning_tip" },
  { md: "12-10", category: "tech_day", title: "Human Rights & Ethical AI", type: "ai_news" },
  { md: "12-25", category: "festival", title: "Year-End Learning Push", type: "webinar" },
];

/** Seed the global calendar for the current + next year. Idempotent. */
export const seedCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const years = [new Date().getUTCFullYear(), new Date().getUTCFullYear() + 1];
    const rows = SEEDS.flatMap((s) => years.map((y) => ({
      brand_id: null,
      event_date: `${y}-${s.md}`,
      category: s.category,
      title: s.title,
      description: null,
      suggested_type: s.type,
      meta: { seed: true },
    })));
    // Idempotency: delete-then-insert for each (event_date, title) global entry
    for (const r of rows) {
      await supabase.from("mkt_calendar_events")
        .delete().is("brand_id", null).eq("event_date", r.event_date).eq("title", r.title);
    }
    const { error } = await supabase.from("mkt_calendar_events").insert(rows);
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });

export const listCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    brandId: z.string().uuid().optional(),
    from: z.string(),
    to: z.string(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("mkt_calendar_events").select("*").gte("event_date", data.from).lte("event_date", data.to);
    if (data.brandId) q = q.or(`brand_id.eq.${data.brandId},brand_id.is.null`);
    const { data: rows, error } = await q.order("event_date");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
