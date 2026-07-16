import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Book, Video, LifeBuoy, MessageCircle } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/support")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/support", title: "Support Center — Glintr", noindex: true }),
  component: Support,
});

function Support() {
  const [s, setS] = useState(loadState());
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  return (
    <>
      <BrandPageHeader eyebrow="Workspace" title="Support center" description="Knowledge base, tickets, and live chat with the Glintr team." />
      <BrandBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile icon={Book} label="Knowledge base" hint="Guides, how-tos, and FAQs" />
          <Tile icon={Video} label="Video tutorials" hint="Watch step-by-step videos" />
          <Tile icon={MessageCircle} label="Live chat" hint="Chat with a Glintr specialist" />
          <Tile icon={LifeBuoy} label="Documentation" hint="Full platform docs" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Your tickets</h3>
            <div className="space-y-2">
              {s.tickets.map((t) => (
                <div key={t.id} className="rounded-lg border p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{t.subject}</div>
                    <div className="text-xs text-muted-foreground">{t.category} · {new Date(t.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] capitalize ${
                    t.status === "open" ? "bg-amber-50 text-amber-700" : t.status === "resolved" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Open a ticket</h3>
            <div className="space-y-2">
              <Input placeholder="Subject" />
              <Textarea rows={4} placeholder="Describe your issue…" />
              <Button className="w-full">Submit ticket</Button>
            </div>
          </GlassCard>
        </div>
      </BrandBody>
    </>
  );
}

function Tile({ icon: Icon, label, hint }: { icon: any; label: string; hint: string }) {
  return (
    <GlassCard className="hover:border-primary/30 cursor-pointer">
      <div className="rounded-lg bg-primary/10 p-2.5 w-fit"><Icon className="size-5 text-primary" /></div>
      <div className="mt-3 font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </GlassCard>
  );
}
