import * as React from "react";
import { simpleIconUrl, faviconUrl, type HiringPartner } from "@/data/hiring-partners";

/**
 * Renders a company logo with graceful fallback:
 *   SimpleIcons SVG → DuckDuckGo favicon → text initials.
 */
export function BrandLogo({ partner }: { partner: HiringPartner }) {
  const [stage, setStage] = React.useState<0 | 1 | 2>(partner.slug ? 0 : partner.domain ? 1 : 2);

  const src =
    stage === 0 && partner.slug
      ? simpleIconUrl(partner.slug)
      : stage === 1 && partner.domain
        ? faviconUrl(partner.domain)
        : null;

  if (src) {
    return (
      <img
        src={src}
        alt={`${partner.name} logo`}
        loading="lazy"
        decoding="async"
        width={96}
        height={40}
        className="max-h-8 lg:max-h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 dark:brightness-110"
        onError={() => setStage((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : 2))}
      />
    );
  }

  return (
    <span className="font-display font-semibold text-sm lg:text-[15px] tracking-tight text-foreground/85 text-center px-1">
      {partner.name}
    </span>
  );
}
