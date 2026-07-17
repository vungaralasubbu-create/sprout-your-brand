import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export interface SuccessStoryRow {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  company: string;
  company_slug: string | null;
  company_domain: string | null;
  course: string;
  course_category: string | null;
  batch: string | null;
  package_label: string | null;
  package_lpa: number | null;
  location: string | null;
  graduation_year: number | null;
  rating: number;
  quote: string;
  linkedin_url: string | null;
  story_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const PUBLIC_COLUMNS =
  "id,name,avatar_url,role,company,company_slug,company_domain,course,course_category,batch,package_label,package_lpa,location,graduation_year,rating,quote,linkedin_url,story_url,featured,sort_order";

export function useSuccessStories() {
  return useQuery({
    queryKey: ["success-stories", "public"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_stories")
        .select(PUBLIC_COLUMNS)
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SuccessStoryRow[];
    },
  });
}

export function useAdminSuccessStories() {
  return useQuery({
    queryKey: ["success-stories", "admin"],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SuccessStoryRow[];
    },
  });
}

export function initialsAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name || "Glintr Learner");
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundType=gradientLinear&backgroundColor=0284c7,0ea5e9&fontFamily=Inter&fontWeight=600&radius=50`;
}
