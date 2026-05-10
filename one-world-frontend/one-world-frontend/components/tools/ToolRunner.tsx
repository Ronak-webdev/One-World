"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UploadZone } from "@/components/ui/UploadZone";
import { type ToolDefinition, downloadFileUrl } from "@/lib/api";
import { useUpload } from "@/hooks/useUpload";

type ToolRunnerProps = {
  toolkit: string;
  tool: ToolDefinition;
};

export function ToolRunner({ toolkit, tool }: ToolRunnerProps) {
  const [format, setFormat] = useState(tool.outputFormats?.[0] ?? "");
  const fields: Record<string, string> = format ? { output_format: format } : {};
  const { state, error, job, upload, download } = useUpload(toolkit, tool.endpoint, fields);
  const [selectedFileIndex, setSelectedFileIndex] = useState<string>("all");
  
  const busy = state === "uploading" || state === "processing";
  const done = state === "done";
  const hasError = !!error;

  const currentDownloadUrl = selectedFileIndex === "all" 
    ? download 
    : (job?.job_id ? downloadFileUrl(toolkit, job.job_id, parseInt(selectedFileIndex)) : null);

  return (
    <Card className="p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-1)]">{tool.title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-2)]">{tool.description}</p>
        </div>
        {tool.outputFormats?.length ? (
          <select
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 shrink-0"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            aria-label="Output format"
          >
            {tool.outputFormats.map((item) => (
              <option key={item} value={item}>{item.toUpperCase()}</option>
            ))}
          </select>
        ) : null}
      </div>

      {/* Upload zone */}
      <div className="mt-6">
        <UploadZone accepted={tool.accepted} disabled={busy} onFile={upload} />
      </div>

      {/* Status bar */}
      <AnimatePresence mode="wait">
        {(busy || done || hasError || job?.message) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5"
          >
            <div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl px-4 py-3 border text-sm transition-colors duration-200 ${
              hasError
                ? "bg-[#FF3B30]/[0.06] border-[#FF3B30]/20 text-[#FF3B30]"
                : done
                ? "bg-[#34C759]/[0.06] border-[#34C759]/20 text-[#34C759]"
                : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]"
            }`}>
              <span className="inline-flex items-center gap-2">
                {hasError && <AlertCircle size={15} />}
                {done && <CheckCircle2 size={15} />}
                {busy && <Loader2 className="animate-spin" size={15} />}
                <span>{error ?? job?.message ?? "Processing..."}</span>
              </span>

              {done && download && (
                <div className="flex items-center gap-3">
                  {job?.outputs && job.outputs.length > 0 && (
                    <select
                      className="h-9 rounded-lg border border-[#34C759]/30 bg-white/10 px-2 text-xs text-[#34C759] focus:outline-none transition-colors"
                      value={selectedFileIndex}
                      onChange={(e) => setSelectedFileIndex(e.target.value)}
                    >
                      <option value="all">All (ZIP)</option>
                      {job.outputs.map((out, idx) => (
                        <option key={idx} value={idx}>{out.label}</option>
                      ))}
                    </select>
                  )}
                  
                  <a href={currentDownloadUrl || ""} download={selectedFileIndex !== "all" ? job?.outputs?.[parseInt(selectedFileIndex)]?.name : undefined}>
                    <Button size="sm" variant="accent" className="gap-2">
                      <Download size={14} />
                      {selectedFileIndex === "all" ? "Download All" : "Download File"}
                    </Button>
                  </a>
                </div>
              )}
            </div>

            {/* Progress bar for processing state */}
            {busy && (
              <div className="mt-2 h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: "5%" }}
                  animate={{ width: state === "uploading" ? "35%" : "80%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
