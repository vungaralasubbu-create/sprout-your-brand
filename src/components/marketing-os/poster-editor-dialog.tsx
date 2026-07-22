/**
 * PosterEditorDialog — full poster editor with live preview.
 *
 * Actions: edit copy/colors/layout, regenerate background artwork,
 * download PNG, publish (delegates to parent).
 */
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Download, RefreshCw, Save, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PosterCanvas, downloadPosterPng, type PosterModel } from "./poster-canvas";
import { updatePoster, regeneratePoster } from "@/lib/marketing-os/project-publish.functions";

const LAYOUTS = ["centered", "top_left", "bottom_bar", "split"] as const;

export function PosterEditorDialog({
  open,
  onOpenChange,
  projectId,
  index,
  poster,
  onPublish,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  index: number;
  poster: PosterModel;
  onPublish?: () => void;
}) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updatePoster);
  const regenFn = useServerFn(regeneratePoster);

  const [draft, setDraft] = useState<PosterModel>(poster);
  const [saving, setSaving] = useState(false);
  const [regen, setRegen] = useState(false);
  const [bgPrompt, setBgPrompt] = useState<string>((poster as any).background_prompt ?? "");

  const set = <K extends keyof PosterModel>(k: K, v: PosterModel[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await updateFn({
        data: {
          projectId,
          index,
          edits: {
            title: draft.title,
            headline: draft.headline,
            subtitle: draft.subtitle,
            cta: draft.cta,
            description: draft.description,
            dominant_colors: draft.dominant_colors,
            text_color: draft.text_color,
            accent_color: draft.accent_color,
            layout: draft.layout,
          },
        },
      });
      toast.success("Poster saved");
      qc.invalidateQueries({ queryKey: ["marketing-project", projectId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    setRegen(true);
    try {
      const res = await regenFn({
        data: { projectId, index, backgroundPrompt: bgPrompt || undefined },
      });
      if (res?.poster?.image_url) {
        setDraft((d) => ({ ...d, image_url: res.poster.image_url }));
      }
      toast.success("New background generated");
      qc.invalidateQueries({ queryKey: ["marketing-project", projectId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Regenerate failed");
    } finally {
      setRegen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Poster editor</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="min-w-0">
            <PosterCanvas poster={draft} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPosterPng(draft, `${(draft.title || "poster").replace(/\s+/g, "-").toLowerCase()}.png`)}
              >
                <Download className="size-3.5 mr-1.5" /> Download PNG
              </Button>
              <Button variant="outline" size="sm" onClick={regenerate} disabled={regen}>
                {regen ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="size-3.5 mr-1.5" />}
                Regenerate background
              </Button>
              {onPublish && (
                <Button size="sm" onClick={onPublish}>
                  <Send className="size-3.5 mr-1.5" /> Publish
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <Field label="Headline">
              <Input value={draft.headline ?? ""} onChange={(e) => set("headline", e.target.value)} />
            </Field>
            <Field label="Subtitle">
              <Textarea rows={2} value={draft.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
            </Field>
            <Field label="CTA">
              <Input value={draft.cta ?? ""} onChange={(e) => set("cta", e.target.value)} />
            </Field>
            <Field label="Description / footer">
              <Textarea rows={2} value={draft.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Layout">
              <div className="flex flex-wrap gap-1">
                {LAYOUTS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => set("layout", l)}
                    className={`px-2 py-1 text-xs rounded border ${draft.layout === l ? "bg-primary text-primary-foreground border-primary" : "border-border/60"}`}
                  >
                    {l.replace("_", " ")}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Text color">
                <Input type="color" value={draft.text_color ?? "#ffffff"} onChange={(e) => set("text_color", e.target.value)} />
              </Field>
              <Field label="Accent color">
                <Input type="color" value={draft.accent_color ?? "#111111"} onChange={(e) => set("accent_color", e.target.value)} />
              </Field>
            </div>
            <Field label="Background prompt (for regenerate)">
              <Textarea
                rows={3}
                value={bgPrompt}
                onChange={(e) => setBgPrompt(e.target.value)}
                placeholder="Describe the abstract artwork you want in the background. No text will be rendered."
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Save className="size-3.5 mr-1.5" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
