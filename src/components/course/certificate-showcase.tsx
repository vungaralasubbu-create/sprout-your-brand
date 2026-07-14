import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Calendar, Clock, BarChart3, Award, Briefcase } from "lucide-react";
import glintrLogo from "@/assets/glintr-logo.png.asset.json";

type Variant = "course" | "internship";

function makeId(courseName: string, variant: Variant) {
  const slug =
    courseName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 6) || "GLNTR";
  const code = variant === "course" ? "CC" : "IN";
  const seed = Math.abs(
    Array.from(courseName).reduce((a, ch) => a + ch.charCodeAt(0), 0),
  );
  const num = String(1 + (seed % 999)).padStart(3, "0");
  return `GLNTR-${code}-${slug}-2024-${num}`;
}

/* --- wave art --- */
function HeaderWave({ palette }: { palette: { a: string; b: string; c: string } }) {
  return (
    <svg
      viewBox="0 0 800 260"
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-0 h-[26%] w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`hw-${palette.a}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={palette.a} />
          <stop offset="55%" stopColor={palette.b} />
          <stop offset="100%" stopColor={palette.c} />
        </linearGradient>
      </defs>
      {/* faint fine lines */}
      {Array.from({ length: 14 }).map((_, i) => (
        <path
          key={i}
          d={`M0,${20 + i * 6} C200,${-10 + i * 4} 420,${140 + i * 3} 800,${40 + i * 5}`}
          fill="none"
          stroke={palette.b}
          strokeOpacity={0.12 - i * 0.005}
          strokeWidth="1"
        />
      ))}
      {/* solid wave */}
      <path
        d="M280,0 L800,0 L800,150 C700,220 560,110 440,160 C360,195 320,140 280,120 Z"
        fill={`url(#hw-${palette.a})`}
      />
      <path
        d="M320,0 L800,0 L800,120 C700,180 580,90 460,140 C400,168 360,120 320,100 Z"
        fill="white"
        opacity="0.22"
      />
    </svg>
  );
}

function FooterWave({ palette }: { palette: { a: string; b: string; c: string } }) {
  return (
    <>
      <svg
        viewBox="0 0 800 180"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[14%] w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`fw-${palette.a}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={palette.a} />
            <stop offset="60%" stopColor={palette.b} />
            <stop offset="100%" stopColor={palette.c} />
          </linearGradient>
        </defs>
        <path
          d="M0,120 C160,60 340,180 520,110 C640,68 720,120 800,90 L800,180 L0,180 Z"
          fill={`url(#fw-${palette.a})`}
        />
        <path
          d="M0,140 C180,90 360,170 540,120 C660,90 720,130 800,110 L800,180 L0,180 Z"
          fill="white"
          opacity="0.28"
        />
      </svg>
      {/* halftone dots */}
      <svg
        viewBox="0 0 200 80"
        preserveAspectRatio="xMaxYMax meet"
        className="absolute bottom-[6%] right-[8%] w-[18%] h-auto opacity-70"
        aria-hidden
      >
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 16 }).map((_, c) => {
            const cx = 10 + c * 11;
            const cy = 8 + r * 9;
            const dist = Math.hypot(cx - 180, cy - 70);
            const rad = Math.max(0.4, 2.4 - dist / 60);
            return (
              <circle key={`${r}-${c}`} cx={cx} cy={cy} r={rad} fill={palette.b} />
            );
          }),
        )}
      </svg>
    </>
  );
}

/* --- seal --- */
function Seal({ color }: { color: string }) {
  return (
    <div
      className="relative rounded-full flex items-center justify-center bg-[#0B1220] text-white shadow-lg"
      style={{
        width: "clamp(52px, 11cqw, 108px)",
        height: "clamp(52px, 11cqw, 108px)",
        border: `2px solid ${color}`,
      }}
    >
      {/* ridged outer ring */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        aria-hidden
      >
        {Array.from({ length: 40 }).map((_, i) => {
          const a = (i / 40) * Math.PI * 2;
          const x1 = 50 + Math.cos(a) * 46;
          const y1 = 50 + Math.sin(a) * 46;
          const x2 = 50 + Math.cos(a) * 49;
          const y2 = 50 + Math.sin(a) * 49;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="1.2"
            />
          );
        })}
      </svg>
      <div className="text-center leading-none" style={{ fontSize: "clamp(6px, 1.1cqw, 10px)" }}>
        <div className="font-display font-bold tracking-[0.2em]" style={{ color }}>
          GLINTR
        </div>
        <div className="my-1 font-display font-black" style={{ fontSize: "clamp(11px, 2.4cqw, 22px)" }}>
          g
        </div>
        <div className="font-mono tracking-[0.25em]" style={{ color }}>
          CERTIFIED
        </div>
      </div>
    </div>
  );
}

