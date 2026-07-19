import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EmailBrandingManager } from "@/components/email/email-branding-manager";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { buildPageHead } from "@/lib/seo-head";

const getMyBrandId = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("partner_brand_profiles")
      .select("id, brand_name")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data as { id: string; brand_name: string | null } | null;
  });

export const Route = createFileRoute("/_authenticated/brand/email-branding")({
  ssr: false,
  head: () => buildPageHead({
    path: "/brand/email-branding",
    title: "Email Branding — Glintr",
    description: "Customize the header, footer, logos, and colors of every email your brand sends.",
    noindex: true,
  }),
  component: BrandEmailBrandingPage,
});

function BrandEmailBrandingPage() {
  const fetchBrand = useServerFn(getMyBrandId);
  const brandQ = useQuery({ queryKey: ["my-brand-id"], queryFn: () => fetchBrand() });
  const brand = brandQ.data;

  return (
    <>
      <BrandPageHeader
        eyebrow="Branding"
        title="Email branding"
        description="Customize logos, colors, footers, and partner logo strips across every email."
      />
      <BrandBody>
        <GlassCard>
          {brandQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your brand…</p>
          ) : !brand ? (
            <p className="text-sm text-muted-foreground">
              No brand profile found. Complete brand setup first to customize email branding.
            </p>
          ) : (
            <EmailBrandingManager
              brandId={brand.id}
              scopeLabel={brand.brand_name ?? "Your brand"}
            />
          )}
        </GlassCard>
      </BrandBody>
    </>
  );
}
