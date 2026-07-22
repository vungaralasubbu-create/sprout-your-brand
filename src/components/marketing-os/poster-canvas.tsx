/**
 * PosterCanvas — renders a poster with a background artwork image plus
 * crisp HTML/CSS text overlays (headline / subtitle / CTA / description).
 *
 * The image model only produces the artwork; every word is drawn in the
 * browser so it stays perfectly readable and fully editable.
 *
 * A companion `downloadPosterPng(poster, filename)` exports the same
 * composition to a real PNG using the Canvas 2D API — no extra deps.
 */
import { cn } from "@/lib/utils";

export type PosterModel = {
  title?: string;
  concept?: string;
  headline?: string;
  subtitle?: string;
  cta?: string;
  description?: string;
  dominant_colors?: string[];
  text_color?: string;
  accent_color?: string;
  layout?: string;
  image_url?: string;
  image_error?: string;
  brand_name?: string;
};

function safeColor(c: string | undefined, fallback: string) {
  if (!c || typeof c !== "string") return fallback;
  return c.trim() || fallback;
}

export function PosterCanvas({
  poster,
  className,
}: {
  poster: PosterModel;
  className?: string;
}) {
  const text = safeColor(poster.text_color, "#ffffff");
  const accent = safeColor(poster.accent_color, safeColor(poster.dominant_colors?.[0], "#111111"));
  const layout = poster.layout ?? "centered";

  const align =
    layout === "top_left"
      ? "items-start justify-start text-left"
      : layout === "bottom_bar"
        ? "items-end justify-end text-left"
        : layout === "split"
          ? "items-center justify-start text-left"
          : "items-center justify-center text-center";

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-2xl bg-neutral-900",
        className,
      )}
    >
      {poster.image_url ? (
        <img
          src={poster.image_url}
          alt={poster.title ?? "Poster background"}
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${safeColor(poster.dominant_colors?.[0], "#111827")}, ${safeColor(poster.dominant_colors?.[1], "#4c1d95")})`,
          }}
        />
      )}
      {/* Legibility scrim so text stays crisp on any artwork */}
      <div
        className="absolute inset-0"
        style={{
          background:
            layout === "bottom_bar"
              ? "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)"
              : layout === "top_left"
                ? "linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 65%)"
                : "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        className={cn(
          "absolute inset-0 flex flex-col gap-3 p-6 sm:p-8",
          align,
        )}
        style={{ color: text }}
      >
        {poster.brand_name ? (
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] opacity-80">
            {poster.brand_name}
          </div>
        ) : null}
        {poster.headline ? (
          <h3
            className="font-bold leading-[1.05] tracking-tight"
            style={{
              fontSize: "clamp(1.6rem, 5.5cqw, 3.2rem)",
              textShadow: "0 2px 20px rgba(0,0,0,0.35)",
              containerType: "inline-size",
            }}
          >
            {poster.headline}
          </h3>
        ) : null}
        {poster.subtitle ? (
          <p
            className="font-medium opacity-95"
            style={{ fontSize: "clamp(0.85rem, 2.2cqw, 1.1rem)" }}
          >
            {poster.subtitle}
          </p>
        ) : null}
        {poster.cta ? (
          <div
            className="mt-2 inline-flex self-start rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
            style={{
              backgroundColor: accent,
              color: safeColor(poster.text_color, "#ffffff"),
              alignSelf:
                layout === "centered"
                  ? "center"
                  : layout === "bottom_bar" || layout === "top_left" || layout === "split"
                    ? "flex-start"
                    : "center",
            }}
          >
            {poster.cta} →
          </div>
        ) : null}
        {poster.description ? (
          <p
            className="mt-auto max-w-[85%] opacity-85"
            style={{ fontSize: "clamp(0.7rem, 1.6cqw, 0.85rem)" }}
          >
            {poster.description}
          </p>
        ) : null}
      </div>
      {poster.image_error ? (
        <div className="absolute top-2 right-2 rounded bg-red-500/80 px-2 py-1 text-[10px] text-white">
          image failed
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------- PNG export ------------------------- */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) current = test;
    else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function downloadPosterPng(poster: PosterModel, filename = "poster.png") {
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const text = safeColor(poster.text_color, "#ffffff");
  const accent = safeColor(poster.accent_color, safeColor(poster.dominant_colors?.[0], "#111111"));
  const layout = poster.layout ?? "centered";

  // Background
  if (poster.image_url) {
    try {
      const img = await loadImage(poster.image_url);
      // cover fit
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
    } catch {
      ctx.fillStyle = safeColor(poster.dominant_colors?.[0], "#111827");
      ctx.fillRect(0, 0, SIZE, SIZE);
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    grad.addColorStop(0, safeColor(poster.dominant_colors?.[0], "#111827"));
    grad.addColorStop(1, safeColor(poster.dominant_colors?.[1], "#4c1d95"));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  // Scrim
  const scrim = ctx.createLinearGradient(0, 0, 0, SIZE);
  if (layout === "bottom_bar") {
    scrim.addColorStop(0, "rgba(0,0,0,0)");
    scrim.addColorStop(0.45, "rgba(0,0,0,0.15)");
    scrim.addColorStop(1, "rgba(0,0,0,0.75)");
  } else {
    scrim.addColorStop(0, "rgba(0,0,0,0.35)");
    scrim.addColorStop(1, "rgba(0,0,0,0.55)");
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const padding = 80;
  const contentW = SIZE - padding * 2;
  ctx.fillStyle = text;
  ctx.textBaseline = "top";

  const isCenter = layout === "centered";
  const alignX: CanvasTextAlign = isCenter ? "center" : "left";
  ctx.textAlign = alignX;
  const startX = isCenter ? SIZE / 2 : padding;

  let cursorY = layout === "bottom_bar" ? SIZE - padding - 340 : padding;

  if (poster.brand_name) {
    ctx.font = "600 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(poster.brand_name.toUpperCase(), startX, cursorY);
    cursorY += 44;
  }

  if (poster.headline) {
    ctx.font = "800 88px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const lines = wrapText(ctx, poster.headline, contentW);
    for (const l of lines) {
      ctx.fillText(l, startX, cursorY);
      cursorY += 96;
    }
    cursorY += 12;
  }

  if (poster.subtitle) {
    ctx.font = "500 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const lines = wrapText(ctx, poster.subtitle, contentW);
    for (const l of lines) {
      ctx.fillText(l, startX, cursorY);
      cursorY += 42;
    }
    cursorY += 20;
  }

  if (poster.cta) {
    ctx.font = "700 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const label = `${poster.cta}  →`;
    const metrics = ctx.measureText(label);
    const btnW = metrics.width + 56;
    const btnH = 60;
    const btnX = isCenter ? (SIZE - btnW) / 2 : padding;
    ctx.fillStyle = accent;
    // rounded rect
    const r = 30;
    ctx.beginPath();
    ctx.moveTo(btnX + r, cursorY);
    ctx.lineTo(btnX + btnW - r, cursorY);
    ctx.quadraticCurveTo(btnX + btnW, cursorY, btnX + btnW, cursorY + r);
    ctx.lineTo(btnX + btnW, cursorY + btnH - r);
    ctx.quadraticCurveTo(btnX + btnW, cursorY + btnH, btnX + btnW - r, cursorY + btnH);
    ctx.lineTo(btnX + r, cursorY + btnH);
    ctx.quadraticCurveTo(btnX, cursorY + btnH, btnX, cursorY + btnH - r);
    ctx.lineTo(btnX, cursorY + r);
    ctx.quadraticCurveTo(btnX, cursorY, btnX + r, cursorY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = text;
    ctx.textAlign = "center";
    ctx.fillText(label, btnX + btnW / 2, cursorY + 16);
    ctx.textAlign = alignX;
    cursorY += btnH + 24;
  }

  if (poster.description) {
    ctx.fillStyle = text;
    ctx.globalAlpha = 0.85;
    ctx.font = "400 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const lines = wrapText(ctx, poster.description, contentW);
    const baseY = SIZE - padding - lines.length * 30;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], startX, baseY + i * 30);
    }
    ctx.globalAlpha = 1;
  }

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
