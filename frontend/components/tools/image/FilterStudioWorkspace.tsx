"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Sun, 
  Palette, 
  Layers, 
  Download, 
  Undo2, 
  Check,
  ChevronRight,
  Info
} from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { downloadUrl, type ToolDefinition } from "@/lib/api";
import { 
  WorkspaceDropZone, 
  ProcessingOverlay, 
  ResultActionBar, 
  WorkspaceLayout,
  ControlSection,
  SliderControl
} from "./WorkspaceShared";
import { FilterCanvas, type FilterSettings } from "./FilterCanvas";
import { cn } from "@/lib/utils";

const DEFAULT_SETTINGS: FilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
  grain: 0,
  sepia: 0,
  hue: 0,
  bloom: 0,
  clarity: 0,
};

const PRESETS = [
  { id: "natural", label: "Natural", emoji: "🌿", description: "Clean, balanced look", settings: { ...DEFAULT_SETTINGS } },
  { id: "hollywood", label: "Hollywood", emoji: "🎬", description: "Teal & Orange cinematic grade", settings: { ...DEFAULT_SETTINGS, temperature: 15, tint: -10, saturation: 10, contrast: 15, exposure: 5 } },
  { id: "cyberpunk", label: "Cyberpunk", emoji: "👾", description: "Neon pink and cyber blue", settings: { ...DEFAULT_SETTINGS, temperature: -40, tint: 40, saturation: 50, contrast: 25, brightness: -10, bloom: 20 } },
  { id: "retro", label: "Retro Film", emoji: "🎞️", description: "Vintage 35mm aesthetic", settings: { ...DEFAULT_SETTINGS, sepia: 25, grain: 35, contrast: -10, exposure: 10, saturation: -15, temperature: 10 } },
  { id: "moody", label: "Moody", emoji: "🌑", description: "Dark, dramatic storytelling", settings: { ...DEFAULT_SETTINGS, exposure: -25, contrast: 40, saturation: -35, shadows: -20, vignette: 40 } },
  { id: "dreamy", label: "Dreamy", emoji: "☁️", description: "Soft highlights and bloom", settings: { ...DEFAULT_SETTINGS, bloom: 45, brightness: 10, contrast: -15, saturation: 10, vibrance: 10 } },
  { id: "neon", label: "Neon Night", emoji: "🌃", description: "Vibrant city lights", settings: { ...DEFAULT_SETTINGS, brightness: -5, contrast: 30, saturation: 60, hue: -10, bloom: 30 } },
  { id: "vintage", label: "Vintage Art", emoji: "🎨", description: "Faded classic painting", settings: { ...DEFAULT_SETTINGS, sepia: 40, contrast: -15, saturation: -20, grain: 20, clarity: -10 } },
  { id: "noir", label: "Noir", emoji: "🖤", description: "High-contrast black & white", settings: { ...DEFAULT_SETTINGS, saturation: -100, contrast: 50, exposure: -10, shadows: -20, clarity: 20 } },
  { id: "vibrant", label: "Vibrant", emoji: "🌈", description: "Pop of color and life", settings: { ...DEFAULT_SETTINGS, saturation: 40, vibrance: 50, contrast: 10, sharpness: 10 } },
  { id: "summer", label: "Summer", emoji: "☀️", description: "Golden hour warmth", settings: { ...DEFAULT_SETTINGS, temperature: 30, saturation: 20, brightness: 10, exposure: 5, vibrance: 20 } },
  { id: "winter", label: "Winter", emoji: "❄️", description: "Cool and crisp atmosphere", settings: { ...DEFAULT_SETTINGS, temperature: -30, tint: 10, saturation: -10, brightness: 5, clarity: 10 } },
  { id: "pastel", label: "Pastel", emoji: "🧁", description: "Soft, airy candy colors", settings: { ...DEFAULT_SETTINGS, brightness: 20, contrast: -20, saturation: 10, exposure: 15, bloom: 20 } },
  { id: "ethereal", label: "Ethereal", emoji: "✨", description: "Angelic glow and soft focus", settings: { ...DEFAULT_SETTINGS, bloom: 60, exposure: 10, contrast: -25, saturation: -10, clarity: -20 } },
];

