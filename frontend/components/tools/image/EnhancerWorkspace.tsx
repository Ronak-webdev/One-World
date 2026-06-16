"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { downloadUrl, type ToolDefinition } from "@/lib/api";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import {
  WorkspaceDropZone,
  ProcessingOverlay,
  ResultActionBar,
  WorkspaceLayout,
  ControlSection,
  ToggleButton,
  SelectGrid,
  SliderControl,
} from "./WorkspaceShared";

const PRESETS = [
  { id: "natural", label: "Natural" },
  { id: "cinematic", label: "Cinematic" },
  { id: "studio", label: "Studio" },
  { id: "ultra", label: "Ultra Sharp" },
];

export function EnhancerWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [preset, setPreset] = useState("natural");
  const [faceRestore, setFaceRestore] = useState(false);
  const [noiseReduction, setNoiseReduction] = useState(40);
  const [intensity, setIntensity] = useState(70);
  const [hdr, setHdr] = useState(false);

  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  const sidebar = (
    <div>
      <ControlSection title="Enhancement Preset">
        <SelectGrid options={PRESETS} value={preset} onChange={setPreset} />
      </ControlSection>

      <ControlSection title="Intensity">
        <SliderControl label="AI Strength" value={intensity} onChange={setIntensity} />
        <SliderControl label="Noise Reduction" value={noiseReduction} onChange={setNoiseReduction} />
      </ControlSection>

      <ControlSection title="AI Features">
        <ToggleButton
          label={`Face Restoration ${faceRestore ? "✓" : ""}`}
          active={faceRestore}
          onClick={() => setFaceRestore(!faceRestore)}
        />
        <ToggleButton
          label={`HDR Enhancement ${hdr ? "✓" : ""}`}
          active={hdr}
          onClick={() => setHdr(!hdr)}
        />
      </ControlSection>

      {/* Preset description */}
      <div className="rounded-xl border border-black/5 bg-white/60 p-3 text-xs font-medium text-black/40">
        {preset === "natural" && "Subtle, true-to-life enhancement with natural color balance."}
        {preset === "cinematic" && "Deep contrast with lifted shadows for a movie-ready look."}
        {preset === "studio" && "Professional color grading with precise sharpness control."}
        {preset === "ultra" && "Maximum detail recovery and edge sharpening for crystal clarity."}
      </div>
    </div>
  );

  return (
    <WorkspaceLayout
      title="AI Enhancer"
      description="GFPGAN-powered face restoration and professional image enhancement."
      badge="GFPGAN · Apache 2.0"
      sidebar={sidebar}
    >
      <AnimatePresence>
        {(state === "idle" || state === "error") && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 min-h-0 flex-col items-center justify-center gap-6"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/15 to-orange-500/10">
              <Sparkles size={48} strokeWidth={1} className="text-amber-500" />
            </div>
            {error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>
            )}
            {/* Preset Quick Select */}
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                    preset === p.id
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                      : "border-black/10 text-black/40 hover:border-amber-400/20"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="w-full max-w-xl">
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) =>
                  upload(f, {
                    preset,
                    intensity,
                    face_restore: faceRestore ? "true" : "false",
                    hdr: hdr ? "true" : "false",
                    noise_reduction: noiseReduction,
                  })
                }
              />
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex-1 min-h-0">
            {originalFile?.previewUrl && (
              <div
                className="h-full w-full rounded-2xl bg-contain bg-center bg-no-repeat opacity-20"
                style={{ backgroundImage: `url(${originalFile.previewUrl})` }}
              />
            )}
            <ProcessingOverlay label="Enhancing with GFPGAN…" />
          </motion.div>
        )}

        {isDone && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 min-h-0 flex-col gap-4"
          >
            <div className="flex-1 overflow-hidden rounded-2xl bg-white/50 backdrop-blur-sm">
              {originalFile?.previewUrl ? (
                <BeforeAfter
                  beforeImage={originalFile.previewUrl}
                  afterImage={downloadUrl(toolkit, job!.job_id, undefined, true)}
                />
              ) : (
                <img
                  src={downloadUrl(toolkit, job!.job_id, undefined, true)}
                  className="h-full w-full object-contain rounded-2xl"
                  alt="Enhanced"
                />
              )}
            </div>
            <ResultActionBar toolkit={toolkit} job={job!} onReset={() => window.location.reload()} />
          </motion.div>
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}
