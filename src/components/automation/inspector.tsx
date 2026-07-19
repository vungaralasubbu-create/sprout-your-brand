import type { Workflow, WorkflowNode } from "@/lib/automation/types";
import { findBlock } from "@/lib/automation/blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  workflow: Workflow;
  nodeId: string | null;
  onChange: (wf: Workflow) => void;
  onSelect: (id: string | null) => void;
}

export function NodeInspector({ workflow, nodeId, onChange, onSelect }: Props) {
  const node = workflow.nodes.find((n) => n.id === nodeId) ?? null;

  if (!node) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        <div className="text-[11px] font-mono uppercase tracking-widest mb-2">Inspector</div>
        Select a block on the canvas to configure it.
        <div className="mt-4 space-y-2 rounded-md border border-border/60 bg-neutral-50 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Workflow</div>
          <Field label="Name">
            <Input value={workflow.name} onChange={(e) => onChange({ ...workflow, name: e.target.value })} className="h-8 text-xs" />
          </Field>
          <Field label="Description">
            <textarea value={workflow.description} onChange={(e) => onChange({ ...workflow, description: e.target.value })} rows={3} className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs" />
          </Field>
          <Field label="Tags (comma separated)">
            <Input value={workflow.tags.join(", ")} onChange={(e) => onChange({ ...workflow, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="h-8 text-xs" />
          </Field>
          <Field label="Error Policy">
            <select value={workflow.errorPolicy} onChange={(e) => onChange({ ...workflow, errorPolicy: e.target.value as any })} className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs">
              <option value="retry">Retry</option>
              <option value="skip">Skip</option>
              <option value="notify">Notify Admin</option>
              <option value="pause">Pause Workflow</option>
            </select>
          </Field>
          <Field label="Max Retries">
            <Input type="number" value={workflow.maxRetries} onChange={(e) => onChange({ ...workflow, maxRetries: Number(e.target.value) })} className="h-8 text-xs" />
          </Field>
          <Field label="Permission Role">
            <select value={workflow.permissionRole} onChange={(e) => onChange({ ...workflow, permissionRole: e.target.value as any })} className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs">
              <option value="administrator">Administrator</option>
              <option value="operations">Operations</option>
              <option value="marketing">Marketing</option>
              <option value="content">Content Team</option>
              <option value="support">Support</option>
              <option value="finance">Finance</option>
              <option value="auditor">Read-only Auditor</option>
            </select>
          </Field>
        </div>
      </div>
    );
  }

  const def = findBlock(node.defId);

  function patch(update: Partial<WorkflowNode>) {
    onChange({ ...workflow, nodes: workflow.nodes.map((n) => n.id === node!.id ? { ...n, ...update } : n) });
  }
  function patchConfig(k: string, v: any) {
    patch({ config: { ...node!.config, [k]: v } });
  }
  function removeSelf() {
    onChange({
      ...workflow,
      nodes: workflow.nodes.filter((n) => n.id !== node!.id).map((n) => ({ ...n, next: n.next === node!.id ? null : n.next, branchYes: n.branchYes === node!.id ? null : n.branchYes, branchNo: n.branchNo === node!.id ? null : n.branchNo })),
    });
    onSelect(null);
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{node.kind.replace("_", " ")}</div>
          <div className="text-sm font-semibold">{def?.label}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={removeSelf} className="text-rose-600 h-7 px-2"><Trash2 className="size-3.5" /></Button>
      </div>
      {def?.description && <p className="text-[11px] text-muted-foreground">{def.description}</p>}

      <Field label="Label">
        <Input value={node.label} onChange={(e) => patch({ label: e.target.value })} className="h-8 text-xs" />
      </Field>

      {def?.configSchema?.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.type === "select" ? (
            <select value={String(node.config[f.key] ?? f.default ?? "")} onChange={(e) => patchConfig(f.key, e.target.value)} className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs">
              {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === "boolean" ? (
            <input type="checkbox" checked={!!node.config[f.key]} onChange={(e) => patchConfig(f.key, e.target.checked)} />
          ) : (
            <Input type={f.type === "number" ? "number" : "text"} value={String(node.config[f.key] ?? f.default ?? "")} onChange={(e) => patchConfig(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)} className="h-8 text-xs" />
          )}
        </Field>
      ))}

      <div className="rounded-md border border-border/60 bg-neutral-50 p-2.5 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Connections</div>
        <Field label="Next Block">
          <select value={node.next ?? ""} onChange={(e) => patch({ next: e.target.value || null })} className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs">
            <option value="">— none —</option>
            {workflow.nodes.filter((n) => n.id !== node.id).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </Field>
        {node.kind === "condition" && (
          <>
            <Field label="If YES">
              <select value={node.branchYes ?? ""} onChange={(e) => patch({ branchYes: e.target.value || null })} className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                <option value="">— none —</option>
                {workflow.nodes.filter((n) => n.id !== node.id).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </Field>
            <Field label="If NO">
              <select value={node.branchNo ?? ""} onChange={(e) => patch({ branchNo: e.target.value || null })} className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                <option value="">— none —</option>
                {workflow.nodes.filter((n) => n.id !== node.id).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
