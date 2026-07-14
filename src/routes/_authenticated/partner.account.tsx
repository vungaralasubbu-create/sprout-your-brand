import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  UserCircle,
  Briefcase,
  Wallet,
  Landmark,
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  getPartnerAccount,
  updatePartnerProfile,
  savePayoutDetails,
  applyFullTime,
  chooseFlexibleModel,
} from "@/lib/partner/account.functions";

export const Route = createFileRoute("/_authenticated/partner/account")({
  component: AccountPage,
});

const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  under_review: "Under Review",
  suspended: "Suspended",
  inactive: "Inactive",
};

const WORK_MODEL_LABEL: Record<string, string> = {
  flexible_active: "Flexible Sales Partner",
  full_time_pending: "Full-Time Application Pending",
  full_time_active: "Full-Time Sales Professional",
  change_under_review: "Work Model Change Under Review",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AccountPage() {
  const qc = useQueryClient();
  const fetchData = useServerFn(getPartnerAccount);
  const { data, isLoading } = useQuery({
    queryKey: ["partner-account"],
    queryFn: () => fetchData(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["partner-account"] });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading account…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Partner profile not found.
      </div>
    );
  }

  const { partner, payout, latestFullTimeApp } = data;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 max-w-4xl">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, work model, and payout preferences.
        </p>
      </header>

      <ProfileSection partner={partner} onSaved={invalidate} />
      <WorkModelSection
        partner={partner}
        latestApp={latestFullTimeApp}
        onChanged={invalidate}
      />
      <PayoutPreferenceSection partner={partner} />
      <BankDetailsSection payout={payout} onSaved={invalidate} />
      <TaxProfileSection payout={payout} onSaved={invalidate} />
      <PayoutProfileStatus partner={partner} payout={payout} />
    </div>
  );
}

/* ------------------------------ PROFILE ---------------------------------- */

