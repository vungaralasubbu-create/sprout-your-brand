import * as React from "react";
import { Check, Copy, Facebook, Linkedin, Mail, MessageCircle, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Share bar with LinkedIn, X, Facebook, WhatsApp, Email, and Copy Link.
 * Uses SSR-safe URL derivation and opens sharers in a new tab.
 */
export function ShareBar({
  url,
  title,
  summary,
  className,
}: {
  url: string;
  title: string;
  summary?: string | null;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [copyFailed, setCopyFailed] = React.useState(false);
  const text = summary?.trim() || title;

  const enc = encodeURIComponent;
  const shareUrls = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${enc(`${title} — ${url}`)}`,
    email: `mailto:?subject=${enc(title)}&body=${enc(`${text}\n\n${url}`)}`,
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  };

  const items: Array<{ label: string; href?: string; onClick?: () => void; icon: React.ReactNode; brandClass: string }> = [
    { label: "Share on LinkedIn", href: shareUrls.linkedin, icon: <Linkedin className="size-4" />, brandClass: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]" },
    { label: "Share on X", href: shareUrls.twitter, icon: <Twitter className="size-4" />, brandClass: "hover:bg-foreground/10" },
    { label: "Share on Facebook", href: shareUrls.facebook, icon: <Facebook className="size-4" />, brandClass: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]" },
    { label: "Share on WhatsApp", href: shareUrls.whatsapp, icon: <MessageCircle className="size-4" />, brandClass: "hover:bg-[#25D366]/10 hover:text-[#25D366]" },
    { label: "Share via Email", href: shareUrls.email, icon: <Mail className="size-4" />, brandClass: "hover:bg-primary/10 hover:text-primary" },
  ];

  return (
    <div className={cn("rounded-2xl border bg-card p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Share this article</div>
          <div className="text-xs text-muted-foreground">
            {copied ? "Link copied" : copyFailed ? "Copy failed — please copy the address manually." : "Post to your network or send a private link."}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={it.label}
              title={it.label}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors",
                it.brandClass,
              )}
            >
              {it.icon}
            </a>
          ))}
          <Button variant="outline" size="sm" onClick={copy} className="ml-1" aria-label="Copy article link">
            {copied ? <><Check className="size-4 mr-1.5" /> Copied</> : <><Copy className="size-4 mr-1.5" /> Copy Link</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
