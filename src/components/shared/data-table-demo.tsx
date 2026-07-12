import * as React from "react";
import { ArrowUpDown, Download, Filter, MoreHorizontal, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableStatus = "active" | "pending" | "paused" | "failed";

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  title?: string;
  description?: string;
  searchable?: boolean;
  selectable?: boolean;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  title,
  description,
  searchable = true,
  selectable = true,
  className,
}: DataTableProps<T>) {
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  const filtered = React.useMemo(() => {
    if (!q) return rows;
    const l = q.toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(l));
  }, [rows, q]);

  const allSelected = selected.size === filtered.length && filtered.length > 0;

  return (
    <div className={cn("card-elevated overflow-hidden", className)}>
      {(title || searchable) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
          <div>
            {title ? <h3 className="font-display font-semibold">{title}</h3> : null}
            {description ? <p className="text-caption">{description}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {searchable ? (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  className="pl-8 h-9 w-56"
                />
              </div>
            ) : null}
            <Button variant="outline" size="sm">
              <Filter className="size-3.5" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="size-3.5" />
              Export
            </Button>
          </div>
        </div>
      )}
      {selected.size > 0 ? (
        <div className="px-4 py-2 bg-primary-soft flex items-center justify-between text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">Assign</Button>
            <Button variant="ghost" size="sm">Archive</Button>
            <Button variant="ghost" size="sm" className="text-danger">Delete</Button>
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto scrollbar-thin">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface">
              {selectable ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) =>
                      setSelected(v ? new Set(filtered.map((_, i) => i)) : new Set())
                    }
                    aria-label="Select all"
                  />
                </TableHead>
              ) : null}
              {columns.map((c) => (
                <TableHead key={String(c.key)} className={c.className}>
                  <button className="inline-flex items-center gap-1 text-label hover:text-foreground">
                    {c.label}
                    {c.sortable ? <ArrowUpDown className="size-3" /> : null}
                  </button>
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, i) => (
              <TableRow key={i} className="hover:bg-surface/60">
                {selectable ? (
                  <TableCell>
                    <Checkbox
                      checked={selected.has(i)}
                      onCheckedChange={(v) => {
                        const next = new Set(selected);
                        if (v) next.add(i);
                        else next.delete(i);
                        setSelected(next);
                      }}
                    />
                  </TableCell>
                ) : null}
                {columns.map((c) => (
                  <TableCell key={String(c.key)} className={c.className}>
                    {c.render ? c.render(row) : (row[c.key as keyof T] as React.ReactNode)}
                  </TableCell>
                ))}
                <TableCell>
                  <Button variant="ghost" size="icon" aria-label="Row actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between p-3 border-t border-border text-caption">
        <span>Showing {filtered.length} of {rows.length}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm">Prev</Button>
          <Button variant="outline" size="sm">1</Button>
          <Button variant="ghost" size="sm">2</Button>
          <Button variant="ghost" size="sm">3</Button>
          <Button variant="ghost" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: DataTableStatus }) {
  const map = {
    active: { cls: "bg-success-soft text-success", label: "Active", dot: "bg-success" },
    pending: { cls: "bg-warning-soft text-warning", label: "Pending", dot: "bg-warning" },
    paused: { cls: "bg-muted text-muted-foreground", label: "Paused", dot: "bg-muted-foreground" },
    failed: { cls: "bg-danger-soft text-danger", label: "Failed", dot: "bg-danger" },
  } as const;
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", s.cls)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
