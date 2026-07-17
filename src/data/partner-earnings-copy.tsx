/**
 * Partner Earnings — Marketing Copy CMS (client surface)
 *
 * SINGLE SOURCE OF TRUTH for every partner-earning marketing string on the
 * public site. Editors update strings from `/admin/marketing-copy`; the
 * change propagates to every consumer via the exported `partnerEarningsCopy`
 * live mirror below.
 *
 * How the "live mirror" works:
 *   - `partnerEarningsCopy` is a real object whose fields are mutated in
 *     place when the CMS fetch resolves.
 *   - `<PartnerEarningsCopyProvider>` fetches the DB value once per session,
 *     mutates the mirror, and bumps an internal key so the whole app subtree
 *     re-renders with the fresh values.
 *   - Existing consumers that `import { partnerEarningsCopy }` DO NOT need
 *     to change — they will read the mutated fields on the next render.
 *
 * Editorial rules:
 *   1. The primary revenue share number is one value (default 70).
 *   2. Every earning CTA is one of: cta.primary, cta.short, cta.apply.
 *   3. "Supported model" (50%) copy only appears in comparison contexts.
 *   4. Copy tokens interpolate `{share}` and `{supported}` so a percentage
 *      change ripples through every surface at once.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  DEFAULT_PARTNER_EARNINGS_COPY,
  resolvePartnerEarningsCopy,
  type PartnerEarningsCopy,
} from "./partner-earnings-copy-schema";
import { fetchPartnerEarningsCopy } from "@/lib/partner-earnings-copy.functions";

export type { PartnerEarningsCopy } from "./partner-earnings-copy-schema";
export {
  DEFAULT_PARTNER_EARNINGS_COPY,
  PARTNER_EARNINGS_COPY_KEY,
  partnerEarningsCopySchema,
  interpolatePartnerEarningsCopy,
  resolvePartnerEarningsCopy,
} from "./partner-earnings-copy-schema";

// ---------- Live mirror ----------
// A single object whose fields are overwritten in place when the CMS fetch
// resolves. Consumers keep their existing `import { partnerEarningsCopy }`
// and pick up new values on the next render (provider forces a subtree
// re-render via `key` so this happens for the whole app after fetch).

const initial = resolvePartnerEarningsCopy(DEFAULT_PARTNER_EARNINGS_COPY);

export const partnerEarningsCopy: PartnerEarningsCopy = {
  primarySharePct: initial.primarySharePct,
  supportedSharePct: initial.supportedSharePct,
  cta: { ...initial.cta },
  labels: { ...initial.labels },
  taglines: { ...initial.taglines },
};

function applyToMirror(next: PartnerEarningsCopy) {
  const resolved = resolvePartnerEarningsCopy(next);
  partnerEarningsCopy.primarySharePct = resolved.primarySharePct;
  partnerEarningsCopy.supportedSharePct = resolved.supportedSharePct;
  Object.assign(partnerEarningsCopy.cta, resolved.cta);
  Object.assign(partnerEarningsCopy.labels, resolved.labels);
  Object.assign(partnerEarningsCopy.taglines, resolved.taglines);
}

/** Convenience: interpolate any template string using the active copy. */
export function formatEarningsCopy(template: string): string {
  return template
    .replace(/\{share\}/g, String(partnerEarningsCopy.primarySharePct))
    .replace(/\{supported\}/g, String(partnerEarningsCopy.supportedSharePct));
}

// ---------- Provider + hook ----------

const PartnerEarningsCopyContext = React.createContext<PartnerEarningsCopy>(
  partnerEarningsCopy,
);

export function usePartnerEarningsCopy(): PartnerEarningsCopy {
  return React.useContext(PartnerEarningsCopyContext);
}

/**
 * Loads the DB-backed copy once and mirrors it into the exported singleton.
 * Wrap the app once in `__root.tsx`.
 */
export function PartnerEarningsCopyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetcher = useServerFn(fetchPartnerEarningsCopy);
  const query = useQuery({
    queryKey: ["marketing", "partner_earnings_copy"],
    queryFn: () => fetcher(),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [, force] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    if (query.data) {
      applyToMirror(query.data);
      force();
    }
  }, [query.data]);

  const value = React.useMemo(() => {
    const source = query.data ?? DEFAULT_PARTNER_EARNINGS_COPY;
    return resolvePartnerEarningsCopy(source);
  }, [query.data]);

  return (
    <PartnerEarningsCopyContext.Provider value={value}>
      {children}
    </PartnerEarningsCopyContext.Provider>
  );
}
