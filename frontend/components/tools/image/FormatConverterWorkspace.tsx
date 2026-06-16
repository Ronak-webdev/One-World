"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, FileType2 } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { downloadUrl, type ToolDefinition } from "@/lib/api";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import {
  WorkspaceDropZone,
  ProcessingOverlay,
  ResultActionBar,
  WorkspaceLayout,
  ControlSection,
  SliderControl,
  ToggleButton,
} from "./WorkspaceShared";

const FORMATS = [
  { id: "png", label: "PNG", desc: "Lossless", color: "text-green-600 bg-green-500/10 border-green-500/20" },
  { id: "jpg", label: "JPG", desc: "Compressed", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  { id: "webp", label: "WEBP", desc: "Modern web", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  { id: "bmp", label: "BMP", desc: "Uncompressed", color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
  { id: "tiff", label: "TIFF", desc: "Print quality", color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
];

export function FormatConverterWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [format, setFormat] = useState("webp");
  const [quality, setQuality] = useState(90);
  const [preserveMeta, setPreserveMeta] = useState(false);

  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  const selectedFormat = FORMATS.find((f) => f.id === format)!;

  return (
    <WorkspaceLayout
      title="Format Converter"
      description="High-quality image format conversion with alpha channel preservation."
      badge="Pillow · Lossless"
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
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10">
              <FileType2 size={40} strokeWidth={1} className="text-blue-500" />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>
            )}

            {/* Format Grid */}
            <div className="w-full max-w-2xl">
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-black/30">
                Select Output Format
              </p>
              <div className="grid grid-cols-5 gap-2">
                {FORMATS.map((f) => (
                  <motion.button
                    key={f.id}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFormat(f.id)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border p-4 text-center transition-all ${
                      format === f.id
                        ? `${f.color} scale-105 shadow-lg`
                        : "border-black/5 bg-white/60 text-black/50 hover:border-black/10"
                    }`}
                  >
                    <span className="text-xl font-extrabold">{f.label}</span>
                    <span className="text-[10px] font-semibold opacity-70">{f.desc}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quality & Options */}
            <div className="w-full max-w-2xl rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur-md">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <SliderControl label="Output Quality" value={quality} onChange={setQuality} min={10} />
                <div className="flex items-center gap-3">
                  <ToggleButton
                    label={`Preserve Metadata ${preserveMeta ? "✓" : ""}`}
                    active={preserveMeta}
                    onClick={() => setPreserveMeta(!preserveMeta)}
                  />
                </div>
              </div>
            </div>

            {/* Upload */}
            <div className="w-full max-w-xl">
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) => upload(f, { output_format: format, quality })}
              >
                <div className="pointer-events-none flex items-center gap-2">
                  <ArrowRightLeft size={14} className="text-black/30" />
                  <span className="text-xs font-bold text-black/30">
                    → Convert to <span className={selectedFormat.color.split(" ")[0]}>{selectedFormat.label}</span>
                  </span>
                </div>
              </WorkspaceDropZone>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex-1 min-h-0">
            <ProcessingOverlay label={`Converting to ${selectedFormat.label}…`} />
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
                <div className="flex h-full items-center justify-center rounded-2xl bg-white/80 p-10 shadow-xl backdrop-blur-xl">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border text-3xl font-extrabold ${selectedFormat.color}`}>
                    {selectedFormat.label}
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-black">Conversion Complete!</p>
                    <p className="mt-1 text-sm text-black/40">
                      Your file has been converted to {selectedFormat.label} format.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <ResultActionBar toolkit={toolkit} job={job!} onReset={() => window.location.reload()} />
          </motion.div>
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}