/* --- Metric block --- */
function Metric({
  Icon,
  primary,
  secondary,
  color,
}: {
  Icon: typeof Calendar;
  primary: string;
  secondary: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="rounded-full border-[1.5px] flex items-center justify-center"
        style={{
          width: "clamp(28px, 5.5cqw, 56px)",
          height: "clamp(28px, 5.5cqw, 56px)",
          borderColor: color,
          color,
        }}
      >
        <Icon style={{ width: "55%", height: "55%" }} strokeWidth={1.8} />
      </div>
      <div
        className="mt-1.5 font-semibold text-slate-900"
        style={{ fontSize: "clamp(8px, 1.5cqw, 13px)" }}
      >
        {primary}
      </div>
      <div
        className="text-slate-500"
        style={{ fontSize: "clamp(7px, 1.1cqw, 10px)" }}
      >
        {secondary}
      </div>
    </div>
  );
}

/* --- Signature block --- */
function Signature({
  role,
  path,
  color,
}: {
  role: string;
  path: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <svg
        viewBox="0 0 140 42"
        className="w-[70%] max-w-[120px] h-auto"
        aria-hidden
      >
        <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <div
        className="w-[80%] border-t border-slate-300 mt-1 pt-1"
        style={{ fontSize: "clamp(7px, 1.2cqw, 11px)" }}
      >
        <div className="font-semibold text-slate-900">{role}</div>
        <div className="text-slate-500">Glintr Learning</div>
      </div>
    </div>
  );
}

const SIG_A = "M6 30 C 16 8, 30 40, 44 20 S 68 6, 82 26 S 108 12, 130 22";
const SIG_B = "M4 28 C 20 10, 34 34, 50 18 S 76 32, 96 16 S 124 30, 134 18";

