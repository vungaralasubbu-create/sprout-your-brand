import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, FileText, Image as ImageIcon, Loader2, Paperclip, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  beginPartnerSupportAttachmentUpload,
  removePartnerSupportDraftAttachment,
  type PartnerSupportAttachment,
} from "@/lib/partner-support/partner-support.functions";

const ACCEPT = "image/png,image/jpeg,image/jpg,application/pdf";
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 5;

type Entry =
  | { state: "uploading"; localId: string; name: string; type: string; size: number }
  | { state: "uploaded"; localId: string; attachment: PartnerSupportAttachment }
  | { state: "failed"; localId: string; name: string; type: string; size: number; error: string };

export function PartnerSupportAttachmentPicker({
  attachments,
  onChange,
  disabled,
}: {
  attachments: PartnerSupportAttachment[];
  onChange: (next: PartnerSupportAttachment[]) => void;
  disabled?: boolean;
}) {
  const beginFn = useServerFn(beginPartnerSupportAttachmentUpload);
  const removeFn = useServerFn(removePartnerSupportDraftAttachment);
  const [pending, setPending] = React.useState<Entry[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const totalCount = attachments.length + pending.filter((e) => e.state !== "failed").length;

  function updateEntry(localId: string, next: Entry | null) {
    setPending((cur) => {
      const filtered = cur.filter((e) => e.localId !== localId);
      return next ? [...filtered, next] : filtered;
    });
  }

  async function uploadOne(file: File) {
    const localId = crypto.randomUUID();
    if (!file.type || !["image/png", "image/jpeg", "image/jpg", "application/pdf"].includes(file.type.toLowerCase())) {
      updateEntry(localId, { state: "failed", localId, name: file.name, type: file.type, size: file.size, error: "Only PNG, JPG or PDF files are supported." });
      return;
    }
    if (file.size > MAX_BYTES) {
      updateEntry(localId, { state: "failed", localId, name: file.name, type: file.type, size: file.size, error: "File is larger than 8 MB." });
      return;
    }
    updateEntry(localId, { state: "uploading", localId, name: file.name, type: file.type, size: file.size });
    try {
      const begin = await beginFn({
        data: { filename: file.name, contentType: file.type, size: file.size },
      });
      const { error: upErr } = await supabase
        .storage.from(begin.bucket)
        .uploadToSignedUrl(begin.path, begin.token, file, { contentType: file.type });
      if (upErr) throw upErr;
      const att: PartnerSupportAttachment = {
        path: begin.path,
        name: file.name,
        type: file.type,
        size: file.size,
      };
      updateEntry(localId, { state: "uploaded", localId, attachment: att });
      onChange([...attachments, att]);
    } catch (err: any) {
      updateEntry(localId, {
        state: "failed",
        localId,
        name: file.name,
        type: file.type,
        size: file.size,
        error: err?.message?.includes("supported") ? err.message : "Unable to upload this file.",
      });
    }
  }

  async function retryEntry(entry: Extract<Entry, { state: "failed" }>) {
    // We don't have the original File — user must reselect. Just clear and let them pick again.
    updateEntry(entry.localId, null);
  }

  async function removeAttachment(att: PartnerSupportAttachment) {
    onChange(attachments.filter((a) => a.path !== att.path));
    try {
      await removeFn({ data: { path: att.path } });
    } catch {
      /* best effort */
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const available = MAX_FILES - totalCount;
    files.slice(0, available).forEach((f) => uploadOne(f));
  }

  const canAdd = !disabled && totalCount < MAX_FILES;

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldAlert className="size-3.5" /> Keep Your Information Safe
        </div>
        <p className="mt-1 leading-relaxed">
          Upload only information relevant to your Partner Support issue. Never share your OTP,
          UPI PIN, card CVV, account password or full payment credentials.
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Supporting Files</div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Add a screenshot or PDF only if it helps explain your Partner Support issue. PNG, JPG, PDF — up to 8 MB each.
        </p>
      </div>

      {(attachments.length > 0 || pending.length > 0) && (
        <ul className="grid gap-2">
          {attachments.map((a) => (
            <li key={a.path} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
              <FileIcon type={a.type} />
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{a.name}</div>
                <div className="text-[11px] text-muted-foreground">Uploaded</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeAttachment(a)} disabled={disabled}>
                <Trash2 className="size-3.5" /> Remove
              </Button>
            </li>
          ))}
          {pending.map((e) => (
            <li key={e.localId} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
              <FileIcon type={e.state === "uploaded" ? e.attachment.type : e.type} />
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">
                  {e.state === "uploaded" ? e.attachment.name : e.name}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  {e.state === "uploading" && (
                    <>
                      <Loader2 className="size-3 animate-spin" /> Uploading…
                    </>
                  )}
                  {e.state === "failed" && (
                    <>
                      <AlertTriangle className="size-3 text-destructive" /> {e.error}
                    </>
                  )}
                </div>
              </div>
              {e.state === "failed" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => retryEntry(e)}>
                    <RefreshCw className="size-3.5" /> Try Again
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateEntry(e.localId, null)}>
                    <Trash2 className="size-3.5" /> Remove
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={onPick}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={!canAdd}
        >
          <Paperclip className="mr-1.5 size-3.5" /> Add File
        </Button>
        {totalCount >= MAX_FILES && (
          <span className="ml-2 text-[11px] text-muted-foreground">Maximum {MAX_FILES} files.</span>
        )}
      </div>
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  if (type?.startsWith("image/")) return <ImageIcon className="size-4 text-muted-foreground shrink-0" />;
  return <FileText className="size-4 text-muted-foreground shrink-0" />;
}
