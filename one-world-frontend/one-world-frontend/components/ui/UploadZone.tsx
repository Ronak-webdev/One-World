"use client";

import { Upload, FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

type UploadZoneProps = {
  accepted?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
};

export function UploadZone({ accepted, disabled, onFile }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
        disabled
          ? "opacity-40 border-[var(--border)] bg-[var(--surface-2)]"
          : isDragging
          ? "border-accent bg-accent/[0.06] scale-[1.01] shadow-glow-sm"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-accent/40 hover:bg-accent/[0.03] hover:shadow-[var(--card-shadow)]"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files.item(0);
        if (file && !disabled) onFile(file);
      }}
    >
      <input
        ref={inputRef}
        accept={accepted}
        className="hidden"
        disabled={disabled}
        type="file"
        onChange={(e) => {
          const file = e.target.files?.item(0);
          if (file) onFile(file);
        }}
      />

      <AnimatePresence mode="wait">
        {isDragging ? (
          <motion.div
            key="dragging"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-glow"
          >
            <FileUp size={24} />
          </motion.div>
        ) : (
          <motion.button
            key="idle"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--text-1)] text-[var(--surface)] hover:shadow-[var(--card-shadow-hover)] transition-all duration-200 active:scale-[0.96]"
            disabled={disabled}
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Select file"
          >
            <Upload size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <p className="text-base font-semibold text-[var(--text-1)]">
        {isDragging ? "Drop it here!" : "Drop a file or browse"}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-2)]">
        Runs through the local FastAPI backend and returns a downloadable result when the job finishes.
      </p>

      {!isDragging && !disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 text-xs font-semibold text-accent hover:underline underline-offset-2"
        >
          Browse files
        </button>
      )}
    </motion.div>
  );
}
