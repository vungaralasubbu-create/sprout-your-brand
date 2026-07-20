import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/agency/branding")({
  component: BrandingPage,
});

function BrandingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">White Label Branding</h2>
        <p className="text-sm text-muted-foreground">Every page — dashboard, emails, login — automatically reflects this brand.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Identity</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              "Dark logo",
              "Light logo",
              "Favicon",
            ].map((l) => (
              <div key={l} className="space-y-1.5">
                <Label className="text-xs">{l}</Label>
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                  Drop file or click to upload
                </div>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs">Loading screen message</Label>
              <Input defaultValue="Preparing your workspace…" />
            </div>
          </div>

          <h3 className="mt-8 mb-4 font-semibold">Palette & Typography</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Primary", "#06B6D4"],
              ["Secondary", "#3B82F6"],
              ["Accent", "#84CC16"],
            ].map(([label, hex]) => (
              <div key={label} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 shrink-0 rounded-md border" style={{ background: hex as string }} />
                  <Input defaultValue={hex as string} />
                </div>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs">Typography</Label>
              <Input defaultValue="Inter" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Button style</Label>
              <Input defaultValue="Rounded" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Border radius</Label>
              <Input defaultValue="12px" />
            </div>
          </div>

          <h3 className="mt-8 mb-4 font-semibold">Custom login</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Welcome message</Label>
              <Textarea rows={3} defaultValue="Welcome back. Your AI marketing team is ready." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Support contact</Label>
              <Input defaultValue="support@youragency.com" />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline">Preview</Button>
            <Button>Save branding</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Live preview</h3>
          <div className="overflow-hidden rounded-xl border">
            <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <div className="ml-2 text-xs text-muted-foreground">client.youragency.com</div>
            </div>
            <div className="space-y-3 bg-background p-5">
              <div className="h-6 w-24 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500" />
              <div className="h-2 w-3/4 rounded bg-muted" />
              <div className="h-2 w-1/2 rounded bg-muted" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="h-16 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/10" />
                <div className="h-16 rounded-lg bg-gradient-to-br from-lime-400/20 to-emerald-500/10" />
              </div>
              <div className="mt-3 h-8 w-28 rounded-md bg-primary text-center text-xs leading-8 text-primary-foreground">Get started</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
