import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  LayoutDashboard,
  BarChart3,
  Rocket,
  Palette,
} from "lucide-react";

const SLIDES = [
  {
    key: "dashboard",
    icon: LayoutDashboard,
    tag: "Marketing Dashboard",
    title: "One workspace. Every channel.",
    body: "Live campaigns, publishing pipeline, and revenue signals in a single glance.",
    accent: "from-sky-400/30 via-cyan-300/20 to-transparent",
    metrics: [
      { label: "Active campaigns", value: "12" },
      { label: "Assets in review", value: "48" },
      { label: "This week", value: "+37%" },
    ],
  },
  {
    key: "copilot",
    icon: MessageSquare,
    tag: "AI Copilot",
    title: "Chat your campaign into existence.",
    body: '"Launch my AI SaaS across Instagram, LinkedIn and email — for the next 30 days."',
    accent: "from-violet-400/30 via-fuchsia-300/20 to-transparent",
    metrics: [
      { label: "Prompts today", value: "24" },
      { label: "Actions run", value: "138" },
      { label: "Time saved", value: "9.2h" },
    ],
  },
  {
    key: "builder",
    icon: Rocket,
    tag: "Campaign Builder",
    title: "From brief to publish in minutes.",
    body: "Strategy, posts, images, landing pages and emails — generated as one campaign.",
    accent: "from-emerald-400/30 via-lime-300/20 to-transparent",
    metrics: [
      { label: "Assets generated", value: "312" },
      { label: "Channels", value: "9" },
      { label: "Approvals", value: "94%" },
    ],
  },
  {
    key: "analytics",
    icon: BarChart3,
    tag: "Analytics",
    title: "Attribution that reads like a story.",
    body: "Track every asset from generation to revenue across every connected channel.",
    accent: "from-amber-400/30 via-orange-300/20 to-transparent",
    metrics: [
      { label: "Reach", value: "1.4M" },
      { label: "CTR", value: "4.8%" },
      { label: "Pipeline", value: "$186k" },
    ],
  },
  {
    key: "landing",
    icon: Palette,
    tag: "Landing Pages",
    title: "On-brand pages, on demand.",
    body: "Your logo, colours and typography — applied to every hero, form and section.",
    accent: "from-rose-400/30 via-pink-300/20 to-transparent",
    metrics: [
      { label: "Pages live", value: "24" },
      { label: "A/B tests", value: "6" },
      { label: "Conv. rate", value: "11.2%" },
    ],
  },
  {
    key: "workspace",
    icon: Sparkles,
    tag: "Project Workspace",
    title: "Every asset, one command palette away.",
    body: "Review, refine and publish across your team — with AI in every corner.",
    accent: "from-cyan-400/30 via-teal-300/20 to-transparent",
    metrics: [
      { label: "Team members", value: "8" },
      { label: "Comments", value: "42" },
      { label: "Shipped", value: "127" },
    ],
  },
];

export function AuthPreview() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 4200);
    return () => clearInterval(t);
  }, []);
  const slide = SLIDES[i];
  const Icon = slide.icon;

  return (
    <div className="relative hidden h-full w-full overflow-hidden bg-[#05070d] lg:block">
      {/* Ambient gradients */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent} transition-colors duration-1000`} />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex h-full flex-col justify-between p-12 text-white">
        {/* Top badge */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live preview
        </div>

        {/* Floating cards */}
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.key}
              initial={{ opacity: 0, y: 20, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20, rotate: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-full max-w-md">
                {/* Main card */}
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-white/70">
                    <Icon className="h-3.5 w-3.5" />
                    {slide.tag}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold leading-tight">{slide.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{slide.body}</p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {slide.metrics.map((m) => (
                      <div key={m.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                        <div className="text-xs text-white/50">{m.label}</div>
                        <div className="mt-1 text-lg font-semibold">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Fake chart */}
                  <div className="mt-5 flex h-16 items-end gap-1">
                    {Array.from({ length: 28 }).map((_, k) => (
                      <motion.div
                        key={k}
                        initial={{ height: 4 }}
                        animate={{ height: 8 + Math.abs(Math.sin(k * 0.7 + i)) * 48 }}
                        transition={{ delay: k * 0.02, duration: 0.6 }}
                        className="flex-1 rounded-sm bg-gradient-to-t from-white/10 to-white/60"
                      />
                    ))}
                  </div>
                </div>

                {/* Floating accent card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-6 -right-4 rounded-xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-xl shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
                    <div>
                      <div className="text-xs font-medium">AI Marketing Agent</div>
                      <div className="text-[10px] text-white/60">Ready to launch your campaign</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom tab indicators */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((s, k) => (
              <button
                key={s.key}
                aria-label={s.tag}
                onClick={() => setI(k)}
                className={`h-1.5 rounded-full transition-all ${
                  k === i ? "w-8 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-white/50">
            {String(i + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </div>
        </div>
      </div>
    </div>
  );
}
