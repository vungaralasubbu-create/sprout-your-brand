import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPartnerContext } from "@/lib/partner/dashboard.functions";

const OPT_IN_KEY = "glintr.partner.academy.optin";

/**
 * Gate any Academy-only surface (Academy Builder, Business OS, Brand Profile).
 * Partners must explicitly opt in via /partner/launch-academy first, unless
 * they already have a brand profile (auto-enabled).
 */
export function AcademyGate({ children }: { children: ReactNode }) {
  const fetchCtx = useServerFn(getPartnerContext);
  const { data, isLoading } = useQuery({ queryKey: ["partner-context"], queryFn: () => fetchCtx() });
  const [optIn, setOptIn] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setOptIn(localStorage.getItem(OPT_IN_KEY) === "1");
    } catch {
      setOptIn(false);
    }
  }, []);

  if (isLoading || optIn === null) {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  }

  const enabled = optIn || !!data?.hasBrandProfile;
  if (enabled) return <>{children}</>;

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-10">
      <div className="rounded-2xl border bg-white p-8 text-center">
        <div className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
          <GraduationCap className="size-6" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Academy Builder is an optional upgrade
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sales Partners and Assisted Sales Partners don't need this. If you want to launch your
          own education brand — website, courses, marketing, AI employees — enable Academy Builder first.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={() => navigate({ to: "/partner/launch-academy" })} className="gap-2">
            Explore Academy Builder <ArrowRight className="size-4" />
          </Button>
          <Link to="/partner/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
