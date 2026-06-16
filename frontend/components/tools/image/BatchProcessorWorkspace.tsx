"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Upload, X, FileImage, Download } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { downloadUrl, type ToolDefinition } from "@/lib/api";
import { SelectGrid, WorkspaceLayout, ControlSection, ProcessingOverlay, ResultActionBar } from "./WorkspaceShared";

const OUTPUT_FORMATS = [
  { id: "png", label: "PNG" },
  { id: "jpg", label: "JPG" },
  { id: "webp", label: "WEBP" },
];

export function BatchProcessorWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [format, setFormat] = useState("webp");
  const inputRef = useRef<HTMLInputElement>(null);

  const { state, error, job, upload } = useUpload(toolkit, tool.endpoint);
  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  const sidebar = (
    <div>
      <ControlSection title="Output Format">
        <SelectGrid options={OUTPUT_FORMATS} value={format} onChange={setFormat} />
      </ControlSection>
      <ControlSection title="Processing">
        <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <div>
            <p className="text-xs font-bold text-blue-700">Parallel Processing</p>
            <p className="text-[10px] text-blue-600/70">4 threads · ThreadPoolExecutor</p>
          </div>
        </div>
      </ControlSection>
    </div>
  );

  return (
    <WorkspaceLayout
      title="Batch Processor"
      description="Convert entire ZIP archives with parallel processing. Fast, GPU-free, production-ready."
      badge="ThreadPoolExecutor · Parallel"
      sidebar={isDone || isProcessing ? sidebar : undefined}
    >
      <AnimatePresence mode="wait">
        {(state === "idle" || state === "error") && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex h-full flex-col items-center justify-center gap-6"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10">
              <Package size={48} strokeWidth={1} className="text-indigo-500" />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>
            )}

            <div className="w-full max-w-2xl">
              {/* Output format quick select */}
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-black/30">
                Convert All Images To
              </p>
              <div className="mb-4 flex justify-center gap-3">
                {OUTPUT_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`rounded-full border px-5 py-1.5 text-xs font-bold transition-all ${
                      format === f.id
                        ? "border-accent/30 bg-accent/10 text-accent scale-105"
                        : "border-black/10 text-black/40 hover:border-accent/20"
                    }`}
                  >
                    .{f.id.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* ZIP drop area */}
              <div
                className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-black/10 p-10 transition-all hover:border-accent/40 hover:bg-accent/2 cursor-pointer"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) upload(f, { output_format: format });
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f, { output_format: format });
                  }}
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                  <Package size={30} />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-black/70">Drop your ZIP archive here</p>
                  <p className="mt-1 text-xs text-black/30">
                    Pack all images into a single .zip file
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-black/5 bg-black/5 px-4 py-1.5">
                  <FileImage size={12} className="text-black/40" />
                  <span className="text-xs font-semibold text-black/40">PNG · JPG · WEBP · BMP · TIFF</span>
                </div>
              </div>

              {/* Features */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Parallel Processing", desc: "4 threads simultaneously" },
                  { label: "ZIP → ZIP", desc: "One archive in, one out" },
                  { label: "Any format", desc: "PNG, JPG, WEBP, BMP, TIFF" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-black/5 bg-white/60 p-3 text-center">
                    <p className="text-xs font-bold text-black/70">{item.label}</p>
                    <p className="text-[10px] text-black/30 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {/* Animated processing cards */}
              <div className="flex gap-3 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/20 bg-accent/10"
                  >
                    <FileImage size={20} className="text-accent" />
                  </motion.div>
                ))}
              </div>
            </div>
            <ProcessingOverlay label="Processing batch in parallel…" />
          </motion.div>
        )}

        {isDone && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-full flex-col items-center justify-center gap-6"
          >
            <div className="flex flex-col items-center gap-5 rounded-3xl border border-black/5 bg-white/80 p-10 shadow-xl backdrop-blur-xl">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10">
                <Package size={40} strokeWidth={1} className="text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-black">Batch Processing Complete!</p>
                <p className="mt-1 text-sm text-black/40">
                  All images converted to <strong>.{format.toUpperCase()}</strong> and packed into a ZIP archive.
                </p>
              </div>
            <ResultActionBar toolkit={toolkit} job={job!} onReset={() => window.location.reload()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}
