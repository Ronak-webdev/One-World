"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Sparkles, Download } from "lucide-react";
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
} from "./WorkspaceShared";

const BG_COLORS = [
  { id: "transparent", label: "Transparent" },
  { id: "white", label: "White" },
  { id: "black", label: "Black" },
  { id: "blur", label: "Blurred" },
];

const OUTPUT_FORMATS = [
  { id: "png", label: "PNG" },
  { id: "webp", label: "WEBP" },
];

export function BackgroundRemoverWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [bgColor, setBgColor] = useState("transparent");
  const [format, setFormat] = useState("png");
  const [hdQuality, setHdQuality] = useState(false);
  const [edgeSmooth, setEdgeSmooth] = useState(true);
  const [previewBg, setPreviewBg] = useState("checkerboard");

  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  const sidebar = (
    <div>
      <ControlSection title="Output Background">
        <SelectGrid options={BG_COLORS} value={bgColor} onChange={setBgColor} />
      </ControlSection>

      <ControlSection title="Output Format">
        <SelectGrid options={OUTPUT_FORMATS} value={format} onChange={setFormat} />
      </ControlSection>

      <ControlSection title="Quality">
        <ToggleButton
          label={`HD Quality ${hdQuality ? "✓" : ""}`}
          active={hdQuality}
          onClick={() => setHdQuality(!hdQuality)}
        />
        <ToggleButton
          label={`Edge Smoothing ${edgeSmooth ? "✓" : ""}`}
          active={edgeSmooth}
          onClick={() => setEdgeSmooth(!edgeSmooth)}
        />
      </ControlSection>

      {/* Transparency Preview Legend */}
      {isDone && (
        <div className="mt-4 rounded-xl border border-black/5 bg-white p-3">
          <p className="text-xs font-bold text-black/40 mb-2 uppercase tracking-widest">Preview Mode</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "checkerboard", label: "Checker" },
              { id: "white", label: "White" },
              { id: "black", label: "Black" },
              { id: "gray", label: "Gray" }
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setPreviewBg(b.id)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all ${
                  previewBg === b.id 
                    ? "border-accent bg-accent/10 text-accent" 
                    : "border-black/5 bg-black/5 text-black/60 hover:bg-black/10"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {originalFile && (
        <div className="mt-6">
          <button
            onClick={() => upload(originalFile.file, { 
              output_format: format,
              bg_color: bgColor,
              hd_quality: hdQuality ? "true" : "false",
              edge_smooth: edgeSmooth ? "true" : "false"
            })}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{isDone ? "Re-process Image" : "Process Image"}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <WorkspaceLayout
      title="Background Remover"
      description="Precise AI background removal with BiRefNet — Commercial-safe MIT license."
      badge="BiRefNet · MIT"
      sidebar={originalFile ? sidebar : undefined}
    >
      <AnimatePresence mode="wait">
        {/* IDLE/ERROR */}
        {(state === "idle" || state === "error") && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-1 min-h-0 flex-col items-center justify-center gap-6"
          >
            {/* Tool illustration */}
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent/15 to-purple-500/10">
              <Layers size={48} strokeWidth={1} className="text-accent" />
            </div>
            <div className="w-full max-w-xl">
              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-center text-sm font-bold text-red-600">
                  {error}
                </div>
              )}
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) => upload(f, { 
                  output_format: format,
                  bg_color: bgColor,
                  hd_quality: hdQuality ? "true" : "false",
                  edge_smooth: edgeSmooth ? "true" : "false"
                })}
              />
            </div>
            <div className="flex gap-6 text-center">
              {["Auto edge detection", "Alpha transparency", "1-click download"].map((f) => (
                <div key={f} className="text-xs font-semibold text-black/30">{f}</div>
              ))}
            </div>
          </motion.div>
        )}

        {/* PROCESSING */}
        {isProcessing && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex-1 min-h-0">
            {/* Dimmed original preview */}
            {originalFile?.previewUrl && (
              <div
                className="h-full w-full rounded-2xl bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${originalFile.previewUrl})` }}
              />
            )}
            <ProcessingOverlay label="Removing background with BiRefNet…" />
          </motion.div>
        )}

        {/* DONE */}
        {isDone && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 min-h-0 flex-col gap-4"
          >
            <div className={`flex-1 overflow-hidden rounded-2xl relative ${
              previewBg === "checkerboard" ? "bg-[repeating-conic-gradient(#e5e5e5_0%_25%,white_0%_50%)] bg-[length:20px_20px]" :
              previewBg === "white" ? "bg-white" :
              previewBg === "black" ? "bg-black" :
              "bg-gray-500"
            }`}>
              {originalFile?.previewUrl ? (
                <BeforeAfter
                  beforeImage={originalFile.previewUrl}
                  afterImage={downloadUrl(toolkit, job!.job_id, undefined, true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  {isDone && job?.job_id && (
                    <img
                      src={downloadUrl(toolkit, job.job_id, undefined, true)}
                      alt="Result"
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>
            <ResultActionBar
              toolkit={toolkit}
              job={job!}
              onReset={() => window.location.reload()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}
