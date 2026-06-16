"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, Download, RefreshCw, Palette, Image as ImageIcon } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { downloadUrl, type ToolDefinition } from "@/lib/api";
import { 
  WorkspaceLayout, 
  WorkspaceDropZone, 
  ProcessingOverlay,
  ResultActionBar
} from "./image/WorkspaceShared";
import { BeforeAfter } from "@/components/ui/BeforeAfter";

const LAB_ICONS: Record<string, React.ReactNode> = {
  "Style Transfer": <Palette size={40} strokeWidth={1} className="text-pink-500" />,
  "Placeholders": <ImageIcon size={40} strokeWidth={1} className="text-indigo-500" />,
  "AI Lab Assistant": <Bot size={40} strokeWidth={1} className="text-purple-500" />,
};

import { Bot } from "lucide-react";
import { LabChatWorkspace } from "./lab/LabChatWorkspace";

export function LabToolWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);

  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

    if (tool.title === "AI Lab Assistant") {
      return <LabChatWorkspace toolkit={toolkit} tool={tool} />;
    }

    return (
      <WorkspaceLayout
        title={tool.title}
        description={tool.description}
        badge={`Experimental · ${toolkit.toUpperCase()}`}
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
                {LAB_ICONS[tool.title] || <Beaker size={40} strokeWidth={1} className="text-accent" />}
              </div>
              {error && (
                <div className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>
              )}
              <div className="w-full max-w-xl">
                <WorkspaceDropZone
                  accepted={tool.accepted}
                  onFile={(f) => upload(f)}
                />
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
              <ProcessingOverlay label={`Processing ${tool.title.toLowerCase()} experiment...`} />
            </motion.div>
          )}

          {isDone && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full flex-col gap-4"
            >
              <div className="flex-1 overflow-hidden rounded-2xl bg-white/50 backdrop-blur-sm">
                {originalFile?.previewUrl ? (
                  <BeforeAfter
                    beforeImage={originalFile.previewUrl}
                    afterImage={downloadUrl(toolkit, job!.job_id, undefined, true)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl bg-white/80 p-10 shadow-xl backdrop-blur-xl">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/15">
                      <Beaker size={40} strokeWidth={1} className="text-indigo-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-black">Experiment Complete!</p>
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
