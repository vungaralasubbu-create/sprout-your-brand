import * as React from "react";
import { TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PartnerCardProps {
  name: string;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  earnings: string;
  students?: number;
  avatar?: string;
  city?: string;
  className?: string;
}

const tierMap = {
  Bronze: "bg-warning-soft text-warning",
  Silver: "bg-muted text-muted-foreground",
  Gold: "bg-warning-soft text-warning",
  Platinum: "bg-info-soft text-info",
  Diamond: "bg-primary-soft text-primary",
} as const;

export function PartnerCard({
  name,
  tier,
  earnings,
  students,
  avatar,
  city,
  className,
}: PartnerCardProps) {
  return (
    <article className={cn("card-elevated hover:card-elevated-hover p-5 flex flex-col gap-4", className)}>
      <div className="flex items-center gap-3">
        <Avatar className="size-12 ring-2 ring-primary/20">
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{name}</p>
          {city ? <p className="text-caption">{city}</p> : null}
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tierMap[tier])}>
          {tier}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        <div>
          <p className="text-label">Earnings</p>
          <p className="text-mono text-base font-semibold inline-flex items-center gap-1">
            {earnings}
            <TrendingUp className="size-3.5 text-success" />
          </p>
        </div>
        <div>
          <p className="text-label">Students</p>
          <p className="text-mono text-base font-semibold">
            {students?.toLocaleString() ?? "—"}
          </p>
        </div>
      </div>
    </article>
  );
}
