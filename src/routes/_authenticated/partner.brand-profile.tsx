import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  Upload,
  AlertCircle,
  Plus,
  Loader2,
  Copy,
  Sparkles,
} from "lucide-react";
import {
  getPartnerBrandContext,
  setSellingModel,
  upsertBrandProfile,
  getBrandLogoSignedUrl,
  SELLING_MODELS,
  SELLING_MODEL_LABELS,
  BRAND_STATUS_LABELS,
  type SellingModel,
} from "@/lib/partner/brand-profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner/brand-profile")({
  component: BrandProfilePage,
});

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-foreground",
  pending_review: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  needs_information: "bg-orange-100 text-orange-800",
  rejected: "bg-rose-100 text-rose-800",
  suspended: "bg-zinc-200 text-zinc-800",
};

const ACCEPTED_MIME = ["image/png", "image/jpeg", "image/svg+xml"];

function BrandProfilePage() {
  const fetchCtx = useServerFn(getPartnerBrandContext);
  const { data, isLoading } = useQuery({
    queryKey: ["partner-brand-context"],
    queryFn: () => fetchCtx(),
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"own" | "partnered">("own");

  const selling = data?.selling_model ?? null;
  const profiles = data?.profiles ?? [];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <div className="text-caption uppercase tracking-widest text-primary font-mono">
          Sales Workspace
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Brand Profile</h1>
        <p className="text-muted-foreground max-w-2xl">
          Tell us the brand you use when selling Glintr programs. Admin verifies each brand before it can
          be attached to leads or payments.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
          Loading brand profile…
        </div>
      ) : (
        <>
          <SellingModelPicker
            current={selling}
            onSaved={() => {
              /* refetched by mutation */
            }}
          />

          {selling === "glintr" ? <GlintrBrandCard /> : null}

          {selling && selling !== "glintr" ? (
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold">Your Brands</h2>
                  <p className="text-sm text-muted-foreground">
                    {selling === "multiple"
                      ? "Add every brand you sell under. Each one is reviewed independently."
                      : "Submit your brand for admin review."}
                  </p>
                </div>
                {(selling === "multiple" || profiles.length === 0) && (
                  <Button
                    onClick={() => {
                      setDefaultType(selling === "partnered" ? "partnered" : "own");
                      setCreateOpen(true);
                    }}
                    size="sm"
                  >
                    <Plus className="size-4" />
                    {profiles.length === 0 ? "Add Brand" : "Add Another Brand"}
                  </Button>
                )}
              </div>

              {profiles.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-white p-8 text-center">
                  <Building2 className="size-8 mx-auto text-muted-foreground" />
                  <div className="mt-3 font-medium">No brand submitted yet</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your brand details so admin can verify it.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border bg-white overflow-hidden">
                  {profiles.map((p: any, idx: number) => (
                    <BrandRow
                      key={p.id}
                      profile={p}
                      isLast={idx === profiles.length - 1}
                      onEdit={() => setEditing(p)}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </>
      )}

      {(createOpen || editing) && (
        <BrandFormDialog
          open={createOpen || Boolean(editing)}
          onOpenChange={(v) => {
            if (!v) {
              setCreateOpen(false);
              setEditing(null);
            }
          }}
          sellingModel={selling ?? "own"}
          defaultType={editing ? editing.brand_type : defaultType}
          existing={editing}
        />
      )}
    </div>
  );
}

function SellingModelPicker({ current, onSaved }: { current: SellingModel | null; onSaved: () => void }) {
  const fn = useServerFn(setSellingModel);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (m: SellingModel) => fn({ data: { selling_model: m } }),
    onSuccess: () => {
      toast.success("Selling model saved");
      qc.invalidateQueries({ queryKey: ["partner-brand-context"] });
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  return (
    <section className="rounded-xl border bg-white p-6">
      <div className="flex items-start gap-3">
        <Sparkles className="size-5 text-primary mt-0.5" />
        <div>
          <h2 className="font-display text-lg font-semibold">How do you sell programs?</h2>
          <p className="text-sm text-muted-foreground">Pick the model that matches your setup.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SELLING_MODELS.map((m) => {
          const active = current === m;
          return (
            <button
              key={m}
              onClick={() => mutation.mutate(m)}
              disabled={mutation.isPending}
              className={cn(
                "text-left rounded-lg border px-4 py-3 transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{SELLING_MODEL_LABELS[m]}</div>
                {active && <Check className="size-4 text-primary" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function GlintrBrandCard() {
  return (
    <section className="rounded-xl border border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center gap-2">
        <Badge className="bg-primary text-primary-foreground">Selling Model</Badge>
        <span className="font-medium">Glintr Brand</span>
      </div>
      <p className="mt-3 text-sm text-foreground/80">
        You are selling eligible programs using the Glintr brand and approved sales materials. No
        additional brand form is required.
      </p>
    </section>
  );
}

function BrandRow({
  profile,
  isLast,
  onEdit,
}: {
  profile: any;
  isLast: boolean;
  onEdit: () => void;
}) {
  const editable = ["draft", "needs_information", "pending_review"].includes(profile.status);
  return (
    <div className={cn("flex items-start gap-4 p-4", !isLast && "border-b")}>
      <div className="size-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Building2 className="size-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-medium truncate">{profile.brand_name}</div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {profile.brand_type === "own" ? "Own" : "Partnered"}
          </Badge>
          <Badge className={cn("text-[11px]", STATUS_TONE[profile.status])}>
            {BRAND_STATUS_LABELS[profile.status] ?? profile.status}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {profile.company_name || "—"} {profile.website ? `• ${profile.website}` : ""}
        </div>
        {profile.status === "needs_information" && profile.admin_message && (
          <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm">
            <div className="flex items-center gap-2 text-orange-800 font-medium">
              <AlertCircle className="size-4" /> Admin requested more information
            </div>
            <div className="mt-1 text-orange-900/80">{profile.admin_message}</div>
          </div>
        )}
        {profile.status === "rejected" && profile.rejection_reason && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm">
            <div className="text-rose-800 font-medium">Rejection reason</div>
            <div className="mt-1 text-rose-900/80">{profile.rejection_reason}</div>
          </div>
        )}
      </div>
      <div className="shrink-0">
        <Button size="sm" variant="outline" onClick={onEdit} disabled={!editable}>
          {editable ? "Edit" : "View"}
        </Button>
      </div>
    </div>
  );
}

function BrandFormDialog({
  open,
  onOpenChange,
  sellingModel,
  defaultType,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sellingModel: SellingModel;
  defaultType: "own" | "partnered";
  existing: any | null;
}) {
  const qc = useQueryClient();
  const fetchLogoUrl = useServerFn(getBrandLogoSignedUrl);
  const upsert = useServerFn(upsertBrandProfile);
  const editable = existing
    ? ["draft", "needs_information", "pending_review"].includes(existing.status)
    : true;

  const initialType: "own" | "partnered" = existing?.brand_type ?? defaultType;
  const [brandType, setBrandType] = useState<"own" | "partnered">(initialType);

  const [form, setForm] = useState({
    brand_name: existing?.brand_name ?? "",
    company_name: existing?.company_name ?? "",
    website: existing?.website ?? "",
    social_link: existing?.social_link ?? "",
    business_email: existing?.business_email ?? "",
    business_phone: existing?.business_phone ?? "",
    brand_description: existing?.brand_description ?? "",
    relationship_to_brand: existing?.relationship_to_brand ?? "",
    authorized_contact_name: existing?.authorized_contact_name ?? "",
    authorized_contact_email: existing?.authorized_contact_email ?? "",
    notes: existing?.notes ?? "",
  });

  const [uploading, setUploading] = useState(false);
  const [logo, setLogo] = useState<{ bucket: string; path: string; mime: string } | null>(
    existing?.logo_bucket && existing?.logo_path
      ? { bucket: existing.logo_bucket, path: existing.logo_path, mime: existing.logo_mime ?? "" }
      : null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // Load existing logo preview
  const { data: logoUrlData } = useQuery({
    queryKey: ["brand-logo", existing?.id],
    enabled: Boolean(existing?.id && existing?.logo_path),
    queryFn: () => fetchLogoUrl({ data: { profile_id: existing.id } }),
  });

  const bind = (k: keyof typeof form) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
    disabled: !editable,
  });

  async function handleFile(file: File) {
    if (!ACCEPTED_MIME.includes(file.type)) {
      toast.error("Only PNG, JPG, JPEG or SVG files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5MB.");
      return;
    }
    // Need partner_id — fetch from context in cache
    const ctx = qc.getQueryData<any>(["partner-brand-context"]);
    const partnerId: string | undefined = ctx?.partner_id;
    if (!partnerId) {
      toast.error("Partner profile not found.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const profileFolder = existing?.id ?? crypto.randomUUID();
      const path = `${partnerId}/${profileFolder}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("partner-brand-logos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setLogo({ bucket: "partner-brand-logos", path, mime: file.type });
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const mutation = useMutation({
    mutationFn: async () =>
      upsert({
        data: {
          id: existing?.id,
          selling_model: sellingModel,
          brand_type: brandType,
          brand_name: form.brand_name,
          company_name: form.company_name,
          website: form.website,
          social_link: form.social_link,
          business_email: form.business_email,
          business_phone: form.business_phone,
          brand_description: form.brand_description,
          relationship_to_brand: brandType === "partnered" ? form.relationship_to_brand : "",
          authorized_contact_name: brandType === "partnered" ? form.authorized_contact_name : "",
          authorized_contact_email: brandType === "partnered" ? form.authorized_contact_email : "",
          notes: form.notes,
          logo_bucket: logo?.bucket ?? "",
          logo_path: logo?.path ?? "",
          logo_mime: logo?.mime ?? "",
        },
      }),
    onSuccess: () => {
      toast.success(existing ? "Resubmitted for review" : "Submitted for review");
      qc.invalidateQueries({ queryKey: ["partner-brand-context"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to submit"),
  });

  const canPickType = !existing && sellingModel === "multiple";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existing ? "Brand Profile" : brandType === "own" ? "Add Your Brand" : "Add Partnered Brand"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {canPickType && (
            <div className="grid grid-cols-2 gap-2">
              {(["own", "partnered"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBrandType(t)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm text-left",
                    brandType === t
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <div className="font-medium">
                    {t === "own" ? "Own Brand" : "Partnered Brand"}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand Name *">
              <Input {...bind("brand_name")} required />
            </Field>
            <Field label={brandType === "own" ? "Business / Company Name" : "Company Name"}>
              <Input {...bind("company_name")} />
            </Field>
            <Field label="Website">
              <Input {...bind("website")} placeholder="https://" />
            </Field>
            <Field label="Instagram / Social Media Link">
              <Input {...bind("social_link")} placeholder="https://" />
            </Field>
            {brandType === "own" && (
              <>
                <Field label="Business Email">
                  <Input type="email" {...bind("business_email")} />
                </Field>
                <Field label="Business Phone Number">
                  <Input {...bind("business_phone")} />
                </Field>
              </>
            )}
            {brandType === "partnered" && (
              <>
                <Field label="Relationship To Brand">
                  <Input {...bind("relationship_to_brand")} placeholder="Reseller, employee, agent…" />
                </Field>
                <Field label="Authorised Contact Name">
                  <Input {...bind("authorized_contact_name")} />
                </Field>
                <Field label="Authorised Contact Email">
                  <Input type="email" {...bind("authorized_contact_email")} />
                </Field>
              </>
            )}
          </div>

          <Field label={brandType === "own" ? "Brand Description" : "Notes"}>
            <Textarea
              rows={3}
              {...(brandType === "own" ? bind("brand_description") : bind("notes"))}
            />
          </Field>

          <div>
            <Label>Brand Logo</Label>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="size-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                {logo && !existing ? (
                  <span className="text-[10px] text-muted-foreground text-center px-1">
                    Uploaded
                  </span>
                ) : logoUrlData?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrlData.url} alt="logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                  disabled={!editable}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={!editable || uploading}
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {logo ? "Replace Logo" : "Upload Logo"}
                </Button>
                <div className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, JPEG or SVG. Up to 5MB.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {editable ? "Cancel" : "Close"}
          </Button>
          {editable && (
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.brand_name.trim()}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {brandType === "partnered" ? "Submit Partner Brand For Review" : "Submit Brand For Review"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
