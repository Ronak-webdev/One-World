"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadUrl } from "@/lib/api";
import type { JobStatus, UploadState } from "@/lib/api";
import { useState, useRef } from "react";

/* ─── Mini Upload Drop Zone ─────────────────────────────────────────── */
export function WorkspaceDropZone({
  accepted,
  onFile,
  disabled = false,
  children,
}: {
  accepted?: string;
  onFile: (f: File) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 transition-all duration-300 cursor-pointer select-none",
        dragging
          ? "border-accent bg-accent/5 shadow-[0_0_40px_rgba(91,91,214,0.2)] scale-[1.01]"
          : "border-black/10 bg-black/2 hover:border-accent/40 hover:bg-accent/2",
        disabled && "opacity-40 pointer-events-none"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && !disabled) onFile(file);
      }}
      onClick={() => ref.current?.click()}
    >
      <input
        ref={ref}
        type="file"
        accept={accepted}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <motion.div
        animate={{ scale: dragging ? 1.1 : 1 }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-purple-600 text-white shadow-lg"
      >
        <Upload size={24} />
      </motion.div>
      <div className="text-center">
        <p className="text-base font-bold text-black/70">
          {dragging ? "Drop to process…" : "Drag & drop or click to upload"}
        </p>
        {accepted && (
          <p className="mt-1 text-xs font-medium text-black/30 uppercase tracking-widest">
            {accepted.replace(/,/g, " · ")}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Processing Overlay ────────────────────────────────────────────── */
export function ProcessingOverlay({ label = "Processing with AI…" }: { label?: string }) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 rounded-2xl bg-white/80 backdrop-blur-xl"
    >
      {/* Circuit animation */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent opacity-60" />
        <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-purple-400 opacity-40" style={{ animationDirection: "reverse", animationDuration: "1.2s" }} />
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20">
          <div className="h-3 w-3 animate-ping rounded-full bg-accent" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-black">{label}</p>
        <p className="mt-1 text-sm text-black/40 font-medium">
          Thinking
          <span className="inline-flex gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              >·</motion.span>
            ))}
          </span>
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Result Action Bar ─────────────────────────────────────────────── */
export function ResultActionBar({
  toolkit,
  job,
  onReset,
  extra,
}: {
  toolkit: string;
  job: JobStatus;
  onReset: () => void;
  extra?: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Attempt to infer format from result path if available
  const resultPath = job.results ? Object.values(job.results)[0] : null;
  const formatMatch = resultPath ? resultPath.match(/\.([a-zA-Z0-9]+)$/) : null;
  const format = formatMatch ? formatMatch[1].toUpperCase() : "FILE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex shrink-0 flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl border border-black/5 bg-white/90 p-5 px-6 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-inner">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <CheckCircle2 size={24} className="text-white" />
          </motion.div>
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
        </div>
        <div>
          <p className="text-base font-extrabold text-black">Processing Complete</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-black/50">Ready to download</span>
            <span className="h-1 w-1 rounded-full bg-black/20" />
            <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold tracking-widest text-black/60 uppercase">
              {format}
            </span>
          </div>
        </div>
      </div>
      <div className="flex w-full sm:w-auto flex-wrap items-center gap-3">
        {extra}
        <button
          onClick={onReset}
          className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-bold text-black/70 transition-all hover:border-black/20 hover:bg-black/5 active:scale-95"
        >
          <RefreshCw size={16} /> Process Another
        </button>
        <a href={downloadUrl(toolkit, job.job_id)} download className="flex-1 sm:flex-none group relative">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-accent to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-60 group-hover:duration-200" />
          <button 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            <motion.div animate={{ y: isHovered ? [0, 2, 0] : 0 }} transition={{ repeat: isHovered ? Infinity : 0, duration: 1 }}>
              <Download size={16} />
            </motion.div>
            Download Result
          </button>
        </a>
      </div>
    </motion.div>
  );
}

/* ─── Workspace Layout Shell ─────────────────────────────────────────── */
export function WorkspaceLayout({
  title,
  description,
  badge,
  sidebar,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-0">
      {/* Tool Header */}
      <div className="flex shrink-0 items-start justify-between border-b border-black/5 bg-white/60 px-6 py-4 backdrop-blur-xl">
        <div>
          {badge && (
            <span className="mb-1.5 inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
              {badge}
            </span>
          )}
          <h2 className="text-xl font-extrabold tracking-tight text-black">{title}</h2>
          <p className="text-sm font-medium text-black/40">{description}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebar && (
          <aside className="w-72 shrink-0 overflow-y-auto border-r border-black/5 bg-white/40 p-4 backdrop-blur-xl">
            {sidebar}
          </aside>
        )}
        <main className="relative flex flex-col flex-1 min-h-0 overflow-hidden p-5">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ─── Control Panel primitives ───────────────────────────────────────── */
export function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-black/30">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all duration-200",
        active
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-black/5 bg-white text-black/60 hover:border-black/10 hover:text-black"
      )}
    >
      {label}
    </button>
  );
}

export function SliderControl({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (v: number) => string | number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-black/50">{label}</span>
        <span className="text-xs font-bold text-accent">{formatValue ? formatValue(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)] h-1.5 cursor-pointer rounded-full"
      />
    </div>
  );
}

export function SelectGrid({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-xl border px-2 py-1.5 text-xs font-bold transition-all",
            value === opt.id
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-black/5 bg-white text-black/50 hover:border-accent/20 hover:text-accent/70"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ProcessButton({
  onClick,
  disabled,
  label = "Process Image",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl bg-gradient-to-r from-accent to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:scale-105 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
    >
      {label}
    </button>
  );
}
