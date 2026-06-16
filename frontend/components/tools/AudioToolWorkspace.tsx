"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, Mic2, Play, Pause, RefreshCw, Music2, Loader2 as Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WaveSurfer from "wavesurfer.js";

import { useUpload } from "@/hooks/useUpload";
import { downloadUrl as getDownloadUrl, type ToolDefinition } from "@/lib/api";
import {
  WorkspaceDropZone,
  ProcessingOverlay,
  WorkspaceLayout,
  ControlSection,
  SelectGrid,
} from "./image/WorkspaceShared";

const AUDIO_TOOL_ICONS: Record<string, React.ReactNode> = {
  "Vocal Remover": <Mic2 size={40} strokeWidth={1} className="text-purple-500" />,
  "Stem Separator": <Music2 size={40} strokeWidth={1} className="text-blue-500" />,
};

const AUDIO_TOOL_COLORS: Record<string, string> = {
  "Vocal Remover": "from-purple-500/15 to-accent/10",
  "Stem Separator": "from-blue-500/15 to-cyan-500/10",
  "Transcription": "from-green-500/15 to-emerald-500/10",
  "Enhancer": "from-amber-500/15 to-orange-500/10",
  "Pitch Shift": "from-rose-500/15 to-pink-500/10",
  "Noise Reduction": "from-gray-500/15 to-slate-500/10",
  "Format Converter": "from-indigo-500/15 to-violet-500/10",
  "Silence Remover": "from-teal-500/15 to-cyan-500/10",
};

const AUDIO_FORMATS = [
  { id: "wav", label: "WAV" },
  { id: "mp3", label: "MP3" },
  { id: "flac", label: "FLAC" },
];

type AudioToolWorkspaceProps = {
  toolkit: string;
  tool: ToolDefinition;
};

