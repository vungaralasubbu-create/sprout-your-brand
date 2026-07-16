import * as React from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { LearnShell } from "@/components/learn/learn-shell";

export const Route = createFileRoute("/learn")({
  component: LearnLayout,
});

function LearnLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <LearnShell>
        <Outlet />
      </LearnShell>
      <SiteFooter />
    </div>
  );
}
