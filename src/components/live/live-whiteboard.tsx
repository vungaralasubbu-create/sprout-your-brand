import { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

const COLORS = ["#0f172a", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

export function LiveWhiteboard({ classId }: { classId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(2.5);
  const [stickies, setStickies] = useState<{ id: string; x: number; y: number; text: string }[]>([]);

  const storageKey = `glintr.live.wb.${classId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStrokes(parsed.strokes ?? []);
        setStickies(parsed.stickies ?? []);
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ strokes, stickies }));
    } catch {}
    redraw();
  }, [strokes, stickies]); // eslint-disable-line react-hooks/exhaustive-deps

  function redraw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/70 p-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Colour ${c}`}
              className={`h-6 w-6 rounded-md border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Size</span>
          <input type="range" min={1} max={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        </label>
        <button
          className="rounded-lg border border-border/60 bg-card/70 px-3 py-1.5 hover:bg-muted"
          onClick={() =>
            setStickies((s) => [
              ...s,
              { id: Math.random().toString(36).slice(2, 8), x: 40 + s.length * 24, y: 40 + s.length * 24, text: "Sticky note" },
            ])
          }
        >
          + Sticky
        </button>
        <button
          className="rounded-lg border border-border/60 bg-card/70 px-3 py-1.5 hover:bg-muted"
          onClick={() => {
            setStrokes([]);
            setStickies([]);
          }}
        >
          Clear
        </button>
        <button
          className="rounded-lg border border-border/60 bg-card/70 px-3 py-1.5 hover:bg-muted"
          onClick={() => {
            const c = canvasRef.current;
            if (!c) return;
            const link = document.createElement("a");
            link.download = `whiteboard-${classId}.png`;
            link.href = c.toDataURL("image/png");
            link.click();
          }}
        >
          Export PNG
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border/60 bg-white">
        <canvas
          ref={canvasRef}
          width={1600}
          height={900}
          className="h-full w-full touch-none"
          onPointerDown={(e) => {
            setDrawing(true);
            setStrokes((s) => [...s, { color, width, points: [pos(e)] }]);
          }}
          onPointerMove={(e) => {
            if (!drawing) return;
            setStrokes((s) => {
              const copy = s.slice();
              copy[copy.length - 1] = { ...copy[copy.length - 1], points: [...copy[copy.length - 1].points, pos(e)] };
              return copy;
            });
          }}
          onPointerUp={() => setDrawing(false)}
          onPointerLeave={() => setDrawing(false)}
        />
        {stickies.map((s) => (
          <textarea
            key={s.id}
            defaultValue={s.text}
            onBlur={(e) => setStickies((cur) => cur.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))}
            className="absolute h-24 w-40 resize rounded-md bg-yellow-200/90 p-2 text-xs text-slate-900 shadow-md"
            style={{ left: `${(s.x / 1600) * 100}%`, top: `${(s.y / 900) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
