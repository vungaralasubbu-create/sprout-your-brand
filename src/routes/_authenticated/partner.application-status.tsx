import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

import { Section, Container } from "@/components/shared/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPartnerSignupState } from "@/lib/partner/signup.functions";

export const Route = createFileRoute("/_authenticated/partner/application-status")({
  head: () => ({ meta: [{ title: "Application status — Glintr" }, { name: "robots", content: "noindex" }] }),
  component: ApplicationStatus,
});

function ApplicationStatus() {
  const navigate = useNavigate();
  const fn = useServerFn(getPartnerSignupState);
  const { data, isLoading } = useQuery({
    queryKey: ["partner-signup-state"],
    queryFn: () => fn(),
    refetchOnWindowFocus: true,
  });

  React.useEffect(() => {
    if (data?.partner?.account_status === "active") {
      navigate({ to: "/partner/dashboard" as any });
    }
  }, [data, navigate]);

  if (isLoading) return null;

  const status = data?.partner?.account_status ?? "onboarding";
  const notes = data?.application?.admin_notes as string | undefined;

  type View = { icon: React.ReactNode; color: string; title: string; body: string };
  const views: Record<string, View> = {
    pending_review: {
      icon: <Clock className="h-6 w-6" />,
      color: "bg-sky-50 text-sky-700 border-sky-200",
      title: "Application Received",
      body: "Your Sales Partner profile has been submitted for review. We'll notify you as soon as it's approved.",
    },
    needs_information: {
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "bg-amber-50 text-amber-800 border-amber-200",
      title: "More Information Needed",
      body: notes || "Our team has requested additional details on your application.",
    },
    rejected: {
      icon: <XCircle className="h-6 w-6" />,
      color: "bg-rose-50 text-rose-700 border-rose-200",
      title: "Application Not Approved",
      body: notes || "Unfortunately your application was not approved at this time.",
    },
    onboarding: {
      icon: <Clock className="h-6 w-6" />,
      color: "bg-muted text-foreground border-border",
      title: "Onboarding in progress",
      body: "Finish the quick onboarding to submit your application.",
    },
    active: {
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "You're all set",
      body: "Redirecting to your dashboard…",
    },
    suspended: {
      icon: <XCircle className="h-6 w-6" />,
      color: "bg-slate-100 text-slate-700 border-slate-200",
      title: "Account Suspended",
      body: notes || "Your account is currently suspended. Please contact support.",
    },
  };
  const view: View = views[status] ?? {
    icon: <Clock className="h-6 w-6" />,
    color: "bg-muted text-foreground border-border",
    title: "Application status",
    body: "",
  };


  return (
    <Section padding="lg">
      <Container size="sm">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${view.color}`}>
              {view.icon}
            </div>
            <Badge variant="info">Sales Partner</Badge>
            <h1 className="text-section">{view.title}</h1>
            <p className="text-muted-foreground max-w-md mx-auto">{view.body}</p>

            {status === "onboarding" && (
              <Button variant="gradient" onClick={() => navigate({ to: "/partner/quick-start" as any })}>
                Continue onboarding
              </Button>
            )}
            {(status === "needs_information" || status === "rejected") && (
              <Button variant="outline" onClick={() => navigate({ to: "/partner/quick-start" as any })}>
                Update details
              </Button>
            )}

            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
