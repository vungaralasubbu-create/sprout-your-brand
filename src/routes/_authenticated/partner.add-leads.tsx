import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  UserPlus,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Loader2,
} from "lucide-react";
import {
  addManualLead,
  bulkUploadLeads,
  listPartnerPrograms,
} from "@/lib/partner/leads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner/add-leads")({
  component: AddLeadsPage,
});

const SOURCES = [
  { value: "personal_network", label: "Personal Network" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website" },
  { value: "event", label: "Event" },
  { value: "college_network", label: "College Network" },
  { value: "other", label: "Other" },
];

function normalizePhone(v: string) {
  return (v ?? "").toString().replace(/\D/g, "");
}

function AddLeadsPage() {
  const [tab, setTab] = useState<"manual" | "upload">("manual");
  const listPrograms = useServerFn(listPartnerPrograms);
  const { data: programs = [] } = useQuery({
    queryKey: ["partner-programs"],
    queryFn: () => listPrograms(),
  });

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <header className="mb-6">
        <h1 className="text-heading-lg font-display font-semibold tracking-tight">
          Add Leads
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Create leads manually or upload a CSV / XLSX file.
        </p>
      </header>

      <div className="inline-flex rounded-xl border bg-white p-1 mb-6">
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
          <UserPlus className="size-4" /> Add Lead Manually
        </TabButton>
        <TabButton active={tab === "upload"} onClick={() => setTab("upload")}>
          <Upload className="size-4" /> Upload Leads
        </TabButton>
      </div>

      {tab === "manual" ? (
        <ManualForm programs={programs} />
      ) : (
        <UploadPanel programs={programs} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────── Manual form ───────────────────────────

interface Program {
  id: string;
  name: string;
  category: string | null;
}

function ManualForm({ programs }: { programs: Program[] }) {
  const addFn = useServerFn(addManualLead);
  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    course_id: "",
    program_interest: "",
    source: "other",
    notes: "",
  });
  const [result, setResult] = useState<
    | { kind: "created"; id: string }
    | { kind: "duplicate"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const chosen = programs.find((p) => p.id === form.course_id);
      return addFn({
        data: {
          full_name: form.full_name.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim() || null,
          course_id: form.course_id || null,
          program_interest: chosen?.name || form.program_interest || null,
          source: form.source as any,
          notes: form.notes.trim() || null,
        },
      });
    },
    onSuccess: (res: any) => {
      if (res.status === "duplicate") {
        setResult({ kind: "duplicate", message: res.message });
        return;
      }
      if (res.status === "created") {
        setResult({ kind: "created", id: res.id });
        setForm({
          full_name: "",
          mobile: "",
          email: "",
          course_id: "",
          program_interest: "",
          source: "other",
          notes: "",
        });
      }
    },
    onError: (e: any) =>
      setResult({ kind: "error", message: e?.message ?? "Failed to add lead." }),
  });

  const canSubmit =
    form.full_name.trim().length >= 2 && normalizePhone(form.mobile).length >= 6;

  return (
    <div className="rounded-2xl border bg-white p-6 lg:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Lead Name" required>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Full name"
          />
        </Field>
        <Field label="Mobile Number" required>
          <Input
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            placeholder="10-digit mobile"
            inputMode="tel"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@example.com"
          />
        </Field>
        <Field label="Interested Program">
          <Select
            value={form.course_id}
            onValueChange={(v) => setForm({ ...form, course_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {p.category ? ` — ${p.category}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Lead Source">
          <Select
            value={form.source}
            onValueChange={(v) => setForm({ ...form, source: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Notes" className="md:col-span-2">
          <Textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Anything the counsellor should know…"
          />
        </Field>
      </div>

      {result?.kind === "duplicate" && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Possible Duplicate Lead</div>
            <div className="text-sm mt-0.5">{result.message}</div>
          </div>
        </div>
      )}
      {result?.kind === "created" && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Lead added successfully</div>
            <div className="text-sm mt-0.5">
              The new lead is now in your sales workspace.
            </div>
          </div>
        </div>
      )}
      {result?.kind === "error" && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm">{result.message}</div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button
          onClick={() => {
            setResult(null);
            mutation.mutate();
          }}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Add Lead
        </Button>
        <Link
          to="/partner/coming-soon"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View My Leads →
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ─────────────────────────── Upload panel ───────────────────────────

const HEADER_MAP: Record<string, keyof ParsedRow> = {
  "lead name": "full_name",
  name: "full_name",
  "full name": "full_name",
  "mobile number": "mobile",
  mobile: "mobile",
  phone: "mobile",
  email: "email",
  "interested program": "program_interest",
  program: "program_interest",
  course: "program_interest",
  "lead source": "source",
  source: "source",
  notes: "notes",
  note: "notes",
};

interface ParsedRow {
  full_name?: string;
  mobile?: string;
  email?: string;
  program_interest?: string;
  source?: string;
  notes?: string;
}

interface ValidatedRow extends ParsedRow {
  _issue?: "invalid" | "duplicate" | null;
  _mobileNorm: string;
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase();
}

function mapRow(raw: Record<string, any>): ParsedRow {
  const out: ParsedRow = {};
  for (const [key, value] of Object.entries(raw)) {
    const mapped = HEADER_MAP[normalizeHeader(key)];
    if (mapped) (out as any)[mapped] = value == null ? "" : String(value).trim();
  }
  return out;
}

function mapSource(v?: string): string {
  if (!v) return "other";
  const k = v.toLowerCase().replace(/[\s-]+/g, "_");
  return SOURCES.find((s) => s.value === k) ? k : "other";
}

function UploadPanel({ programs: _ }: { programs: Program[] }) {
  const uploadFn = useServerFn(bulkUploadLeads);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ValidatedRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    added: number;
    duplicates: number;
    invalid: number;
    total: number;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const valid = (rows ?? []).filter((r) => r._issue !== "invalid");
      return uploadFn({
        data: {
          leads: valid.map((r) => ({
            full_name: r.full_name ?? "",
            mobile: r.mobile ?? "",
            email: r.email || null,
            program_interest: r.program_interest || null,
            source: mapSource(r.source) as any,
            notes: r.notes || null,
          })),
        },
      });
    },
    onSuccess: (res: any) => {
      setSummary({
        added: res.added,
        duplicates: res.duplicates,
        invalid: res.invalid,
        total: res.total,
      });
      setRows(null);
      setFileName(null);
    },
  });

  const stats = useMemo(() => {
    if (!rows) return null;
    const invalid = rows.filter((r) => r._issue === "invalid").length;
    const dupes = rows.filter((r) => r._issue === "duplicate").length;
    return {
      total: rows.length,
      valid: rows.length - invalid - dupes,
      duplicates: dupes,
      invalid,
    };
  }, [rows]);

  async function handleFile(file: File) {
    setParseError(null);
    setSummary(null);
    setFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let raw: Record<string, any>[] = [];
      if (ext === "csv") {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, any>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        raw = parsed.data;
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      } else {
        throw new Error("Unsupported file type. Please upload CSV or XLSX.");
      }

      const mapped = raw.map(mapRow);
      // In-file dup detection
      const seen = new Set<string>();
      const validated: ValidatedRow[] = mapped.map((r) => {
        const mobileNorm = normalizePhone(r.mobile ?? "");
        let issue: ValidatedRow["_issue"] = null;
        if (!r.full_name || mobileNorm.length < 6) issue = "invalid";
        else if (seen.has(mobileNorm)) issue = "duplicate";
        else seen.add(mobileNorm);
        return { ...r, _mobileNorm: mobileNorm, _issue: issue };
      });
      setRows(validated);
    } catch (e: any) {
      setParseError(e?.message ?? "Failed to parse file.");
      setRows(null);
    }
  }

  if (summary) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="mt-4 text-heading-md font-display font-semibold">
          Leads Added Successfully
        </h2>
        <p className="mt-1 text-muted-foreground">
          {summary.added} new{" "}
          {summary.added === 1 ? "lead has" : "leads have"} been added to your
          sales workspace.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>Duplicates skipped: {summary.duplicates}</span>
          <span>•</span>
          <span>Invalid rows: {summary.invalid}</span>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => navigate({ to: "/partner/coming-soon" })}>
            <Users className="size-4" /> View My Leads
          </Button>
          <Button variant="outline" onClick={() => setSummary(null)}>
            Upload another file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sample format */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileSpreadsheet className="size-4 text-primary" /> Expected columns
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Headers are case-insensitive. Extra columns are ignored.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr className="text-left">
                {[
                  "Lead Name",
                  "Mobile Number",
                  "Email",
                  "Interested Program",
                  "Lead Source",
                  "Notes",
                ].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t text-muted-foreground">
                <td className="px-3 py-2">Rohit Sharma</td>
                <td className="px-3 py-2">9876543210</td>
                <td className="px-3 py-2">rohit@example.com</td>
                <td className="px-3 py-2">Machine Learning</td>
                <td className="px-3 py-2">Referral</td>
                <td className="px-3 py-2">Looking for weekend batch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload area */}
      <div className="rounded-2xl border bg-white p-6">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center hover:bg-muted/40 transition-colors"
        >
          <Upload className="mx-auto size-6 text-muted-foreground" />
          <div className="mt-2 text-sm font-medium">
            {fileName ?? "Click to choose a CSV or XLSX file"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Max ~2,000 rows per upload
          </div>
        </div>

        {parseError && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 text-sm">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" /> {parseError}
          </div>
        )}

        {stats && (
          <>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Total Rows" value={stats.total} />
              <StatBox label="Valid Leads" value={stats.valid} tone="success" />
              <StatBox
                label="Possible Duplicates"
                value={stats.duplicates}
                tone="warning"
              />
              <StatBox
                label="Invalid Rows"
                value={stats.invalid}
                tone="danger"
              />
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={() => mutation.mutate()}
                disabled={stats.valid === 0 || mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Confirm Upload
              </Button>
              <button
                onClick={() => {
                  setRows(null);
                  setFileName(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Rows matching existing mobile numbers (across the platform) are
              flagged and won't be inserted.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : tone === "warning"
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : tone === "danger"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-foreground bg-muted/30 border-border";
  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-display font-semibold">{value}</div>
    </div>
  );
}
