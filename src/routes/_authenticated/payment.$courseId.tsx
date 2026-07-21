import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCoursePayment } from "@/lib/payments/central/checkout.functions";
import { enrollmentFormSchema } from "@/lib/payments/central/shared";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/payment/$courseId")({
  component: PaymentEnrollPage,
});

function PaymentEnrollPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const create = useServerFn(createCoursePayment);

  const courseQ = useQuery({
    queryKey: ["central-payment-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name, slug, category_id, base_price, offer_price, self_paced_price")
        .eq("id", courseId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    college: "",
    degree: "",
    graduationYear: "",
    city: "",
    state: "",
    country: "India",
    couponCode: "",
    referralCode: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = enrollmentFormSchema.parse({
        ...form,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
        college: form.college || null,
        degree: form.degree || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        couponCode: form.couponCode || null,
        referralCode: form.referralCode || null,
      });
      return create({ data: { courseId, form: parsed } });
    },
    onSuccess: (res) => {
      toast.success(res.reused ? "Continuing your existing order" : "Order created");
      navigate({ to: "/payment/pay/$orderId", params: { orderId: res.orderId } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not create order"),
  });

  const price =
    courseQ.data?.offer_price ??
    courseQ.data?.base_price ??
    courseQ.data?.self_paced_price ??
    null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Enrollment details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill this in to continue to payment.{" "}
          {courseQ.data?.name ? (
            <span>
              You're enrolling in <strong>{courseQ.data.name}</strong>
              {price ? <span> for ₹{Number(price).toLocaleString("en-IN")}</span> : null}.
            </span>
          ) : null}
        </p>
      </div>

      <form
        className="space-y-5 rounded-2xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          </Field>
          <Field label="Last name" required>
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Phone" required>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </Field>
          <Field label="College / University">
            <Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
          </Field>
          <Field label="Degree / Course">
            <Input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
          </Field>
          <Field label="Graduation year">
            <Input inputMode="numeric" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </Field>
          <Field label="Country">
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </Field>
          <Field label="Coupon code (optional)">
            <Input value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} />
          </Field>
          <Field label="Referral code (optional)">
            <Input value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value })} />
          </Field>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Link to="/programs" className="text-sm text-muted-foreground hover:underline">
            Cancel
          </Link>
          <Button type="submit" disabled={mutation.isPending || !price}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue to payment
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
