import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Megaphone, Mail, MessageCircle, Bell, MessageSquare } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/communications")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/communications", title: "Communications — Glintr", description: "White Label OS", noindex: true }),
  component: Communications,
});

const TABS = [
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "email", label: "Email templates", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "push", label: "Push", icon: Bell },
] as const;

function Communications() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("announcements");
  return (
    <>
      <BrandPageHeader eyebrow="Growth" title="Communication center" description="Announcements, email, SMS, WhatsApp, and push — all in one place." />
      <BrandBody>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${tab === t.id ? "bg-primary text-white border-primary" : "bg-white"}`}>
              <t.icon className="size-3.5" />{t.label}
            </button>
          ))}
        </div>

        <GlassCard>
          {tab === "announcements" && (
            <div className="space-y-3">
              <h3 className="font-display font-semibold">Post an announcement</h3>
              <Input placeholder="Title" />
              <Textarea rows={4} placeholder="Enrollment opens Monday for the winter cohort…" />
              <div className="flex gap-2"><Button>Publish</Button><Button variant="outline">Save draft</Button></div>
            </div>
          )}
          {tab === "email" && <TemplateGrid kind="Email" />}
          {tab === "sms" && <TemplateGrid kind="SMS" />}
          {tab === "whatsapp" && <TemplateGrid kind="WhatsApp" />}
          {tab === "push" && <TemplateGrid kind="Push" />}
        </GlassCard>
      </BrandBody>
    </>
  );
}

function TemplateGrid({ kind }: { kind: string }) {
  const items = [
    "Welcome new student", "Course starts today", "Assignment reminder", "Certificate issued",
    "Payment received", "Payment failed", "Cohort announcement", "Feedback request",
  ];
  return (
    <div>
      <h3 className="font-display font-semibold mb-3">{kind} templates</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <div key={t} className="rounded-lg border bg-white p-4">
            <div className="font-medium text-sm">{t}</div>
            <div className="text-xs text-muted-foreground mt-1">Editable {kind.toLowerCase()} template.</div>
            <button className="mt-3 text-xs text-primary hover:underline">Edit template →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
