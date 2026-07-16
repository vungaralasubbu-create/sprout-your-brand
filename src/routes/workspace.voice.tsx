import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { buildPageHead } from "@/lib/seo-head";
import { Mic, History, Settings, Home } from "lucide-react";

const NAV = [
  { to: "/workspace/voice", label: "Voice Home", icon: Home, exact: true },
  { to: "/workspace/voice/history", label: "History", icon: History },
  { to: "/workspace/voice/settings", label: "Settings", icon: Settings },
];

function VoiceShell() {
  const { pathname } = useLocation();
  const active = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Mic className="h-3 w-3" /> Voice AI
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Talk to Glintr</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A premium voice companion for learning, revision, interviews and sales practice.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-card/70 p-1 backdrop-blur">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                active(to, exact) ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/workspace/voice")({
  head: () =>
    buildPageHead({
      path: "/workspace/voice",
      title: "Voice AI — Talk to Glintr",
      description:
        "Premium voice conversations for learning, revision, mock interviews, presentation and sales practice.",
      noindex: true,
    }),
  component: VoiceShell,
});
