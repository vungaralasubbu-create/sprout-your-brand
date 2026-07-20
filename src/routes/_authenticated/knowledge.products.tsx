import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listProducts, upsertProduct } from "@/lib/knowledge/knowledge.functions";

export const Route = createFileRoute("/_authenticated/knowledge/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", target_audience: "" });
  const lp = useServerFn(listProducts);
  const up = useServerFn(upsertProduct);
  const q = useQuery({ queryKey: ["kn-products"], queryFn: () => lp({}) });
  const mut = useMutation({
    mutationFn: () => up({ data: { ...form } }),
    onSuccess: () => { toast.success("Product saved"); setOpen(false); setForm({ name: "", description: "", price: "", target_audience: "" }); qc.invalidateQueries({ queryKey: ["kn-products"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const products = q.data?.products ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Every product your AI agents should know about — with pricing, benefits, and audience.</div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add product</Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No products yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p: any) => (
            <div key={p.id} className="rounded-2xl border bg-card p-4">
              <div className="font-semibold">{p.name}</div>
              {p.price && <div className="mt-0.5 text-sm font-medium text-primary">{p.price}</div>}
              {p.description && <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{p.description}</p>}
              {p.target_audience && <div className="mt-2 text-xs text-muted-foreground">Audience: {p.target_audience}</div>}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl">
            <div className="border-b p-5 text-sm font-semibold">New product</div>
            <div className="space-y-3 p-5">
              <Field label="Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
              <Field label="Price" value={form.price} onChange={(v: string) => setForm({ ...form, price: v })} />
              <Field label="Target audience" value={form.target_audience} onChange={(v: string) => setForm({ ...form, target_audience: v })} />
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!form.name.trim() || mut.isPending} onClick={() => mut.mutate()}>
                {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </div>
  );
}
