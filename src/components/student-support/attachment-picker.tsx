import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  beginStudentSupportAttachmentUpload,
  removeStudentSupportDraftAttachment,
  type StudentSupportAttachment,
} from "@/lib/student-support/student-support.functions";

const ACCEPT = "image/png,image/jpeg,image/jpg,application/pdf";
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 5;

type Entry =
  | { state: "uploading"; localId: string; name: string; type: string; size: number }
  | { state: "uploaded"; localId: string; attachment: StudentSupportAttachment }
  | { state: "failed"; localId: string; name: string; type: string; size: number; error: string };

export function StudentSupportAttachmentPicker({
  attachments,
  onChange,
  disabled,
}: {
  attachments: StudentSupportAttachment[];
  onChange: (next: StudentSupportAttachment[]) => void;
  disabled?: boolean;
}) {
  const beginFn = useServerFn(beginStudentSupportAttachmentUpload);
  const removeFn = useServerFn(removeStudentSupportDraftAttachment);
  const [pending, setPending] = React.useState<Entry[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const totalCount =
    attachments.length + pending.filter((e) => e.state !== "failed").length;

  function updateEntry(localId: string, next: Entry | null) {
    setPending((cur) => {
      const filtered = cur.filter((e) => e.localId !== localId);
      return next ? [...filtered, next] : filtered;
    });
  }

  async function uploadOne(file: File) {
    const localId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    if (!file.type || !ALLOWED.includes(file.type.toLowerCase())) {
      updateEntry(localId, {
        state: "failed",
        localId,
        name: file.name,
        type: file.type,
        size: file.size,
        error: "Only PNG, JPG or PDF files are supported.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      updateEntry(localId, {
        state: "failed",
        localId,
        name: file.name,
        type: file.type,
        size: file.size,
        error: "File is larger than 8 MB.",
      });
      return;
    }
    updateEntry(localId, {
      state: "uploading",
      localId,
      name: file.name,
      type: file.type,
      size: file.size,
    });
    try {
      const begin = await beginFn({
        data: { filename: file.name, contentType: file.type, size: file.size },
      });
      const { error: upErr } = await supabase.storage
        .from(begin.bucket)
        .uploadToSignedUrl(begin.path, begin.token, file, {
          contentType: file.type,
        });
      if (upErr) throw upErr;
      const att: StudentSupportAttachment = {
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
        error:
          err?.message && /supported|larger|too large/i.test(err.message)
            ? err.message
            : "Unable To Upload This File",
      });
    }
  }

  async function removeAttachment(att: StudentSupportAttachment) {
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
          <ShieldAlert className="size-3.5" /> Before Uploading
        </div>
        <p className="mt-1 leading-relaxed">
          Do not upload passwords, OTPs, UPI PINs, card CVVs or full payment
          credentials. Only upload information relevant to your Student Support
          issue.
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Add Supporting File
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Upload a relevant screenshot or file that helps explain the Student
          Support issue. PNG, JPG or PDF — up to 8&nbsp;MB each.
        </p>
      </div>

      {(attachments.length > 0 || pending.length > 0) && (
        <ul className="grid gap-2">
          {attachments.map((a) => (
            <li
              key={a.path}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <FileIcon type={a.type} />
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{a.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Selected File
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeAttachment(a)}
                disabled={disabled}
              >
                <Trash2 className="size-3.5" /> Remove
              </Button>
            </li>
          ))}
          {pending.map((e) => (
            <li
              key={e.localId}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
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
                      <AlertTriangle className="size-3 text-destructive" />{" "}
                      {e.error}
                    </>
                  )}
                </div>
              </div>
              {e.state === "failed" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateEntry(e.localId, null)}
                  >
                    <RefreshCw className="size-3.5" /> Try Again
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateEntry(e.localId, null)}
                  >
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
          <Paperclip className="mr-1.5 size-3.5" /> Choose File
        </Button>
        {totalCount >= MAX_FILES && (
          <span className="ml-2 text-[11px] text-muted-foreground">
            Maximum {MAX_FILES} files.
          </span>
        )}
      </div>
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  if (type?.startsWith("image/"))
    return <ImageIcon className="size-4 text-muted-foreground shrink-0" />;
  return <FileText className="size-4 text-muted-foreground shrink-0" />;
}