export function FilterStudioWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [settings, setSettings] = useState<FilterSettings>(DEFAULT_SETTINGS);
  const [activePreset, setActivePreset] = useState("natural");
  const [hoverPreset, setHoverPreset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"light" | "color" | "effects">("light");

  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  const currentSettings = useMemo(() => {
    if (hoverPreset) {
      return PRESETS.find(p => p.id === hoverPreset)?.settings || settings;
    }
    return settings;
  }, [hoverPreset, settings]);

  const updateSetting = (key: keyof FilterSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setActivePreset("custom");
  };

  const applyPreset = (id: string) => {
    const preset = PRESETS.find(p => p.id === id);
    if (preset) {
      setSettings(preset.settings);
      setActivePreset(id);
    }
  };

  const leftSidebarContent = (
    <>
      <div className="flex items-center justify-between px-1 mb-4 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Presets Library</p>
        <button 
          onClick={() => applyPreset("natural")}
          className="text-[10px] font-bold text-accent hover:underline"
        >
          Reset All
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            onMouseEnter={() => setHoverPreset(p.id)}
            onMouseLeave={() => setHoverPreset(null)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl border p-2 text-left transition-all duration-300 w-full",
              activePreset === p.id 
                ? "border-accent/30 bg-accent/10 shadow-[0_4px_20px_rgba(91,91,214,0.1)]" 
                : "border-black/5 bg-black/[0.02] hover:border-black/10 hover:bg-black/[0.04]"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl transition-all",
              activePreset === p.id ? "bg-accent/20" : "bg-black/[0.05] group-hover:bg-black/[0.08]"
            )}>
              {p.emoji}
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-4">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "truncate text-xs font-bold transition-colors",
                  activePreset === p.id ? "text-accent" : "text-black/80"
                )}>
                  {p.label}
                </span>
              </div>
              <span className="truncate text-[9px] font-medium text-black/40">
                {p.description}
              </span>
            </div>
            {activePreset === p.id && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <motion.div layoutId="check" className="rounded-full bg-accent p-0.5 shadow-[0_0_10px_rgba(91,91,214,0.3)]">
                  <Check size={10} className="text-white" />
                </motion.div>
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );

  const rightSidebarContent = (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center gap-1 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-black/[0.03] p-1">
        {(["light", "color", "effects"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === tab ? "bg-white text-accent shadow-md" : "text-black/40 hover:text-black/60 hover:bg-black/[0.02]"
            )}
          >
            {tab === "light" && <Sun size={12} />}
            {tab === "color" && <Palette size={12} />}
            {tab === "effects" && <Layers size={12} />}
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "light" && (
            <motion.div 
              key="light"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-5"
            >
              <SliderControl label="Exposure" value={settings.exposure} min={-100} max={100} onChange={(v) => updateSetting("exposure", v)} />
              <SliderControl label="Contrast" value={settings.contrast} min={-100} max={100} onChange={(v) => updateSetting("contrast", v)} />
              <SliderControl label="Brightness" value={settings.brightness} min={-100} max={100} onChange={(v) => updateSetting("brightness", v)} />
              <SliderControl label="Clarity" value={settings.clarity} min={-100} max={100} onChange={(v) => updateSetting("clarity", v)} />
              <SliderControl label="Highlights" value={settings.highlights} min={-100} max={100} onChange={(v) => updateSetting("highlights", v)} />
              <SliderControl label="Shadows" value={settings.shadows} min={-100} max={100} onChange={(v) => updateSetting("shadows", v)} />
            </motion.div>
          )}

          {activeTab === "color" && (
            <motion.div 
              key="color"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-5"
            >
              <SliderControl label="Temp" value={settings.temperature} min={-100} max={100} onChange={(v) => updateSetting("temperature", v)} />
              <SliderControl label="Tint" value={settings.tint} min={-100} max={100} onChange={(v) => updateSetting("tint", v)} />
              <SliderControl label="Saturation" value={settings.saturation} min={-100} max={100} onChange={(v) => updateSetting("saturation", v)} />
              <SliderControl label="Vibrance" value={settings.vibrance} min={-100} max={100} onChange={(v) => updateSetting("vibrance", v)} />
              <SliderControl label="Hue" value={settings.hue} min={-180} max={180} onChange={(v) => updateSetting("hue", v)} />
            </motion.div>
          )}

          {activeTab === "effects" && (
            <motion.div 
              key="effects"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-5"
            >
              <SliderControl label="Bloom" value={settings.bloom} min={0} max={100} onChange={(v) => updateSetting("bloom", v)} />
              <SliderControl label="Vignette" value={settings.vignette} min={0} max={100} onChange={(v) => updateSetting("vignette", v)} />
              <SliderControl label="Grain" value={settings.grain} min={0} max={100} onChange={(v) => updateSetting("grain", v)} />
              <SliderControl label="Blur" value={settings.blur} min={0} max={100} onChange={(v) => updateSetting("blur", v)} />
              <SliderControl label="Sepia" value={settings.sepia} min={0} max={100} onChange={(v) => updateSetting("sepia", v)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={() => upload(originalFile!.file, { ...settings })}
          disabled={isProcessing}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-purple-600 py-4 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="relative flex items-center justify-center gap-2">
            {isProcessing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Download size={18} />
                <span>Export Master</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <WorkspaceLayout
      title="Filter Studio Pro"
      description="Professional real-time cinematic color grading and image manipulation suite."
      badge="Live Engine · GPU Accelerated"
    >
      <div className="flex h-full w-full gap-4 overflow-hidden">
        {/* Left Side: Presets */}
        {originalFile && (
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-64 h-full shrink-0 flex flex-col rounded-3xl border border-black/5 bg-white/95 backdrop-blur-3xl shadow-xl overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-y-auto minimal-scrollbar p-4 pr-3">
              {leftSidebarContent}
            </div>
          </motion.aside>
        )}

        {/* Center: Live Preview */}
        <div className="relative flex flex-1 flex-col gap-4 min-w-0 overflow-hidden">
          {!originalFile ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent/20 to-purple-500/10">
                <Sparkles size={48} strokeWidth={1} className="text-accent" />
              </div>
              <div className="w-full max-w-xl">
                <WorkspaceDropZone
                  accepted={tool.accepted}
                  onFile={(f) => upload(f, { ...settings })}
                />
              </div>
              <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-white/20">
                <span>Real-time Previews</span>
                <span>4K Export</span>
                <span>GPU Accelerated</span>
              </div>
            </div>
          ) : (
            <div className="relative flex-1 min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
              <FilterCanvas 
                image={originalFile.previewUrl} 
                settings={currentSettings} 
                compareMode={false}
              />
              
              {/* Floating Toolbar */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl bg-black/40 p-1.5 backdrop-blur-xl border border-white/5 shadow-2xl">
                <button
                  onClick={() => applyPreset("natural")}
                  className="flex h-9 items-center gap-2 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-white transition-all"
                >
                  <Undo2 size={14} />
                  Reset
                </button>
              </div>
            </div>
          )}

          {isDone && <ResultActionBar toolkit={toolkit} job={job!} onReset={() => window.location.reload()} />}
        </div>

        {/* Right Side: Controls */}
        {originalFile && (
          <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 h-full shrink-0 flex flex-col rounded-3xl border border-black/5 bg-white/95 backdrop-blur-3xl shadow-xl overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-y-auto minimal-scrollbar p-5 pr-4">
              {rightSidebarContent}
            </div>
          </motion.aside>
        )}
      </div>

      <AnimatePresence>
        {isProcessing && <ProcessingOverlay label="Exporting High-Res Master..." />}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}