function ProfileSection({
  partner,
  onSaved,
}: {
  partner: any;
  onSaved: () => void;
}) {
  const save = useServerFn(updatePartnerProfile);
  const [form, setForm] = useState({
    first_name: partner.first_name ?? "",
    display_name: partner.display_name ?? "",
    mobile: partner.mobile ?? "",
    email: partner.email ?? "",
    date_of_birth: partner.date_of_birth ?? "",
    city: partner.city ?? "",
    state: partner.state ?? "",
    profile_photo_url: partner.profile_photo_url ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await save({
        data: {
          first_name: form.first_name || undefined,
          display_name: form.display_name || undefined,
          mobile: form.mobile || undefined,
          email: form.email || undefined,
          date_of_birth: form.date_of_birth || null,
          city: form.city || undefined,
          state: form.state || undefined,
          profile_photo_url: form.profile_photo_url || null,
        },
      });
      toast.success("Profile updated");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <SectionHeader
        icon={UserCircle}
        title="Partner Profile"
        description="Your personal contact details on Glintr."
      />

      {/* Read-only meta strip */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetaCard label="Sales Partner ID" value={partner.partner_code ?? "—"} />
        <MetaCard label="Account Created" value={fmtDate(partner.created_at)} />
        <MetaCard
          label="Account Status"
          value={ACCOUNT_STATUS_LABEL[partner.account_status] ?? partner.account_status}
          highlight={partner.account_status}
        />
      </div>

      {/* Editable */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full Name">
          <Input
            value={form.display_name}
            onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            maxLength={120}
          />
        </Field>
        <Field label="First Name">
          <Input
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            maxLength={80}
          />
        </Field>
        <Field label="Mobile Number">
          <Input
            value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
            maxLength={20}
          />
        </Field>
        <Field label="Email Address">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            maxLength={255}
          />
        </Field>
        <Field label="Date of Birth">
          <Input
            type="date"
            value={form.date_of_birth ? String(form.date_of_birth).slice(0, 10) : ""}
            onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
          />
        </Field>
        <Field label="City">
          <Input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            maxLength={80}
          />
        </Field>
        <Field label="State">
          <Input
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            maxLength={80}
          />
        </Field>
        <Field label="Profile Photo URL (optional)">
          <Input
            value={form.profile_photo_url}
            onChange={(e) => setForm((f) => ({ ...f, profile_photo_url: e.target.value }))}
            placeholder="https://…"
          />
        </Field>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
          Save Profile
        </Button>
      </div>
    </Card>
  );
}

/* ---------------------------- WORK MODEL --------------------------------- */

function WorkModelSection({
  partner,
  latestApp,
  onChanged,
}: {
  partner: any;
  latestApp: any;
  onChanged: () => void;
}) {
  const applyFn = useServerFn(applyFullTime);
  const chooseFlex = useServerFn(chooseFlexibleModel);
  const [dialog, setDialog] = useState<null | "flex" | "full_time">(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const status = partner.work_model_status as string;
  const isPending = status === "full_time_pending";
  const isFullTime = status === "full_time_active";

  async function submit(kind: "flex" | "full_time") {
    setBusy(true);
    try {
      if (kind === "flex") {
        await chooseFlex();
        toast.success("Flexible model selected");
      } else {
        await applyFn({ data: { notes: notes || undefined } });
        toast.success("Full-Time application submitted for admin review");
      }
      setDialog(null);
      setNotes("");
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <SectionHeader
        icon={Briefcase}
        title="Choose How You Want To Work"
        description="Pick the model that fits your goals. Full-Time requires admin approval."
      />

      {/* Current status strip */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border bg-slate-50 p-3">
        <div className="text-xs text-muted-foreground">Current Work Model:</div>
        <Badge
          variant={isFullTime ? "success" : isPending ? "warning" : "info"}
          className="font-medium"
        >
          {WORK_MODEL_LABEL[status] ?? status}
        </Badge>
        <div className="text-xs text-muted-foreground ml-auto flex items-center gap-4">
          <span>Selected: {fmtDate(partner.work_model_selected_at)}</span>
          {partner.work_model_approved_at && (
            <span>Approved: {fmtDate(partner.work_model_approved_at)}</span>
          )}
        </div>
      </div>
      {isPending && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
          <Clock className="size-4 mt-0.5" />
          Your full-time work model request is under review.
        </div>
      )}
      {latestApp?.status === "more_info" && (
        <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5" />
          <div>
            <strong>Admin has requested more information.</strong>
            {latestApp.admin_notes ? <p className="mt-1">{latestApp.admin_notes}</p> : null}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModelCard
          title="Flexible Sales Partner"
          highlight={!isFullTime && !isPending}
          description="Work on your own schedule, manage leads and earn revenue share from verified sales."
          points={[
            "70% revenue share on eligible own leads",
            "50% revenue share on eligible Glintr-provided leads",
            "2-day payout tracking for approved earnings",
            "Flexible working schedule",
            "No fixed sales target",
          ]}
          cta={
            <Button
              variant={isFullTime ? "outline" : "primary"}
              onClick={() => setDialog("flex")}
              disabled={!isFullTime && !isPending}
            >
              {!isFullTime && !isPending ? "Current Model" : "Choose Flexible Model"}
            </Button>
          }
        />
        <ModelCard
          title="Full-Time Sales Professional"
          highlight={isFullTime}
          description="A structured full-time sales model with attendance, performance tracking and monthly employment documentation where applicable."
          points={[
            "Structured work model",
            "Monthly performance tracking",
            "Attendance and login activity",
            "Monthly salary documentation",
            "Employee benefits based on eligibility",
          ]}
          cta={
            <Button
              onClick={() => setDialog("full_time")}
              disabled={isFullTime || isPending}
              variant={isFullTime ? "outline" : "primary"}
            >
              {isFullTime
                ? "Current Model"
                : isPending
                  ? "Application Pending"
                  : "Apply For Full-Time Model"}
            </Button>
          }
        />
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "flex"
                ? "Confirm Flexible Sales Partner"
                : "Apply For Full-Time Sales Professional"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "flex"
                ? "This keeps you on the flexible revenue-share model."
                : "Your request will be reviewed by an admin. Approval sets your work model to Full-Time."}
            </DialogDescription>
          </DialogHeader>
          {dialog === "full_time" && (
            <div className="space-y-2">
              <Label>Notes for admin (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                placeholder="Anything the reviewer should know…"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => submit(dialog!)} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              {dialog === "flex" ? "Confirm" : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ModelCard({
  title,
  description,
  points,
  cta,
  highlight,
}: {
  title: string;
  description: string;
  points: string[];
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 space-y-3 bg-white",
        highlight && "ring-2 ring-cyan-300 bg-cyan-50/40",
      )}
    >
      <div className="font-display text-lg font-semibold tracking-tight">{title}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <ul className="space-y-1.5 text-sm">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <CheckCircle2 className="size-4 mt-0.5 text-cyan-600 shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="pt-2">{cta}</div>
    </div>
  );
}

/* -------------------------- PAYOUT PREFERENCE ---------------------------- */

function PayoutPreferenceSection({ partner }: { partner: any }) {
  const isFullTime = partner.work_model === "full_time";
  return (
    <Card className="p-5">
      <SectionHeader
        icon={Wallet}
        title="Payout Preference"
        description="Payouts are processed by the admin team. This is your compensation cycle."
      />
      <div className="mt-4 rounded-lg border p-4 bg-slate-50">
        {isFullTime ? (
          <>
            <div className="font-medium">Monthly Payout / Salary Cycle</div>
            <p className="mt-1 text-sm text-muted-foreground">
              As a Full-Time Sales Professional, your compensation runs on a monthly cycle
              defined in your employment terms. Admin manages salary configuration.
            </p>
          </>
        ) : (
          <>
            <div className="font-medium">2-Day Payout Tracking</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Approved sales earnings are tracked with a payout target within 2 days of
              payment verification. Actual payout timing depends on the admin payout run.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

/* -------------------------- BANK PAYOUT DETAILS -------------------------- */

function BankDetailsSection({
  payout,
  onSaved,
}: {
  payout: any;
  onSaved: () => void;
}) {
  const save = useServerFn(savePayoutDetails);
  const hasBank = !!payout?.bank_details_completed;
  const [editing, setEditing] = useState(!hasBank);

  const [form, setForm] = useState({
    account_holder_name: payout?.account_holder_name ?? "",
    bank_name: payout?.bank_name ?? "",
    bank_account_number: "",
    confirm_account_number: "",
    ifsc_code: payout?.ifsc_code ?? "",
    account_type: (payout?.account_type ?? "savings") as "savings" | "current",
    upi_id: payout?.upi_id ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setError(null);
    if (form.bank_account_number !== form.confirm_account_number) {
      setError("Account Number and Confirm Account Number must match.");
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code.toUpperCase())) {
      setError("Invalid IFSC format.");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          account_holder_name: form.account_holder_name || undefined,
          bank_name: form.bank_name || undefined,
          bank_account_number: form.bank_account_number || undefined,
          confirm_account_number: form.confirm_account_number || undefined,
          ifsc_code: form.ifsc_code.toUpperCase(),
          account_type: form.account_type,
          upi_id: form.upi_id || "",
        },
      });
      toast.success("Bank details saved");
      setEditing(false);
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <SectionHeader
        icon={Landmark}
        title="Bank & Payout Details"
        description="Securely stored. The full account number is never shown once saved."
      />

      {!editing && hasBank ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ReadRow label="Account Holder" value={payout.account_holder_name ?? "—"} />
          <ReadRow label="Bank" value={payout.bank_name ?? "—"} />
          <ReadRow
            label="Bank Account"
            value={payout.account_last4 ? `XXXXXX${payout.account_last4}` : "—"}
          />
          <ReadRow label="IFSC" value={payout.ifsc_code ?? "—"} />
          <ReadRow label="Account Type" value={payout.account_type ?? "—"} />
          <ReadRow label="UPI ID" value={payout.upi_id ?? "—"} />
          <div className="md:col-span-2 flex justify-end">
            <Button variant="outline" onClick={() => setEditing(true)}>
              Update Bank Details
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account Holder Name">
              <Input
                value={form.account_holder_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, account_holder_name: e.target.value }))
                }
                maxLength={120}
              />
            </Field>
            <Field label="Bank Name">
              <Input
                value={form.bank_name}
                onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                maxLength={120}
              />
            </Field>
            <Field label="Account Number">
              <Input
                value={form.bank_account_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bank_account_number: e.target.value }))
                }
                inputMode="numeric"
                maxLength={25}
              />
            </Field>
            <Field label="Confirm Account Number">
              <Input
                value={form.confirm_account_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirm_account_number: e.target.value }))
                }
                inputMode="numeric"
                maxLength={25}
              />
            </Field>
            <Field label="IFSC Code">
              <Input
                value={form.ifsc_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ifsc_code: e.target.value.toUpperCase() }))
                }
                maxLength={11}
              />
            </Field>
            <Field label="Account Type">
              <Select
                value={form.account_type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, account_type: v as "savings" | "current" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="UPI ID (optional)">
              <Input
                value={form.upi_id}
                onChange={(e) => setForm((f) => ({ ...f, upi_id: e.target.value }))}
                placeholder="you@upi"
                maxLength={80}
              />
            </Field>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            {hasBank && (
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Save Payout Details
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

/* ------------------------------ TAX PROFILE ------------------------------ */

function TaxProfileSection({
  payout,
  onSaved,
}: {
  payout: any;
  onSaved: () => void;
}) {
  const save = useServerFn(savePayoutDetails);
  const hasPan = !!payout?.pan_details_completed;
  const [editing, setEditing] = useState(!hasPan);

  const [form, setForm] = useState({
    pan: "",
    legal_name: payout?.legal_name ?? "",
    gstin: payout?.gstin ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setError(null);
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.toUpperCase())) {
      setError("Invalid PAN format (e.g. ABCDE1234F)");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          pan: form.pan.toUpperCase(),
          legal_name: form.legal_name || undefined,
          gstin: form.gstin || "",
        },
      });
      toast.success("Tax profile saved");
      setEditing(false);
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <SectionHeader
        icon={FileText}
        title="Tax & Payout Profile"
        description="PAN is required for tax compliance. Only admins can view unmasked values."
      />
      {!editing && hasPan ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ReadRow label="PAN" value={payout.pan_masked ?? "—"} />
          <ReadRow label="Legal Name (as per PAN)" value={payout.legal_name ?? "—"} />
          <ReadRow label="GSTIN" value={payout.gstin ?? "—"} />
          <div className="md:col-span-2 flex justify-end">
            <Button variant="outline" onClick={() => setEditing(true)}>
              Update Tax Profile
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="PAN Number">
              <Input
                value={form.pan}
                onChange={(e) => setForm((f) => ({ ...f, pan: e.target.value.toUpperCase() }))}
                maxLength={10}
                placeholder="ABCDE1234F"
              />
            </Field>
            <Field label="Legal Name as per PAN">
              <Input
                value={form.legal_name}
                onChange={(e) => setForm((f) => ({ ...f, legal_name: e.target.value }))}
                maxLength={120}
              />
            </Field>
            <Field label="GSTIN (optional)">
              <Input
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                maxLength={15}
              />
            </Field>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            {hasPan && (
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Save Tax Profile
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

/* -------------------------- PAYOUT PROFILE STATUS ------------------------ */

function PayoutProfileStatus({
  partner,
  payout,
}: {
  partner: any;
  payout: any;
}) {
  const bank = !!payout?.bank_details_completed;
  const pan = !!payout?.pan_details_completed;
  const complete = bank && pan;
  return (
    <Card className={cn("p-5", complete && "border-cyan-300 bg-cyan-50/40")}>
      <SectionHeader
        icon={ShieldCheck}
        title="Payout Profile"
        description="Once complete, admins can process your payouts without delay."
      />
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatusChip label="Bank Details" done={bank} />
        <StatusChip label="PAN Details" done={pan} />
        <StatusChip
          label="Work Model"
          value={WORK_MODEL_LABEL[partner.work_model_status] ?? "—"}
          done
        />
        <StatusChip
          label="Overall"
          value={complete ? "Ready For Payout Review" : "Incomplete"}
          done={complete}
        />
      </div>
      {!complete && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="size-4" />
          Payout Profile Incomplete — complete Bank and PAN details to become payout-ready.
        </div>
      )}
    </Card>
  );
}

/* ------------------------------- helpers --------------------------------- */

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-cyan-50 text-cyan-700 p-2">
        <Icon className="size-5" />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-sm tabular-nums">{value}</div>
    </div>
  );
}

function MetaCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  const cls =
    highlight === "under_review"
      ? "border-amber-200 bg-amber-50"
      : highlight === "suspended"
        ? "border-red-200 bg-red-50"
        : highlight === "inactive"
          ? "border-slate-200 bg-slate-50"
          : "border-slate-200 bg-white";
  return (
    <div className={cn("rounded-md border p-3", cls)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-sm">{value}</div>
    </div>
  );
}

function StatusChip({
  label,
  done,
  value,
}: {
  label: string;
  done?: boolean;
  value?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        done ? "border-cyan-200 bg-white" : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
        {done ? (
          <CheckCircle2 className="size-4 text-cyan-600" />
        ) : (
          <AlertCircle className="size-4 text-amber-500" />
        )}
        {value ?? (done ? "Completed" : "Missing")}
      </div>
    </div>
  );
}
