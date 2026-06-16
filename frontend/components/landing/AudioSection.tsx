"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/Badge";
import { ProgressLine } from "@/components/ui/ProgressLine";
import { useScrollProgress } from "@/hooks/useScrollProgress";

function WaveformBar({ color }: { color: string }) {
  const [vals, setVals] = useState<[string, string] | null>(null);
  const [dur, setDur] = useState(1);
  useEffect(() => {
    setVals([`${20 + Math.random() * 60}%`, `${20 + Math.random() * 60}%`]);
    setDur(0.8 + Math.random() * 0.4);
  }, []);
  if (!vals) return <div className="w-1 rounded-full bg-[var(--border)] h-[20%]" />;
  return (
    <motion.div
      className="w-1 rounded-full"
      style={{ backgroundColor: color, opacity: 0.5 }}
      animate={{ height: vals }}
      transition={{ duration: dur, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    />
  );
}

const tools = [
  ["MDX-NET",   "Vocal Remover",  "Separates vocals from instrumentals with ONNX inference.", "#34C759"],
  ["DEMUCS",    "Stem Separator", "Four-stem split: vocals, drums, bass, and other.",          "#5B5BD6"],
  ["WHISPER",   "Transcription",  "Word-level timestamps and 99-language support.",            "#FF9500"],
  ["RESEMBLE",  "Audio Enhancer", "Neural denoising and super-resolution path.",               "#30D158"],
  ["DSP",       "Pitch Shift",    "±12 semitones with local audio processing.",                "#64D2FF"],
  ["DENOISER",  "Noise Reduction","Standalone denoiser mode for rough captures.",              "#BF5AF2"],
  ["FFMPEG",    "Format Converter","WAV, MP3, FLAC, OGG, M4A, and AIFF.",                     "#FF6B6B"],
  ["PYDUB",     "Silence Remover","Strip silence with threshold and padding controls.",        "#4FC3F7"],
];

const waveWidths = [72, 46, 86, 58, 92, 34, 68, 79];

/** Reusable tool cards list — used in both mobile and desktop columns */
function ToolCards() {
  return (
    <div className="grid gap-3">
      {tools.map(([model, name, description, color], index) => (
        <motion.article
          key={name}
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: (index % 4) * 0.06, ease: [0, 0, 0.2, 1] }}
          className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:p-6 hover:border-accent/30 hover:shadow-lg transition-all duration-300 cursor-default"
        >
          <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full opacity-60" style={{ backgroundColor: color as string }} />
          <div className="flex items-start justify-between">
            <div className="flex-1 pl-4">
              <Badge>{model}</Badge>
              <h3 className="mt-3 text-base font-semibold text-[var(--text-1)] lg:mt-4 lg:text-lg">{name}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[var(--text-2)]">{description}</p>
            </div>
            <div className="ml-3 hidden sm:flex items-end gap-0.5 h-8 shrink-0">
              {[...Array(8)].map((_, i) => (
                <WaveformBar key={i} color={color as string} />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between pl-4 text-sm lg:mt-4">
            <span className="flex items-center gap-1.5 text-[#34C759] text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
              Available
            </span>
            <Link href="/audio" className="text-[var(--text-2)] hover:text-accent transition-colors duration-200 text-sm font-medium hover:underline underline-offset-2">
              Open Tool →
            </Link>
          </div>
        </motion.article>
      ))}

      {/* GPU Queue Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
      >
        <div className="rounded-xl bg-[var(--surface-2,#f5f5f7)] p-5 border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-2)] mb-1">
            <span className="font-mono flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              WaveBrain DAW
            </span>
            <span className="text-accent">GPU queue active</span>
          </div>
          <p className="text-[10px] text-[var(--text-3)] font-mono mb-4">RTX 4090 · CUDA 12.4 · 24GB VRAM</p>
          <div className="grid gap-2">
            {waveWidths.map((width, index) => (
              <div className="flex items-center gap-2" key={index}>
                <span className="text-[10px] font-mono text-[var(--text-3)] w-8 shrink-0">T{index + 1}</span>
                <div className="flex-1 h-6 rounded-lg bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-lg"
                    style={{ background: "linear-gradient(90deg, rgba(91,91,214,0.5) 0%, rgba(109,109,224,0.3) 100%)" }}
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${width}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.8, ease: [0, 0, 0.2, 1] }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-3)] w-8 shrink-0 text-right">{width}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function AudioSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollProgress(ref);

  return (
    <section ref={ref} className="relative bg-[var(--background)] text-[var(--text-1)] transition-colors duration-500">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(var(--text-3) 0.5px, transparent 0.5px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative mx-auto max-w-content px-5 py-16 lg:py-24">

        {/* ═══════════════════════════════════════
            MOBILE layout (hidden on lg+)
            Stack: header → [vertical line | cards]
            ═══════════════════════════════════════ */}
        <div className="lg:hidden">
          {/* Header */}
          <p className="text-xs font-semibold uppercase text-accent tracking-widest">01 — Audio</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-[var(--text-1)]">
            Four models.<br />One interface.
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">
            The local WaveBrain engine exposes separation, transcription, enhancement, and DSP utilities through one queue.
          </p>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["8", "Tools"], ["4", "AI Models"], ["99+", "Languages"], ["0", "Cloud upload"]].map(([val, label]) => (
              <div key={label} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 shadow-sm">
                <span className="text-2xl font-bold text-[var(--text-1)]">{val}</span>
                <p className="text-xs text-[var(--text-2)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Vertical progress line LEFT of cards — same as desktop */}
          <div className="mt-8 flex gap-4">
            <div className="flex w-4 flex-shrink-0 justify-center">
              <ProgressLine progress={progress} fullHeight />
            </div>
            <div className="flex-1">
              <ToolCards />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            DESKTOP layout (hidden below lg)
            3-col grid: [sidebar | line | cards]
            ═══════════════════════════════════════ */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_28px_1.4fr] lg:gap-x-4">

          {/* Col 1 — Sticky sidebar */}
          <aside className="sticky top-28 self-start">
            <p className="text-xs font-semibold uppercase text-accent tracking-widest">01 — Audio</p>
            <h2 className="mt-4 text-5xl font-bold leading-tight text-[var(--text-1)]">
              Four models.<br />One interface.
            </h2>
            <p className="mt-6 max-w-xs text-sm leading-6 text-[var(--text-2)]">
              The local WaveBrain engine exposes separation, transcription, enhancement, and DSP utilities through one queue.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[["8", "Tools"], ["4", "AI Models"], ["99+", "Languages"], ["0", "Cloud upload"]].map(([val, label]) => (
                <div key={label} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 shadow-sm">
                  <span className="text-2xl font-bold text-[var(--text-1)]">{val}</span>
                  <p className="text-xs text-[var(--text-2)] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </aside>

          {/* Col 2 — Full-height vertical progress line */}
          <div className="flex justify-center">
            <ProgressLine progress={progress} fullHeight />
          </div>

          {/* Col 3 — Tool cards */}
          <ToolCards />
        </div>

      </div>
    </section>
  );
}
