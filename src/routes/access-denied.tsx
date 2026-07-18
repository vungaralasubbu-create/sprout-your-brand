import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { z } from "zod";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";

const search = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const Route = createFileRoute("/access-denied")({
  head: () => ({
    meta: [
      { title: "Access denied — Glintr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (raw) => search.parse(raw),
  component: AccessDeniedPage,
});

const AREA_LABEL: Record<string, string> = {
  student: "Student LMS",
  partner: "Partner Dashboard",
  brand: "Brand Owner Dashboard",
  instructor: "Instructor Portal",
  admin: "Admin Dashboard",
  counsellor: "Counsellor Copilot",
  ambassador: "Campus Ambassador",
};

function AccessDeniedPage() {
  const { from, to } = useSearch({ from: "/access-denied" });
  const areaLabel = from ? AREA_LABEL[from] ?? from : "this workspace";
  const target = to && to.startsWith("/") ? to : "/";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-8" />
        </div>
        <p className="text-label mb-3 text-destructive">Access denied</p>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          You don't have permission to open the {areaLabel}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg">
          Your account role isn't authorised for this area. You've been redirected here from a page
          reserved for a different workspace. Head back to your own dashboard to continue.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to={target as any}>Go to your dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/">Return home</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-6 text-xs">
          If you believe this is a mistake,{" "}
          <Link to="/contact" className="underline underline-offset-4">
            contact support
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
