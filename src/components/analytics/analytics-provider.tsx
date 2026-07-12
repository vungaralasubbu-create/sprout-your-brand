import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSettings } from "@/lib/analytics/settings.functions";
import { loadAnalytics } from "@/lib/analytics/client";

export function AnalyticsProvider() {
  const { data } = useQuery({
    queryKey: ["analytics-settings"],
    queryFn: () => getAnalyticsSettings(),
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!data) return;
    if (!data.ga4_id && !data.gtm_id && !data.meta_pixel_id && !data.google_ads_id) return;
    loadAnalytics(data);
  }, [data]);

  return null;
}
