/**
 * Partner Earnings — Marketing Copy CMS (client surface)
 *
 * This .ts entrypoint intentionally contains no JSX so Vite/TanStack can
 * resolve imports from both SSR and client graphs consistently.
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

export function formatEarningsCopy(template: string): string {
  return template
    .replace(/\{share\}/g, String(partnerEarningsCopy.primarySharePct))
    .replace(/\{supported\}/g, String(partnerEarningsCopy.supportedSharePct));
}

const PartnerEarningsCopyContext = React.createContext<PartnerEarningsCopy>(
  partnerEarningsCopy,
);

export function usePartnerEarningsCopy(): PartnerEarningsCopy {
  return React.useContext(PartnerEarningsCopyContext);
}

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

  return React.createElement(
    PartnerEarningsCopyContext.Provider,
    { value },
    children,
  );
}