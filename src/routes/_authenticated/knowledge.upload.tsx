import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Upload as UploadIcon, FileText, Loader2, Cloud, StickyNote, Github, Slack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createDocument } from "@/lib/knowledge/knowledge.functions";

export const Route = createFileRoute("/_authenticated/knowledge/upload")({
  component: UploadPage,
});

function UploadPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("documents");
  const cd = useServerFn(createDocument);
  const mut = useMutation({
    mutationFn: () => cd({ data: { title, content, category: category as any } }),
    onSuccess: () => { toast.success("Added to knowledge"); setTitle(""); setContent(""); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <div className="text-sm font-semibold">Paste knowledge</div>
        <p className="mt-1 text-xs text-muted-foreground">Paste any text — SOPs, playbooks, FAQs, product notes. AI agents will index it automatically.</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
          className="mt-4 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
            {["documents","brand","products","services","sales","marketing","support","competitors","personas","faqs","team"].map((c) =>
              <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Paste content here…"
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <div className="mt-3 flex justify-end">
          <Button disabled={!title.trim() || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadIcon className="mr-2 h-4 w-4" />} Save
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-3 text-sm font-semibold">File uploads</div>
        <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <div className="mt-2 text-sm font-medium">Drag & drop coming soon</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports PDF, DOCX, PPTX, TXT, CSV, XLSX, Markdown, HTML, ZIP, JSON, images, video, audio.<br />
            Use the text-paste box above for now — full parsing is enabled per workspace on request.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 text-sm font-semibold">Connect a source</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ConnectorCard icon={Cloud} name="Google Drive" desc="Import folders. Auto-sync." />
          <ConnectorCard icon={StickyNote} name="Notion" desc="Import pages. Auto-sync." />
          <ConnectorCard icon={Github} name="GitHub" desc="Import README, Wiki, docs." />
          <ConnectorCard icon={Slack} name="Slack" desc="Import FAQs, pinned messages." />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Connectors use the Lovable App User Connector flow — connect via workspace Settings → Connectors.
        </p>
      </div>
    </div>
  );
}

function ConnectorCard({ icon: Icon, name, desc }: any) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted/40 p-2"><Icon className="h-5 w-5" /></div>
        <div className="font-medium">{name}</div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
      <Button size="sm" variant="outline" className="mt-3 w-full" disabled>Coming soon</Button>
    </div>
  );
}
