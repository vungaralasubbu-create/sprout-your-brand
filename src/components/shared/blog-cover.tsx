/**
 * BlogCover — deterministic visual for a blog post.
 *
 * Renders <img> when the post has an uploaded image (hero / featured / thumbnail).
 * Otherwise generates a professional gradient illustration derived from the post's
 * slug and topic — never a plain placeholder background.
 *
 * Priority for image src:
 *   variant="hero"    -> hero_image_url | featured_image_url | thumbnail_url
 *   variant="card"    -> thumbnail_url  | featured_image_url | hero_image_url
 *   variant="social"  -> social_image_url | hero_image_url | featured_image_url
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/lib/blog";

export type BlogCoverVariant = "hero" | "card" | "social";

interface BlogCoverProps {
  post: Pick<
    BlogPost,
    | "slug"
    | "title"
    | "hero_image_url"
    | "featured_image_url"
    | "thumbnail_url"
    | "social_image_url"
    | "topic"
    | "category"
  >;
  variant?: BlogCoverVariant;
  eager?: boolean;
  className?: string;
  /** Force generated illustration even if an image URL exists. */
  forceGenerated?: boolean;
}

const PALETTES: Array<{ from: string; via: string; to: string; ink: string }> = [
  { from: "#0F1E3D", via: "#123B6B", to: "#0AB6D6", ink: "#B7FFEA" }, // navy → cyan
  { from: "#0B1D3A", via: "#1E4FA6", to: "#4EE1B4", ink: "#E6FFF6" }, // azure → mint
  { from: "#111827", via: "#2937B0", to: "#8B5CF6", ink: "#F5E9FF" }, // indigo → violet
  { from: "#0A1E24", via: "#0F5B65", to: "#B7F04B", ink: "#EEFFC7" }, // teal → lime
  { from: "#1A0F2E", via: "#5B1FA8", to: "#FF6BAA", ink: "#FFE6F0" }, // purple → pink
  { from: "#0E2231", via: "#12556B", to: "#F5B849", ink: "#FFF3D9" }, // teal → amber
  { from: "#111A2F", via: "#2A3B6B", to: "#5EE7DF", ink: "#DEFFFB" }, // slate → aqua
  { from: "#1B0F1F", via: "#8A1F5A", to: "#F97066", ink: "#FFE1DC" }, // magenta → coral
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickPalette(seed: string) {
  return PALETTES[hashCode(seed) % PALETTES.length];
}

function initials(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "GL";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Topic style → decorative icon path (small set) */
function iconPath(style: string | null | undefined): React.ReactNode {
  switch (style) {
    case "nodes":
      return (
        <>
          <circle cx="20" cy="24" r="4" />
          <circle cx="60" cy="16" r="4" />
          <circle cx="44" cy="52" r="4" />
          <path d="M22 26l20-8M58 20L46 48M22 26l20 24" strokeWidth="1.5" />
        </>
      );
    case "network":
      return (
        <>
          <circle cx="40" cy="32" r="6" />
          <path d="M40 6v14M40 44v14M12 32h14M54 32h14" strokeWidth="1.5" />
        </>
      );
    case "circuit":
      return (
        <>
          <path d="M8 32h14v-14h14v28h14v-14h14" strokeWidth="1.5" />
          <circle cx="64" cy="18" r="2.5" />
        </>
      );
    case "flow":
      return (
        <>
          <path d="M10 20h40a10 10 0 010 20H10" strokeWidth="1.5" />
          <path d="M50 40h20" strokeWidth="1.5" />
        </>
      );
    case "motion":
      return (
        <>
          <path d="M6 20h60M6 34h44M6 48h52" strokeWidth="1.5" />
          <circle cx="68" cy="20" r="3" />
        </>
      );
    case "structure":
      return (
        <>
          <path d="M8 56V12l32 20 32-20v44" strokeWidth="1.5" />
        </>
      );
    case "path":
      return <path d="M6 52c14 0 14-40 28-40s14 40 28 40" strokeWidth="1.5" />;
    case "grid":
    default:
      return (
        <>
          <rect x="8" y="8" width="20" height="20" rx="3" strokeWidth="1.5" />
          <rect x="36" y="8" width="20" height="20" rx="3" strokeWidth="1.5" />
          <rect x="8" y="36" width="20" height="20" rx="3" strokeWidth="1.5" />
          <rect x="36" y="36" width="20" height="20" rx="3" strokeWidth="1.5" />
        </>
      );
  }
}

function pickUrl(post: BlogCoverProps["post"], variant: BlogCoverVariant): string | null {
  const hero = post.hero_image_url ?? null;
  const feat = post.featured_image_url ?? null;
  const thumb = post.thumbnail_url ?? null;
  const social = post.social_image_url ?? null;
  if (variant === "card") return thumb ?? feat ?? hero ?? null;
  if (variant === "social") return social ?? hero ?? feat ?? null;
  return hero ?? feat ?? thumb ?? null;
}

export function BlogCover({
  post,
  variant = "card",
  eager = false,
  className,
  forceGenerated = false,
}: BlogCoverProps) {
  const url = forceGenerated ? null : pickUrl(post, variant);
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : undefined}
        width={1600}
        height={1000}
        className={cn(
          "size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none",
          className,
        )}
      />
    );
  }

  const seed = `${post.slug}|${post.topic?.slug ?? ""}`;
  const palette = pickPalette(seed);
  const initial = initials(post.title);
  const topicName = post.topic?.name ?? post.category?.name ?? "Glintr Insights";
  const iconStyle = post.topic?.visual_style ?? "grid";
  const gradId = `bcg-${hashCode(seed).toString(36)}`;
  const noiseId = `bcn-${hashCode(seed).toString(36)}`;
  const glowX = 20 + (hashCode(seed + "x") % 60);
  const glowY = 15 + (hashCode(seed + "y") % 40);

  return (
    <svg
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Glintr Insights — ${post.title}`}
      className={cn("size-full block", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="55%" stopColor={palette.via} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
        <radialGradient id={`${gradId}-glow`} cx="0.3" cy="0.3" r="0.8">
          <stop offset="0%" stopColor={palette.to} stopOpacity="0.55" />
          <stop offset="100%" stopColor={palette.to} stopOpacity="0" />
        </radialGradient>
        <pattern id={noiseId} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 40L40 0" stroke={palette.ink} strokeOpacity="0.05" strokeWidth="1" />
          <path d="M-10 10L10 -10M30 50L50 30" stroke={palette.ink} strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Base */}
      <rect width="800" height="500" fill={`url(#${gradId})`} />
      {/* Grid pattern */}
      <rect width="800" height="500" fill={`url(#${noiseId})`} />
      {/* Soft glow */}
      <rect width="800" height="500" fill={`url(#${gradId}-glow)`} />
      {/* Decorative arcs */}
      <g stroke={palette.ink} strokeOpacity="0.18" fill="none">
        <circle cx={glowX * 8} cy={glowY * 8} r="180" />
        <circle cx={glowX * 8} cy={glowY * 8} r="260" />
        <circle cx={glowX * 8} cy={glowY * 8} r="340" />
      </g>

      {/* Topic icon (top-right) */}
      <g
        transform="translate(600, 60)"
        stroke={palette.ink}
        strokeOpacity="0.85"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {iconPath(iconStyle)}
      </g>

      {/* Faint background initials */}
      <text
        x="60"
        y="470"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="360"
        fontWeight="700"
        fill={palette.ink}
        fillOpacity="0.06"
        letterSpacing="-8"
      >
        {initial}
      </text>

      {/* Topic label */}
      <g fontFamily="ui-sans-serif, system-ui, -apple-system, Inter, sans-serif" fill={palette.ink}>
        <text x="60" y="90" fontSize="16" fontWeight="600" letterSpacing="3" opacity="0.85">
          {topicName.toUpperCase()}
        </text>
        <line x1="60" y1="108" x2="120" y2="108" stroke={palette.ink} strokeOpacity="0.6" strokeWidth="2" />
        {/* Title (wrapped as 2 short lines from title) */}
        <TitleWrapped title={post.title} palette={palette} />
        <text x="60" y="452" fontSize="14" letterSpacing="2" opacity="0.7">
          GLINTR · INSIGHTS
        </text>
      </g>
    </svg>
  );
}

/** Rudimentary two-line wrap for large title in cover. */
function TitleWrapped({
  title,
  palette,
}: {
  title: string;
  palette: { ink: string };
}) {
  const words = title.split(/\s+/);
  const target = 22;
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > target && line) {
      lines.push(line);
      line = w;
      if (lines.length === 2) break;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line && lines.length < 3) lines.push(line);
  const clipped = lines.slice(0, 3);
  return (
    <>
      {clipped.map((l, i) => (
        <text
          key={i}
          x="60"
          y={190 + i * 62}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="52"
          fontWeight="700"
          fill={palette.ink}
        >
          {l}
        </text>
      ))}
    </>
  );
}