/* --- Main art --- */
function CertificateArt({
  courseName,
  variant,
}: {
  courseName: string;
  variant: Variant;
}) {
  const isIntern = variant === "internship";
  const palette = isIntern
    ? { a: "#0BB4A3", b: "#14D3B8", c: "#7CE9C6" }
    : { a: "#1E5FCF", b: "#2E7FE5", c: "#7CB8FF" };
  const primaryColor = isIntern ? "#0BB4A3" : "#1E5FCF";
  const nameColor = isIntern ? "#0BB4A3" : "#1E5FCF";
  const subtitle = isIntern ? "OF INTERNSHIP COMPLETION" : "OF COURSE COMPLETION";
  const upperName = courseName.toUpperCase();
  const programLine = isIntern ? `${upperName} INTERNSHIP` : `${upperName} PROGRAM`;
  const bodyText = isIntern
    ? `at Glintr, completing practical projects and applying relevant skills through industry-focused learning activities. We wish them all the best for their future endeavours.`
    : `offered by Glintr, covering structured learning, practical projects and applicable program requirements. We wish them all the best for their future endeavours.`;
  const certId = makeId(courseName, variant);

  return (
    <div
      className="glintr-cert relative w-full bg-white rounded-xl overflow-hidden shadow-[0_18px_50px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5"
      style={{ aspectRatio: "1 / 1.32", containerType: "inline-size" }}
      role="img"
      aria-label={`${courseName} ${isIntern ? "internship" : "course"} completion certificate sample`}
    >
      {/* subtle inner border */}
      <div
        aria-hidden
        className="absolute inset-[2%] rounded-lg border"
        style={{ borderColor: `${primaryColor}33` }}
      />

      <HeaderWave palette={palette} />
      <FooterWave palette={palette} />

      {/* top row: logo + cert id */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-[6%] pt-[5%] z-10">
        <div className="flex items-center gap-2">
          <img
            src={glintrLogo.url}
            alt="Glintr"
            className="w-auto"
            style={{ height: "clamp(22px, 5cqw, 46px)" }}
          />
        </div>
        <div className="text-right leading-tight">
          <div
            className="font-mono tracking-[0.25em] text-slate-500"
            style={{ fontSize: "clamp(6px, 1.1cqw, 10px)" }}
          >
            CERTIFICATE ID
          </div>
          <div
            className="font-mono font-semibold text-slate-900"
            style={{ fontSize: "clamp(7px, 1.35cqw, 12px)" }}
          >
            {certId}
          </div>
        </div>
      </div>

      {/* diagonal SAMPLE watermark */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
      >
        <span
          className="font-display font-black tracking-[0.35em] text-slate-900/[0.06] rotate-[-24deg] select-none whitespace-nowrap"
          style={{ fontSize: "clamp(64px, 16cqw, 200px)" }}
        >
          SAMPLE
        </span>
      </div>

      {/* body */}
      <div
        className="absolute inset-x-0 flex flex-col items-center text-center px-[8%] z-10"
        style={{ top: "24%" }}
      >
        <div
          className="font-display font-black tracking-tight text-slate-900"
          style={{ fontSize: "clamp(22px, 6.8cqw, 68px)", lineHeight: 0.95 }}
        >
          CERTIFICATE
        </div>
        <div
          className="mt-2 font-display font-semibold tracking-[0.28em]"
          style={{ fontSize: "clamp(10px, 2.2cqw, 20px)", color: primaryColor }}
        >
          {subtitle}
        </div>
        {/* small divider with dots */}
        <div className="mt-2 flex items-center gap-2">
          <span className="block h-[1.5px] w-[40px] sm:w-[60px]" style={{ backgroundColor: primaryColor }} />
          <span className="size-1 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span className="size-1 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span className="size-1 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span className="block h-[1.5px] w-[40px] sm:w-[60px]" style={{ backgroundColor: primaryColor }} />
        </div>

        <div
          className="mt-[4%] uppercase tracking-[0.35em] text-slate-500"
          style={{ fontSize: "clamp(7px, 1.3cqw, 11px)" }}
        >
          This is to certify that
        </div>

        <div
          className="mt-[2%] font-serif italic"
          style={{
            fontFamily: '"Great Vibes","Pinyon Script","Dancing Script",cursive',
            fontSize: "clamp(26px, 6.4cqw, 60px)",
            lineHeight: 1.05,
            color: nameColor,
          }}
        >
          Sample Learner
        </div>
        <div
          className="mt-1 h-px w-[55%] max-w-[360px]"
          style={{ backgroundColor: `${primaryColor}66` }}
        />

        <div
          className="mt-[3%] text-slate-600"
          style={{ fontSize: "clamp(8px, 1.5cqw, 13px)" }}
        >
          has successfully completed the
        </div>
        <div
          className="mt-1 font-display font-bold tracking-[0.12em]"
          style={{ fontSize: "clamp(11px, 2.4cqw, 22px)", color: primaryColor }}
        >
          {programLine}
        </div>

        <p
          className="mt-[2.5%] max-w-[86%] text-slate-600 leading-snug"
          style={{ fontSize: "clamp(8px, 1.35cqw, 12px)" }}
        >
          {bodyText}
        </p>
      </div>

      {/* metrics row */}
      <div
        className="absolute inset-x-0 z-10 grid grid-cols-4 gap-2 px-[10%]"
        style={{ bottom: "22%" }}
      >
        <Metric
          Icon={Calendar}
          primary="12th May 2024"
          secondary="Date of Completion"
          color={primaryColor}
        />
        <Metric
          Icon={Clock}
          primary="8 Weeks"
          secondary="Duration"
          color={primaryColor}
        />
        {isIntern ? (
          <Metric
            Icon={Briefcase}
            primary="Live Projects"
            secondary="Work"
            color={primaryColor}
          />
        ) : (
          <Metric
            Icon={BarChart3}
            primary="Advanced"
            secondary="Level"
            color={primaryColor}
          />
        )}
        <Metric
          Icon={Award}
          primary="Excellent"
          secondary="Performance"
          color={primaryColor}
        />
      </div>

      {/* signature row */}
      <div
        className="absolute inset-x-0 z-10 grid grid-cols-3 items-end gap-2 px-[8%]"
        style={{ bottom: "6%" }}
      >
        <Signature
          role={isIntern ? "Program Manager" : "Program Director"}
          path={SIG_A}
          color="#1f2937"
        />
        <div className="flex justify-center">
          <Seal color={primaryColor} />
        </div>
        <Signature role="CEO & Founder" path={SIG_B} color="#1f2937" />
      </div>
    </div>
  );
}

/* --- card + showcase --- */
function CertCard({
  courseName,
  variant,
  onOpen,
}: {
  courseName: string;
  variant: Variant;
  onOpen: () => void;
}) {
  const label = variant === "internship" ? "Internship Completion" : "Course Completion";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative text-left w-full transition-transform hover:-translate-y-1"
      aria-label={`Preview ${courseName} ${label} certificate`}
    >
      <div className="rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 shadow-sm group-hover:shadow-xl transition-shadow">
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
        <DialogContent className="max-w-3xl p-4 sm:p-6 bg-white">
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
