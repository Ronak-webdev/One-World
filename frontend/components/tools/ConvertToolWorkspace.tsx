"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, RefreshCw, FileCode, FileImage, Video } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { downloadUrl, type ToolDefinition } from "@/lib/api";
import { 
  WorkspaceLayout, 
  WorkspaceDropZone, 
  ProcessingOverlay, 
  ControlSection, 
  SelectGrid,
  ResultActionBar
} from "./image/WorkspaceShared";
import { BeforeAfter } from "@/components/ui/BeforeAfter";

const CONVERT_ICONS: Record<string, React.ReactNode> = {
  "PDF to Word": <FileText size={40} strokeWidth={1} className="text-blue-500" />,
  "Word to PDF": <FileText size={40} strokeWidth={1} className="text-red-500" />,
  "PDF to PPT": <FileText size={40} strokeWidth={1} className="text-orange-500" />,
  "PDF to TXT": <FileText size={40} strokeWidth={1} className="text-gray-500" />,
  "Markdown to PDF": <FileCode size={40} strokeWidth={1} className="text-indigo-500" />,
  "Image Convert": <FileImage size={40} strokeWidth={1} className="text-emerald-500" />,
  "Media Convert": <Video size={40} strokeWidth={1} className="text-violet-500" />,
};

export function ConvertToolWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [format, setFormat] = useState(tool.outputFormats?.[0] ?? "");
  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);

  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  const sidebar = tool.outputFormats?.length ? (
    <ControlSection title="Output Format">
      <SelectGrid 
        options={tool.outputFormats.map(f => ({ id: f, label: f.toUpperCase() }))} 
        value={format} 
        onChange={setFormat} 
      />
    </ControlSection>
  ) : null;

  return (
    <WorkspaceLayout
      title={tool.title}
      description={tool.description}
      badge={`Convert · ${toolkit.toUpperCase()}`}
      sidebar={isDone && sidebar ? sidebar : undefined}
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
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-black/5">
              {CONVERT_ICONS[tool.title] || <FileText size={40} strokeWidth={1} className="text-accent" />}
            </div>
            {error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>
            )}
            <div className="w-full max-w-xl">
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) => upload(f, format ? { output_format: format } : {})}
              />
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
            <ProcessingOverlay label={`Converting ${tool.title.toLowerCase()}...`} />
          </motion.div>
        )}

        {isDone && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-full flex-col gap-4"
          >
            <div className="flex-1 overflow-hidden rounded-2xl">
              {originalFile?.previewUrl && tool.accepted.includes("image") ? (
                <BeforeAfter
                  beforeImage={originalFile.previewUrl}
                  afterImage={downloadUrl(toolkit, job!.job_id, undefined, true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl bg-white/80 p-10 shadow-xl backdrop-blur-xl">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/15">
                    {CONVERT_ICONS[tool.title] || <FileText size={40} strokeWidth={1} className="text-green-600" />}
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-black">Conversion Complete!</p>
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
