import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Lock, Pencil, X, ArrowLeftCircle } from "lucide-react";
import { toast } from "sonner";

import { usePreview } from "@/lib/preview/preview-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PreviewBanner() {
  const { preview, isActive, isReadOnly, exitPreview, setReadOnly } = usePreview();
  const navigate = useNavigate();

  // Global read-only shield: block form submissions while previewing read-only.
  useEffect(() => {
    if (!isActive || !isReadOnly) return;
    const onSubmit = (e: Event) => {
      const form = e.target as HTMLElement | null;
      if (form && form.closest("[data-preview-allow]")) return;
      e.preventDefault();
      e.stopPropagation();
      toast.info("Preview is read-only. Switch to Edit mode to make changes.");
    };
    document.addEventListener("submit", onSubmit, true);
    document.documentElement.dataset.previewReadonly = "true";
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      delete document.documentElement.dataset.previewReadonly;
    };
  }, [isActive, isReadOnly]);

  if (!isActive || !preview) return null;

  function handleExit() {
    exitPreview();
    toast.success("Exited preview. Returning to admin dashboard.");
    navigate({ to: "/admin/dashboard" as any });
  }

  function handleToggle() {
    if (isReadOnly) {
      const ok = window.confirm(
        "Switch to Edit mode?\n\nActions you take will affect real user data.",
      );
      if (!ok) return;
      setReadOnly(false);
      toast.warning("Edit mode enabled — changes will affect real user data.");
    } else {
      setReadOnly(true);
      toast.success("Read-only preview restored.");
    }
  }

  return (
    <div
      data-preview-allow
      className={cn(
        "sticky top-0 z-[70] w-full border-b shadow-sm",
        isReadOnly
          ? "bg-amber-500/95 border-amber-600 text-amber-950"
          : "bg-rose-500/95 border-rose-600 text-white",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-1.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-semibold shrink-0">Preview Mode</span>
          <span className="opacity-80 shrink-0">— Viewing as</span>
          <span className="font-semibold truncate">{preview.name}</span>
          <span className="rounded-full border border-current/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0">
            {preview.roleLabel}
          </span>
          {preview.email && (
            <span className="opacity-70 truncate hidden md:inline">· {preview.email}</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
              isReadOnly
                ? "bg-amber-950/10 hover:bg-amber-950/20"
                : "bg-white/15 hover:bg-white/25",
            )}
            aria-pressed={!isReadOnly}
          >
            {isReadOnly ? (
              <>
                <Lock className="h-3 w-3" /> Read-only
              </>
            ) : (
              <>
                <Pencil className="h-3 w-3" /> Edit mode
              </>
            )}
          </button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 px-2 text-[11px]"
            onClick={handleExit}
          >
            <ArrowLeftCircle className="h-3.5 w-3.5 mr-1" />
            Exit preview
            <X className="h-3 w-3 ml-1 opacity-60" />
          </Button>
        </div>
      </div>
    </div>
  );
}
