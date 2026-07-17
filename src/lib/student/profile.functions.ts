import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StudentProfile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  city: string | null;
  state: string | null;
  learner_type: "student" | "working_professional";
  education: string | null;
  graduation_year: number | null;
  current_role_title: string | null;
  work_experience: string | null;
  preferred_mode: string | null;
  onboarded_at: string | null;
};

export const getMyStudentProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("student_profiles")
      .select(
        "user_id, full_name, email, mobile, city, state, learner_type, education, graduation_year, current_role_title, work_experience, preferred_mode, onboarded_at",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as StudentProfile | null;
  });

const upsertSchema = z.object({
  full_name: z.string().trim().min(1).max(120).optional(),
  mobile: z.string().trim().min(6).max(20).optional(),
  email: z.string().trim().email().max(255).optional(),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state: z.string().trim().max(120).optional().or(z.literal("")),
  learner_type: z.enum(["student", "working_professional"]).optional(),
  education: z.string().trim().max(200).optional().or(z.literal("")),
  graduation_year: z.number().int().min(1970).max(2100).nullable().optional(),
  current_role_title: z.string().trim().max(200).optional().or(z.literal("")),
  work_experience: z.string().trim().max(1000).optional().or(z.literal("")),
  preferred_mode: z.string().trim().max(40).optional().or(z.literal("")),
  mark_onboarded: z.boolean().optional(),
});

export const upsertMyStudentProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = { user_id: userId };
    for (const [k, v] of Object.entries(data)) {
      if (k === "mark_onboarded") continue;
      if (v === undefined) continue;
      patch[k] = v === "" ? null : v;
    }
    if (data.mark_onboarded) patch.onboarded_at = new Date().toISOString();
    const { data: saved, error } = await supabase
      .from("student_profiles")
      .upsert(patch as any, { onConflict: "user_id" })
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return saved as StudentProfile;
  });
