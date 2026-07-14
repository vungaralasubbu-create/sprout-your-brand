import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Award } from "lucide-react";

type Variant = "course" | "internship";

const LOGO_URL =
  "https://cdn.jsdelivr.net/gh/glintr-assets/brand@main/glintr-logo-dark.svg";

function makeId(courseName: string, variant: Variant) {
  const slug = courseName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6) || "GLNTR";
  const prefix = variant === "course" ? "GLC" : "GLI";
  const rand = Math.abs(
    Array.from(courseName).reduce((a, ch) => a + ch.charCodeAt(0), 0),
  );
  return `${prefix}-${slug}-${(1000 + (rand % 9000)).toString()}`;
}

function CertificateArt({
  courseName,
  variant,
  compact = false,
}: {
  courseName: string;
  variant: Variant;
  compact?: boolean;
}) {
  const isInternship = variant === "internship";
  const wave = isInternship
    ? { from: "#0BB4A3", via: "#14D3B8", to: "#7CE9C6" }
    : { from: "#1E5FCF", via: "#2E7FE5", to: "#7CB8FF" };
  const ribbon = isInternship ? "#0BB4A3" : "#1E5FCF";
  const subtitle = isInternship ? "OF INTERNSHIP COMPLETION" : "OF COURSE COMPLETION";
  const programLabel = isInternship
    ? `${courseName.toUpperCase()} INTERNSHIP`
    : `${courseName.toUpperCase()} PROGRAM`;
  const bodyText = isInternship
    ? `has successfully completed the ${courseName} Internship at Glintr, completing practical projects and applying relevant skills through industry-focused learning activities.`
    : `has successfully completed the ${courseName} Program offered by Glintr, covering structured learning, practical projects and applicable program requirements.`;
  const certId = makeId(courseName, variant);

  return (
    <div
      className="relative w-full aspect-[1.414/1] bg-white rounded-xl overflow-hidden shadow-[0_10px_40px_-8px_rgba(15,23,42,0.25)] ring-1 ring-black/5"
      role="img"
      aria-label={`${courseName} ${isInternship ? "internship" : "course"} completion certificate sample`}
    >
      {/* Wave header */}
      <svg
        viewBox="0 0 800 220"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-[32%] w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`w-${variant}-${certId}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={wave.from} />
            <stop offset="55%" stopColor={wave.via} />
            <stop offset="100%" stopColor={wave.to} />
          </linearGradient>
        </defs>
        <path
          d="M0,0 L800,0 L800,120 C650,200 500,60 350,140 C220,210 100,120 0,180 Z"
          fill={`url(#w-${variant}-${certId})`}
        />
        <path
          d="M0,0 L800,0 L800,90 C640,160 480,40 340,110 C210,175 100,90 0,140 Z"
          fill="white"
          opacity="0.18"
        />
      </svg>

      {/* Top bar: logo + cert id */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-[4%] pt-[3%] z-10">
        <div className="flex items-center gap-2">
          <img
            src={LOGO_URL}
            alt="Glintr"
            className="h-[clamp(14px,2.4cqw,26px)] w-auto brightness-0 invert"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span
            className="font-display font-bold text-white tracking-tight"
            style={{ fontSize: "clamp(11px, 2cqw, 18px)" }}
          >
            Glintr
          </span>
        </div>
        <div
          className="text-white/90 font-mono tracking-wider"
          style={{ fontSize: "clamp(7px, 1.2cqw, 11px)" }}
        >
          ID: {certId}
        </div>
      </div>

      {/* Diagonal SAMPLE watermark */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
      >
        <span
          className="font-display font-black tracking-[0.3em] text-black/[0.05] rotate-[-22deg] select-none whitespace-nowrap"
          style={{ fontSize: "clamp(48px, 12cqw, 140px)" }}
        >
          SAMPLE
        </span>
      </div>

      {/* Body */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[6%] pt-[10%] pb-[8%]">
        <div
          className="font-display font-bold tracking-[0.18em] text-slate-900"
          style={{ fontSize: "clamp(18px, 4.6cqw, 44px)", lineHeight: 1 }}
        >
          CERTIFICATE
        </div>
        <div
          className="mt-1 font-mono tracking-[0.32em] text-slate-500"
          style={{ fontSize: "clamp(8px, 1.5cqw, 13px)" }}
        >
          {subtitle}
        </div>

        <div
          className="mt-[3%] uppercase tracking-[0.28em] text-slate-500"
          style={{ fontSize: "clamp(7px, 1.1cqw, 10px)" }}
        >
          This is to certify that
        </div>

        <div
          className="mt-[1.5%] font-serif italic text-slate-900"
          style={{ fontSize: "clamp(20px, 4.2cqw, 40px)", lineHeight: 1.1 }}
        >
          Sample Learner
        </div>

        <div
          className="mt-[2%] max-w-[86%] text-slate-600 leading-snug"
          style={{ fontSize: "clamp(8px, 1.35cqw, 12px)" }}
        >
          {bodyText}
        </div>

        <div
          className="mt-[2%] font-display font-bold tracking-wide"
          style={{
            fontSize: "clamp(11px, 2.2cqw, 20px)",
            color: ribbon,
          }}
        >
          {programLabel}
        </div>
      </div>

      {/* Footer: signatures + seal */}
      <div className="absolute inset-x-0 bottom-0 px-[6%] pb-[4%] flex items-end justify-between">
        <div className="text-center">
          <div
            className="border-t border-slate-400/70 pt-1 text-slate-700"
            style={{ fontSize: "clamp(7px, 1.1cqw, 10px)", minWidth: "22%" }}
          >
            <div className="font-semibold text-slate-900">Program Director</div>
            <div className="text-slate-500">Glintr</div>
          </div>
        </div>

        <div className="relative">
          <div
            className="rounded-full border-[2px] flex items-center justify-center bg-white text-center"
            style={{
              width: "clamp(38px, 7cqw, 72px)",
              height: "clamp(38px, 7cqw, 72px)",
              borderColor: ribbon,
              color: ribbon,
            }}
          >
            <div
              className="font-display font-bold leading-none"
              style={{ fontSize: "clamp(7px, 1.3cqw, 11px)" }}
            >
              <div className="tracking-widest">GLINTR</div>
              <div className="mt-0.5 tracking-[0.2em]">CERTIFIED</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div
            className="border-t border-slate-400/70 pt-1 text-slate-700"
            style={{ fontSize: "clamp(7px, 1.1cqw, 10px)", minWidth: "22%" }}
          >
            <div className="font-semibold text-slate-900">Head of Learning</div>
            <div className="text-slate-500">Glintr</div>
          </div>
        </div>
      </div>

      {/* container query context */}
      <style>{`
        [role="img"][aria-label$="certificate sample"] { container-type: inline-size; }
      `}</style>
    </div>
  );
}

function CertCard({
  courseName,
  variant,
  onOpen,
}: {
  courseName: string;
  variant: Variant;
  onOpen: () => void;
}) {
  const label =
    variant === "internship" ? "Internship Completion" : "Course Completion";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative text-left w-full transition-transform hover:-translate-y-1"
      aria-label={`Preview ${courseName} ${label} certificate`}
    >
      <div className="rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 shadow-sm group-hover:shadow-lg transition-shadow">
        <CertificateArt courseName={courseName} variant={variant} />
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary">
            {label}
          </div>
          <div className="text-sm font-semibold">
            {courseName} {variant === "internship" ? "Internship" : "Program"}
          </div>
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-primary">
          Click to preview →
        </span>
      </div>
    </button>
  );
}

export function CertificateShowcase({ courseName }: { courseName: string }) {
  const [open, setOpen] = useState<Variant | null>(null);
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        <CertCard courseName={courseName} variant="course" onOpen={() => setOpen("course")} />
        <CertCard
          courseName={courseName}
          variant="internship"
          onOpen={() => setOpen("internship")}
        />
      </div>

      <div className="mt-6 flex items-center gap-2 text-caption text-muted-foreground">
        <Award className="size-4 text-primary" />
        Sample previews. Actual certificates are issued upon successful completion.
      </div>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-5xl p-4 sm:p-6 bg-white">
          <VisuallyHidden>
            <DialogTitle>
              {courseName} {open === "internship" ? "Internship" : "Course"} Certificate Preview
            </DialogTitle>
          </VisuallyHidden>
          {open ? <CertificateArt courseName={courseName} variant={open} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CertificateShowcase;
