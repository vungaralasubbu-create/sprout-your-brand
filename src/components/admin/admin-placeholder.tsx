import { Construction } from "lucide-react";

export function AdminPlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-dashed border-border/70 bg-white p-10 text-center">
        <div className="mx-auto size-10 rounded-lg bg-surface-1 flex items-center justify-center mb-4">
          <Construction className="size-5 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {description ?? "This section will be built in a later phase."}
        </p>
      </div>
    </div>
  );
}
