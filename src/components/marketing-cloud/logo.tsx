import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function CloudLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/cloud"
      className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-sky-500 to-lime-400 text-white shadow-lg shadow-sky-500/30">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-base">
        AI Marketing<span className="text-muted-foreground"> Cloud</span>
      </span>
    </Link>
  );
}
