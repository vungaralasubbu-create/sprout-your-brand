import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export const Route = createFileRoute("/cloud/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AI Marketing Cloud" },
      { name: "description", content: "Talk to our team about pricing, security, or a demo." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sending, setSending] = useState(false);
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Let's talk about your goals
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Whether you're evaluating pricing, security, or want a live demo — our team can help.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary" /> hello@aimarketing.cloud
            </li>
            <li className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-primary" /> In-app chat during business hours
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary" /> Bengaluru · San Francisco · London
            </li>
          </ul>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => {
              setSending(false);
              toast.success("Thanks — we'll be in touch shortly.");
              (e.target as HTMLFormElement).reset();
            }, 700);
          }}
          className="rounded-2xl border bg-card p-6 sm:p-8"
        >
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="msg">How can we help?</Label>
              <Textarea id="msg" rows={4} required className="mt-2" />
            </div>
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
