import { createFileRoute } from "@tanstack/react-router";
import {
  Wand2,
  Layers,
  Image as ImageIcon,
  Mail,
  Calendar,
  BarChart3,
  Users,
  Shield,
  Zap,
  Palette,
  Share2,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/cloud/features")({
  head: () => ({
    meta: [
      { title: "Features — AI Marketing Cloud" },
      { name: "description", content: "Everything a marketing team needs — automated." },
    ],
  }),
  component: Features,
});

const F = [
  { icon: Wand2, title: "AI Campaign Strategy", body: "Positioning, audience, channels and KPIs drafted for your brand." },
  { icon: Layers, title: "Content at scale", body: "Posts for LinkedIn, X, Instagram, Facebook — always on-brand." },
  { icon: ImageIcon, title: "Creative Studio", body: "AI-generated images and posters matched to your brand kit." },
  { icon: Mail, title: "Email sequences", body: "Full drip campaigns, ready to send from your own domain." },
  { icon: Globe, title: "Landing pages", body: "Conversion-first landing pages with forms, ready to publish." },
  { icon: Calendar, title: "Publishing calendar", body: "Schedule and publish across channels from one place." },
  { icon: BarChart3, title: "Analytics", body: "Attribution, conversions and AI recommendations built in." },
  { icon: Palette, title: "Brand kit", body: "Colors, fonts, voice — captured once and reused everywhere." },
  { icon: Share2, title: "Social integrations", body: "Native OAuth to Instagram, Facebook, LinkedIn and X." },
  { icon: Users, title: "Team roles", body: "Owner, Admin, Editor, Viewer — real access control." },
  { icon: Shield, title: "Enterprise security", body: "SSO, SAML, audit logs and workspace-scoped RLS." },
  { icon: Zap, title: "AI Copilot", body: "Ask for edits and improvements in plain English." },
];

function Features() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Features</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Everything a marketing team needs — automated
        </h1>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {F.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-2xl border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <div className="mt-4 text-lg font-semibold">{f.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
