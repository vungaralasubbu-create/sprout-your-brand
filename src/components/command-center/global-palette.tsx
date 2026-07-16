/**
 * Global Command Palette (⌘K / Ctrl+K)
 *
 * Mounts once at the root. Listens for the global shortcut and opens
 * a fuzzy-navigable palette over the registry. Role is inferred from the
 * current pathname; items are filtered accordingly. Navigation goes
 * through the router so it works inside every layout.
 */

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  groupItems,
  inferRole,
  itemsForRole,
  type CommandItem as Item,
} from "@/lib/command-center/registry";

const GROUP_LABEL: Record<Item["group"], string> = {
  action: "Quick Actions",
  nav: "Navigate",
  content: "Learn & Content",
  settings: "Settings",
};

export function GlobalPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const role = useMemo(() => inferRole(pathname), [pathname]);
  const items = useMemo(() => itemsForRole(role), [role]);
  const grouped = useMemo(() => groupItems(items), [items]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    // registry paths are validated at runtime, so we bypass typed navigation
    navigate({ to: to as never }).catch(() => {
      window.location.href = to;
    });
  };

  const renderGroup = (key: Item["group"]) => {
    const list = grouped[key];
    if (list.length === 0) return null;
    return (
      <CommandGroup key={key} heading={GROUP_LABEL[key]}>
        {list.map((it) => {
          const Icon = it.icon ?? Sparkles;
          return (
            <CommandItem
              key={it.id}
              value={`${it.label} ${it.keywords?.join(" ") ?? ""} ${it.description ?? ""}`}
              onSelect={() => go(it.to)}
              className="flex items-center gap-3"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-1 items-center justify-between gap-3">
                <span className="text-sm">{it.label}</span>
                <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
                  {it.to}
                </span>
              </div>
            </CommandItem>
          );
        })}
      </CommandGroup>
    );
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search everything on Glintr"
    >
      <CommandInput placeholder="Search programs, dashboards, actions…  ⌘K anywhere" />
      <CommandList>
        <CommandEmpty>No matches. Try another keyword.</CommandEmpty>
        {renderGroup("action")}
        <CommandSeparator />
        {renderGroup("nav")}
        <CommandSeparator />
        {renderGroup("content")}
        <CommandSeparator />
        {renderGroup("settings")}
      </CommandList>
    </CommandDialog>
  );
}