export function AudioToolWorkspace({ toolkit, tool }: AudioToolWorkspaceProps) {
  const [format, setFormat] = useState(tool.outputFormats?.[0] ?? "");
  const [quality, setQuality] = useState("medium");
  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);

  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveDuration, setWaveDuration] = useState<number | null>(null);

  useEffect(() => {
    // We want the waveform to load as soon as we have a file, even during processing
    if (originalFile?.previewUrl && containerRef.current) {
      // Clean up previous instance
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "rgba(0,0,0,0.1)",
        progressColor: "#5b5bd6",
        cursorColor: "#5b5bd6",
        cursorWidth: 2,
        barWidth: 2,
        barGap: 3,
        barRadius: 4,
        height: 120,
        normalize: true,
        interact: true,
        fillParent: true,
        autoCenter: true,
      });

      ws.load(originalFile.previewUrl);
      
      ws.on("ready", () => {
        setWaveDuration(ws.getDuration());
      });

      ws.on("play", () => setIsPlaying(true));
      ws.on("pause", () => setIsPlaying(false));
      ws.on("finish", () => {
        setIsPlaying(false);
        ws.seekTo(0);
      });

      wavesurferRef.current = ws;

      return () => {
        ws.destroy();
      };
    }
  }, [originalFile?.previewUrl, containerRef.current]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const iconEl = AUDIO_TOOL_ICONS[tool.title] ?? <Mic2 size={40} strokeWidth={1} className="text-accent" />;
  const gradColor = AUDIO_TOOL_COLORS[tool.title] ?? "from-accent/15 to-purple-500/10";
  const isVocalRemover = tool.title === "Vocal Remover";
  const isStemSeparator = tool.title === "Stem Separator";

  const sidebar = tool.outputFormats?.length ? (
    <div className="space-y-6">
      <ControlSection title="Output Format">
        <SelectGrid options={tool.outputFormats.map((f) => ({ id: f, label: f.toUpperCase() }))} value={format} onChange={setFormat} />
      </ControlSection>
      {tool.title === "Format Converter" && (
        <ControlSection title="Conversion Quality">
           <SelectGrid 
            options={[
              { id: "low", label: "Fast / Small" },
              { id: "medium", label: "Balanced" },
              { id: "high", label: "High Quality" },
            ]} 
            value={quality} 
            onChange={(v) => setQuality(v)} 
          />
        </ControlSection>
      )}
    </div>
  ) : null;

  return (
    <WorkspaceLayout
      title={tool.title}
      description={tool.description}
      badge={`Audio · ${toolkit.toUpperCase()}`}
      sidebar={isDone && sidebar ? sidebar : undefined}
    >
      <AnimatePresence mode="wait">
        {/* IDLE / ERROR */}
        {(state === "idle" || state === "error") && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex h-full flex-col items-center justify-center gap-6"
          >
            <div className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${gradColor}`}>
              {iconEl}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-extrabold text-black">{tool.title}</h3>
              <p className="mt-1 max-w-sm text-sm text-black/40">{tool.description}</p>
            </div>
            {error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>
            )}
            {/* Format quick select */}
            {tool.outputFormats && (
              <div className="flex gap-2">
                {tool.outputFormats.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                      format === f
                        ? "border-accent/30 bg-accent/10 text-accent"
                        : "border-black/10 text-black/40 hover:border-accent/20"
                    }`}
                  >
                    .{f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            <div className="w-full max-w-xl">
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) => upload(f, format ? { output_format: format, quality } : { quality })}
              />
            </div>
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {isVocalRemover && ["AI Vocal Isolation", "Instrumental Track", "GPU Accelerated"].map((b) => (
                <span key={b} className="rounded-full border border-black/5 bg-white/60 px-3 py-1 text-xs font-semibold text-black/40">{b}</span>
              ))}
              {isStemSeparator && ["4-Stem Demucs", "Drums · Bass · Vocals · Other", "High Fidelity"].map((b) => (
                <span key={b} className="rounded-full border border-black/5 bg-white/60 px-3 py-1 text-xs font-semibold text-black/40">{b}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* PROCESSING & DONE STATES */}
        {(isProcessing || isDone) && (
          <motion.div
            key="work-area"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col gap-6"
          >
            {/* Main Audio Preview Card */}
            <div className="relative flex-1 flex flex-col justify-center rounded-[2.5rem] border border-black/5 bg-white/60 p-8 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradColor} shadow-inner`}>
                    {React.cloneElement(iconEl as React.ReactElement, { size: 24, className: "text-white" })}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Original Source</p>
                    {originalFile && (
                      <p className="mt-0.5 text-lg font-black text-black truncate max-w-[200px] sm:max-w-[400px]">
                        {originalFile.file.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {waveDuration && (
                    <div className="px-3 py-1.5 rounded-full bg-black/5">
                      <span className="text-xs font-mono font-black text-black/60">{formatDuration(waveDuration)}</span>
                    </div>
                  )}
                  <button
                    onClick={togglePlay}
                    disabled={!waveDuration}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-600 text-white shadow-xl shadow-accent/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
                  >
                    {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                  </button>
                </div>
              </div>

              {/* Enhanced Waveform Container */}
              <div className="group relative mt-2 rounded-[2rem] bg-black/[0.04] p-8 transition-all hover:bg-black/[0.06]">
                <div ref={containerRef} className="w-full min-h-[120px] cursor-pointer" />
                {!waveDuration && (
                  <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <Loader className="h-5 w-5 animate-spin text-accent" />
                    <span className="text-sm font-bold text-black/40">Analyzing Audio Waveform...</span>
                  </div>
                )}
                
                {/* Visual accents */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-1 w-1 rounded-full bg-black" />
                  ))}
                </div>
              </div>

              {/* Status Indicator Overlay (Only during processing) */}
              {isProcessing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2.5rem] bg-white/20 backdrop-blur-[2px]">
                  <div className="mt-48">
                    <ProcessingOverlay label={`${tool.title} is crunching the audio...`} />
                  </div>
                </div>
              )}
            </div>

            {/* Results / Download Actions */}
            {isDone && (
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
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-black">Processing Complete</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs font-semibold text-black/50">
                      {isVocalRemover ? "Vocals & Instrumental ready" : isStemSeparator ? "All 4 stems ready" : "Result ready to download"}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-black/20" />
                    <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold tracking-widest text-black/60 uppercase">
                      {format || "AUDIO"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex w-full sm:w-auto flex-wrap items-center gap-3">
                {isVocalRemover && (
                  <>
                    <a href={getDownloadUrl(toolkit, job!.job_id, "vocals")} download className="flex-1 sm:flex-none">
                      <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-5 py-3 text-sm font-bold text-accent transition-all hover:bg-accent/10 active:scale-95">
                        <Download size={15} /> Vocals
                      </button>
                    </a>
                    <a href={getDownloadUrl(toolkit, job!.job_id, "instrumental")} download className="flex-1 sm:flex-none">
                      <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-5 py-3 text-sm font-bold text-accent transition-all hover:bg-accent/10 active:scale-95">
                        <Download size={15} /> Instrumental
                      </button>
                    </a>
                    <a href={getDownloadUrl(toolkit, job!.job_id)} download className="flex-1 sm:flex-none group relative">
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-accent to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-60" />
                      <button className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-95">
                        <Download size={15} /> Both (ZIP)
                      </button>
                    </a>
                  </>
                )}
                {isStemSeparator && (
                  <>
                    {["drums", "bass", "vocals", "other"].map((stem) => (
                      <a key={stem} href={getDownloadUrl(toolkit, job!.job_id, stem)} download className="flex-1 sm:flex-none min-w-[100px]">
                        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-bold text-accent transition-all hover:bg-accent/10 active:scale-95 capitalize">
                          <Download size={14} /> {stem}
                        </button>
                      </a>
                    ))}
                    <a href={getDownloadUrl(toolkit, job!.job_id)} download className="flex-1 sm:flex-none w-full sm:w-auto group relative">
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-accent to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-60" />
                      <button className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-95">
                        <Download size={15} /> All (ZIP)
                      </button>
                    </a>
                  </>
                )}
                {!isVocalRemover && !isStemSeparator && (
                  <>
                    <button
                      onClick={() => window.location.reload()}
                      className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-bold text-black/70 transition-all hover:border-black/20 hover:bg-black/5 active:scale-95"
                    >
                      <RefreshCw size={15} /> Process Another
                    </button>
                    <a href={getDownloadUrl(toolkit, job!.job_id)} download className="flex-1 sm:flex-none group relative">
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-accent to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-60" />
                      <button className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-95">
                        <Download size={15} /> Download Result
                      </button>
                    </a>
                  </>
                )}
              </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}

