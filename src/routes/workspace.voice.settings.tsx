import { createFileRoute } from "@tanstack/react-router";
import { useVoiceSettings } from "@/lib/voice/store";
import { TtsBar } from "@/components/voice/tts-player";

const VOICES = ["alloy", "sage", "verse", "coral", "ash"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (preview)" },
  { code: "te", label: "Telugu (preview)" },
  { code: "ta", label: "Tamil (preview)" },
  { code: "kn", label: "Kannada (preview)" },
  { code: "ml", label: "Malayalam (preview)" },
  { code: "mr", label: "Marathi (preview)" },
  { code: "bn", label: "Bengali (preview)" },
];

function SettingsPage() {
  const { settings, update } = useVoiceSettings();
  const sample = "Welcome to Glintr Voice. This is a preview of the selected voice and speed.";
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Voice settings</h2>
        <p className="text-sm text-muted-foreground">Personalize how Glintr sounds and behaves.</p>
      </div>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Voice style</label>
        <div className="flex flex-wrap gap-2">
          {VOICES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update({ voice: v })}
              className={`rounded-full border px-4 py-1.5 text-sm capitalize ${
                settings.voice === v ? "border-foreground bg-foreground text-background" : "border-border/60 hover:bg-muted/70"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Playback speed</label>
          <span className="text-sm font-medium">{settings.speed.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={0.75}
          max={1.5}
          step={0.05}
          value={settings.speed}
          onChange={(e) => update({ speed: Number(e.target.value) })}
          className="mt-3 w-full"
          aria-label="Playback speed"
        />
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Subtitle size</label>
        <div className="flex gap-2">
          {(["sm", "md", "lg"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ subtitleSize: s })}
              className={`rounded-full border px-4 py-1.5 text-sm uppercase ${
                settings.subtitleSize === s ? "border-foreground bg-foreground text-background" : "border-border/60 hover:bg-muted/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Language</label>
        <select
          value={settings.language}
          onChange={(e) => update({ language: e.target.value })}
          className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-muted-foreground">
          English is fully supported today. Indian languages are marked preview — spoken output currently uses English voices while
          transcription auto-detects the spoken language.
        </p>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
        <div className="grid gap-3">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Auto transcript</span>
            <input
              type="checkbox"
              checked={settings.autoTranscript}
              onChange={(e) => update({ autoTranscript: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Auto save dictated notes to Workspace</span>
            <input
              type="checkbox"
              checked={settings.autoSaveNotes}
              onChange={(e) => update({ autoSaveNotes: e.target.checked })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
        <p className="mt-2 text-sm text-muted-foreground">Test the current voice and speed with a sample line.</p>
        <div className="mt-3">
          <TtsBar text={sample} voice={settings.voice} speed={settings.speed} label="Play sample" />
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/workspace/voice/settings")({
  component: SettingsPage,
});
