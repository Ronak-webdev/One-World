"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Cpu } from "lucide-react";
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

const SCALE_OPTIONS = [
  { id: "2", label: "2× Upscale" },
  { id: "4", label: "4× Upscale" },
];

const MODE_OPTIONS = [
  { id: "quality", label: "Quality" },
  { id: "speed", label: "Speed" },
];

export function UpscalerWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [scale, setScale] = useState("4");
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [mode, setMode] = useState("quality");
  const [sharpness, setSharpness] = useState(70);

  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  const sidebar = (
    <div>
      <ControlSection title="Upscale Factor">
        <SelectGrid options={SCALE_OPTIONS} value={scale} onChange={setScale} />
        {originalFile && (
          <div className="mt-2 rounded-xl border border-black/5 bg-black/2 p-2.5 text-xs">
            <p className="font-semibold text-black/40">Estimated output</p>
            <p className="font-bold text-accent">~{scale}× original dimensions</p>
          </div>
        )}
      </ControlSection>

      <ControlSection title="Processing Mode">
        <SelectGrid options={MODE_OPTIONS} value={mode} onChange={setMode} />
      </ControlSection>

      <ControlSection title="Sharpening">
        <SliderControl
          label="Sharpness Boost"
          value={sharpness}
          onChange={setSharpness}
        />
      </ControlSection>

      <ControlSection title="AI Enhancements">
        <ToggleButton
          label={`Face Enhancement (GFPGAN) ${faceEnhance ? "✓" : ""}`}
          active={faceEnhance}
          onClick={() => setFaceEnhance(!faceEnhance)}
        />
      </ControlSection>

      {/* GPU Status */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2.5">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <div>
          <p className="text-xs font-bold text-green-700">GPU Accelerated</p>
          <p className="text-[10px] text-green-600/70">CUDA inference active</p>
        </div>
      </div>
    </div>
  );

  return (
    <WorkspaceLayout
      title="AI Upscaler"
      description="Real-ESRGAN powered 2× / 4× upscaling with optional face restoration."
      badge="Real-ESRGAN · BSD-3"
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
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/15 to-accent/10">
              <Zap size={48} strokeWidth={1} className="text-blue-500" />
            </div>
            {error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>
            )}
            <div className="w-full max-w-xl">
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) =>
                  upload(f, {
                    scale: Number(scale),
                    face_enhance: faceEnhance ? "true" : "false",
                    sharpness: sharpness,
                  })
                }
              />
            </div>
            {/* Scale badges */}
            <div className="flex gap-3">
              {SCALE_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setScale(o.id)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                    scale === o.id
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-black/10 text-black/40 hover:border-accent/20"
                  }`}
                >
                  {o.label}
                </button>
              ))}
              {faceEnhance && (
                <div className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1.5">
                  <Cpu size={11} className="text-purple-600" />
                  <span className="text-xs font-bold text-purple-600">Face Restore ON</span>
                </div>
              )}
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
            <ProcessingOverlay label={`Upscaling ${scale}× with Real-ESRGAN…`} />
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
                isDone && job?.job_id && (
                  <img
                    src={downloadUrl(toolkit, job.job_id, undefined, true)}
                    alt="Result"
                    className="h-full w-full object-contain"
                  />
                )
              )}
            </div>
            <ResultActionBar toolkit={toolkit} job={job!} onReset={() => window.location.reload()} />
          </motion.div>
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}
