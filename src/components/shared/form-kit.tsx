import * as React from "react";
import { Check, ChevronDown, Eye, EyeOff, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {label}
        {required ? <span className="text-danger">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-danger font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function SearchInput({
  placeholder = "Search anything...",
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input placeholder={placeholder} className="pl-9" {...props} />
    </div>
  );
}

export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className={cn("relative", className)}>
      <Input type={visible ? "text" : "password"} className="pr-10" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function PasswordStrength({ value }: { value: string }) {
  const score = React.useMemo(() => {
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/[0-9]/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  }, [value]);

  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
  const colors = ["bg-danger", "bg-danger", "bg-warning", "bg-info", "bg-success"];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? colors[score] : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value ? labels[score] : "Use 8+ characters with numbers and symbols"}
      </p>
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description ? <span className="text-caption">{description}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-background shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

export function OTPInput({
  length = 6,
  onChange,
}: {
  length?: number;
  onChange?: (v: string) => void;
}) {
  const [vals, setVals] = React.useState<string[]>(Array(length).fill(""));
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  const setAt = (i: number, v: string) => {
    const next = [...vals];
    next[i] = v.slice(-1);
    setVals(next);
    onChange?.(next.join(""));
    if (v && i < length - 1) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex gap-2">
      {vals.map((v, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={v}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !vals[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          inputMode="numeric"
          maxLength={1}
          className="size-12 rounded-lg border-2 border-input bg-background text-center font-mono text-lg font-semibold focus:border-primary focus:outline-none transition-colors"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

const countries = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
];

export function PhoneInput({
  className,
  onChange,
}: {
  className?: string;
  onChange?: (v: { country: string; number: string }) => void;
}) {
  const [c, setC] = React.useState(countries[0]);
  const [n, setN] = React.useState("");
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("relative flex items-stretch h-10 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 border-r border-input text-sm hover:bg-accent"
      >
        <span className="text-base leading-none">{c.flag}</span>
        <span className="text-mono">{c.code}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>
      <input
        value={n}
        onChange={(e) => {
          setN(e.target.value);
          onChange?.({ country: c.code, number: e.target.value });
        }}
        placeholder="Phone number"
        className="flex-1 bg-transparent px-3 text-sm focus:outline-none"
      />
      {open ? (
        <div className="absolute left-0 top-full mt-1 w-56 z-20 card-elevated p-1 shadow-lg">
          {countries.map((ct) => (
            <button
              key={ct.code}
              onClick={() => {
                setC(ct);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span className="text-base">{ct.flag}</span>
              <span className="flex-1 text-left">{ct.name}</span>
              <span className="text-mono text-caption">{ct.code}</span>
              {ct.code === c.code ? <Check className="size-3.5 text-primary" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
