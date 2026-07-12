import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitCounsellorLead } from "@/lib/leads/counsellor.functions";

export type CounsellorContext = {
  course_id?: string | null;
  course_name?: string | null;
  category_name?: string | null;
};

type Props = {
  trigger?: React.ReactNode;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  context?: CounsellorContext;
};

const CONTACT_TIMES = [
  "Morning (9 AM – 12 PM)",
  "Afternoon (12 PM – 4 PM)",
  "Evening (4 PM – 8 PM)",
  "Anytime",
];

function readReferral() {
  if (typeof window === "undefined") return { code: null as string | null, session: null as string | null };
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("ref") ?? sessionStorage.getItem("glintr_ref");
    const session = sessionStorage.getItem("glintr_sid");
    return { code: code || null, session: session || null };
  } catch {
    return { code: null, session: null };
  }
}

export function CounsellorForm({
  trigger,
  label = "Talk To A Counsellor",
  variant = "outline",
  size = "lg",
  className,
  context,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openedAt, setOpenedAt] = useState<number>(0);
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [consent, setConsent] = useState(false);
  const submitFn = useServerFn(submitCounsellorLead);

  useEffect(() => {
    if (open) {
      setOpenedAt(Date.now());
      setSuccess(false);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      toast.error("Please agree to be contacted.");
      return;
    }
    // Basic spam guard: instant submission is almost certainly a bot.
    if (Date.now() - openedAt < 1500) {
      toast.error("Please review the form before submitting.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const referral = readReferral();
    setLoading(true);
    try {
      const res = await submitFn({
        data: {
          full_name: String(fd.get("full_name") ?? ""),
          mobile: String(fd.get("mobile") ?? ""),
          email: (fd.get("email") as string) || null,
          city: (fd.get("city") as string) || null,
          program_interest: (fd.get("program_interest") as string) || null,
          preferred_contact_time: preferredTime || null,
          course_id: context?.course_id ?? null,
          course_name: context?.course_name ?? null,
          category_name: context?.category_name ?? null,
          partner_code: referral.code,
          referral_session: referral.session,
          consent: true,
          website: String(fd.get("website") ?? ""),
        },
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={variant} size={size} className={className}>
            <Phone className="size-4" />
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {success ? (
          <div className="py-4 text-center">
            <div className="mx-auto size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Phone className="size-5" />
            </div>
            <DialogHeader className="mt-4">
              <DialogTitle className="text-center">Thank You.</DialogTitle>
              <DialogDescription className="text-center">
                A Glintr team member will contact you regarding your program enquiry.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Button onClick={() => setOpen(false)} className="w-full">Close</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Talk To A Counsellor</DialogTitle>
              <DialogDescription>
                Share a few details and a Glintr counsellor will call you back.
                {context?.course_name ? (
                  <span className="block mt-1 text-primary">
                    Enquiring about: <strong className="text-foreground">{context.course_name}</strong>
                  </span>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <div>
                <Label htmlFor="c-full-name">Full Name *</Label>
                <Input id="c-full-name" name="full_name" required maxLength={120} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="c-mobile">Mobile Number *</Label>
                  <Input id="c-mobile" name="mobile" type="tel" required maxLength={20} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" name="email" type="email" maxLength={255} className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="c-city">City</Label>
                  <Input id="c-city" name="city" maxLength={80} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="c-time">Preferred Contact Time</Label>
                  <Select value={preferredTime} onValueChange={setPreferredTime}>
                    <SelectTrigger id="c-time" className="mt-1.5">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TIMES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="c-program">Program Interested</Label>
                <Textarea
                  id="c-program"
                  name="program_interest"
                  maxLength={200}
                  rows={2}
                  defaultValue={context?.course_name ?? ""}
                  placeholder="Which program are you interested in?"
                  className="mt-1.5"
                />
              </div>
              <label className="flex items-start gap-2 text-caption text-muted-foreground">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5"
                />
                <span>
                  I agree to be contacted by Glintr regarding my program enquiry over call, WhatsApp or email.
                </span>
              </label>
              <Button type="submit" size="lg" variant="gradient" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Request A Call"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
