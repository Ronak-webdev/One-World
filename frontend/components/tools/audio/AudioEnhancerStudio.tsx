"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { 
  Play, Pause, Download, Settings, Sparkles, Wand2, Music2, 
  Volume2, VolumeX, SkipForward, SkipBack, Share2, 
  Mic2, Radio, Headphones, Wind, Trash2, Maximize2, 
  ChevronRight, RefreshCw, Layers, Sliders, Zap, Bot,
  TrendingUp, Activity, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WaveSurfer from "wavesurfer.js";

import { useUpload } from "@/hooks/useUpload";
import { downloadUrl as getDownloadUrl, type ToolDefinition } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  WorkspaceDropZone, 
  ProcessingOverlay, 
  ControlSection,
  SelectGrid,
  SliderControl
} from "../image/WorkspaceShared";

/* ─── Constants ────────────────────────────────────────────────────── */

const PRESETS = [
  { id: "balanced", name: "Balanced", icon: <Wand2 size={16} />, desc: "Default AI restoration" },
  { id: "podcast", name: "Podcast", icon: <Mic2 size={16} />, desc: "Warm studio voice" },
  { id: "studio", name: "Pro Studio", icon: <Radio size={16} />, desc: "High-end mastering" },
  { id: "clean", name: "Clean Dialog", icon: <Headphones size={16} />, desc: "Aggressive noise removal" },
];

/* ─── Utils ────────────────────────────────────────────────────────── */

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/* ─── Main Component ───────────────────────────────────────────────── */

export function AudioEnhancerStudio({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const { state, job, error, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Enhancement States
  const [intensity, setIntensity] = useState(70);
  const [noiseReduction, setNoiseReduction] = useState(50);
  const [clarity, setClarity] = useState(60);
  const [selectedPreset, setSelectedPreset] = useState("balanced");

  // WaveSurfer Refs
  const originalWaveRef = useRef<HTMLDivElement>(null);
  const enhancedWaveRef = useRef<HTMLDivElement>(null);
  const originalWS = useRef<WaveSurfer | null>(null);
  const enhancedWS = useRef<WaveSurfer | null>(null);

  const enhancedUrl = useMemo(() => {
    if (job?.status === "complete") {
      return getDownloadUrl(toolkit, job.job_id, "enhanced", true);
    }
    return null;
  }, [job, toolkit]);

  // Sync original waveform
  useEffect(() => {
    if (!originalWaveRef.current || !originalFile) return;

    originalWS.current = WaveSurfer.create({
      container: originalWaveRef.current,
      waveColor: "rgba(0, 0, 0, 0.1)",
      progressColor: "rgba(0, 0, 0, 0.15)",
      cursorColor: "#5b5bd6",
      barWidth: 3,
      barGap: 3,
      barRadius: 4,
      height: 120,
      normalize: true,
      hideScrollbar: true,
    });

    originalWS.current.load(originalFile.previewUrl);
    
    originalWS.current.on("ready", () => {
      setDuration(originalWS.current?.getDuration() || 0);
    });

    originalWS.current.on("audioprocess", (time) => {
      setCurrentTime(time);
      if (enhancedWS.current && Math.abs(enhancedWS.current.getCurrentTime() - time) > 0.1) {
        enhancedWS.current.setTime(time);
      }
    });

    return () => originalWS.current?.destroy();
  }, [originalFile]);

  // Sync enhanced waveform
  useEffect(() => {
    if (!enhancedWaveRef.current || !enhancedUrl) return;

    enhancedWS.current = WaveSurfer.create({
      container: enhancedWaveRef.current,
      waveColor: "rgba(91, 91, 214, 0.1)",
      progressColor: "#5b5bd6",
      cursorColor: "#5b5bd6",
      barWidth: 3,
      barGap: 3,
      barRadius: 4,
      height: 120,
      normalize: true,
      hideScrollbar: true,
    });

    enhancedWS.current.load(enhancedUrl);

    return () => enhancedWS.current?.destroy();
  }, [enhancedUrl]);

  // Control Sync
  const togglePlay = () => {
    const ws = originalWS.current;
    if (ws) {
      ws.playPause();
      setIsPlaying(ws.isPlaying());
      enhancedWS.current?.playPause();
    }
  };

  const handleProcess = () => {
    if (originalFile) {
      upload(originalFile.file, {
        intensity: intensity / 100,
        noise_reduction: noiseReduction / 100,
        preset: selectedPreset
      });
    }
  };

  /* ─── UI Transitions ───────────────────────────────────────────── */
  const isIdle = state === "idle";
  const isProcessing = state === "processing" || state === "uploading";
  const isDone = state === "done";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white selection:bg-accent/20">
      <AnimatePresence>
        {isIdle ? (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-1 flex-col items-center justify-center p-12 text-center"
          >
            <div className="mb-12 max-w-2xl">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30">
                <Zap size={40} className="text-white fill-current" />
              </div>
              <h1 className="mb-4 text-5xl font-black tracking-tight text-black">Audio Enhancer Studio</h1>
              <p className="text-xl font-medium text-black/40">Professional AI restoration. Remove noise, boost clarity, and master your audio in seconds.</p>
            </div>
            
            <div className="w-full max-w-2xl">
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) => upload(f, { intensity: 0.7, preset: "balanced" })}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 overflow-hidden"
          >
            {/* Left Sidebar: Presets & Controls */}
            <aside className="w-80 shrink-0 flex flex-col border-r border-black/5 bg-[#fcfcfd]">
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <ControlSection title="Enhancement Presets">
                  <div className="grid grid-cols-1 gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPreset(p.id)}
                        className={cn(
                          "group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                          selectedPreset === p.id 
                            ? "border-accent/30 bg-accent/5 shadow-sm" 
                            : "border-black/5 bg-white hover:border-black/10"
                        )}
                      >
                        <div className={cn("mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors", selectedPreset === p.id ? "bg-accent text-white" : "bg-black/5 text-black/40 group-hover:bg-black/10")}>
                          {p.icon}
                        </div>
                        <div>
                          <p className={cn("text-sm font-bold", selectedPreset === p.id ? "text-black" : "text-black/60")}>{p.name}</p>
                          <p className="text-[11px] font-medium text-black/40 leading-tight mt-0.5">{p.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ControlSection>

                <ControlSection title="Fine Tuning">
                  <div className="space-y-6">
                    <SliderControl label="Enhancement Intensity" value={intensity} onChange={setIntensity} />
                    <SliderControl label="Noise Reduction" value={noiseReduction} onChange={setNoiseReduction} />
                    <SliderControl label="Voice Clarity" value={clarity} onChange={setClarity} />
                  </div>
                </ControlSection>
              </div>

              <div className="p-6 border-t border-black/5 bg-white/50">
                <button 
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-black py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-black/80 active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  Apply Enhancement
                </button>
              </div>
            </aside>

            {/* Center: Stacked Waveforms */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
              <div className="flex-1 overflow-y-auto p-12 flex flex-col gap-8">
                 {/* Top Waveform: Original */}
                 <div className="relative group">
                    <div className="mb-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-black/40">
                             <Activity size={16} />
                          </div>
                          <div>
                             <h3 className="text-sm font-black text-black uppercase tracking-tight">Original Source</h3>
                             <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Unprocessed raw audio</p>
                          </div>
                       </div>
                       <div className="rounded-full bg-black/[0.03] px-3 py-1 text-[10px] font-black text-black/20 uppercase tracking-widest border border-black/5">Input Layer</div>
                    </div>
                    <div className="relative h-32 rounded-3xl bg-black/[0.02] border border-black/5 p-6 flex items-center transition-all group-hover:border-black/10 group-hover:bg-black/[0.03]">
                       <div ref={originalWaveRef} className="w-full" />
                       <div className="absolute inset-y-0 left-0 bg-black/5 pointer-events-none" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                    </div>
                 </div>

                 {/* Bottom Waveform: Enhanced */}
                 <div className="relative group">
                    <div className="mb-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                             <TrendingUp size={16} />
                          </div>
                          <div>
                             <h3 className="text-sm font-black text-black uppercase tracking-tight">AI Enhanced Studio</h3>
                             <p className="text-[10px] font-bold text-accent/60 uppercase tracking-widest">Mastered and restored</p>
                          </div>
                       </div>
                       {isDone && (
                         <motion.div 
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           className="rounded-full bg-accent/10 px-3 py-1 text-[10px] font-black text-accent uppercase tracking-widest border border-accent/10"
                         >
                           Output Layer
                         </motion.div>
                       )}
                    </div>

                    <div className="relative h-32 rounded-3xl bg-accent/[0.02] border border-accent/5 p-6 flex items-center min-h-[128px]">
                       <AnimatePresence mode="wait">
                          {isDone ? (
                            <motion.div 
                              key="done"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full h-full flex items-center"
                            >
                               <div ref={enhancedWaveRef} className="w-full" />
                               <div className="absolute inset-y-0 left-0 bg-accent/5 pointer-events-none" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                            </motion.div>
                          ) : isProcessing ? (
                            <motion.div 
                              key="processing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                            >
                               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                                  <Bot size={20} className="animate-bounce text-accent" />
                               </div>
                               <div className="text-center">
                                  <p className="text-[10px] font-black text-black uppercase tracking-widest">Restoring Audio...</p>
                                  <p className="text-[9px] font-bold text-black/30 uppercase mt-0.5 tracking-tighter">Applying neural filters</p>
                               </div>
                            </motion.div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-black/5 rounded-3xl">
                               <p className="text-[10px] font-black text-black/10 uppercase tracking-[0.2em]">Ready for enhancement</p>
                            </div>
                          )}
                       </AnimatePresence>
                    </div>
                 </div>
              </div>

              {/* Player Controls */}
              <div className="border-t border-black/5 p-8 bg-[#fcfcfd]">
                 <div className="mx-auto max-w-4xl flex items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                       <button onClick={togglePlay} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-black text-white shadow-xl transition-all hover:scale-105 active:scale-95">
                          {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
                       </button>
                       <div className="flex items-center gap-1">
                          <button className="p-3 text-black/30 hover:text-black"><SkipBack size={20} /></button>
                          <button className="p-3 text-black/30 hover:text-black"><SkipForward size={20} /></button>
                       </div>
                    </div>

                    <div className="flex-1 px-4">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black/30 mb-2">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                       </div>
                       <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden relative cursor-pointer group">
                          <div className="absolute inset-y-0 left-0 bg-accent transition-all group-hover:bg-accent/80" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-3 rounded-xl bg-black/5 px-4 py-2">
                          <Volume2 size={16} className="text-black/40" />
                          <div className="h-1 w-16 bg-black/10 rounded-full" />
                       </div>
                       {isDone && (
                         <a 
                           href={getDownloadUrl(toolkit, job?.job_id || "")}
                           download
                           className="flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-xs font-black text-white shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
                         >
                            <Download size={14} /> Download
                         </a>
                       )}
                    </div>
                 </div>
              </div>
            </main>

            {/* Right Sidebar: Analysis & Insights */}
            <aside className="w-80 shrink-0 flex flex-col border-l border-black/5 bg-[#fcfcfd]">
               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <ControlSection title="Audio Insights">
                     <div className="space-y-4">
                        <div className="rounded-2xl border border-black/5 bg-white p-4">
                           <p className="text-[10px] font-black text-black/30 uppercase mb-3">Signal Clarity</p>
                           <div className="flex items-end gap-1.5 h-16">
                              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 0.4].map((h, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${h * 100}%` }}
                                  transition={{ delay: i * 0.05 }}
                                  className="flex-1 bg-accent/20 rounded-t-sm"
                                />
                              ))}
                           </div>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-black/[0.02] p-3 border border-black/5">
                           <span className="text-[10px] font-bold text-black/40 uppercase">Restoration Rank</span>
                           <span className="text-xs font-black text-accent">Master Grade</span>
                        </div>
                     </div>
                  </ControlSection>

                  <ControlSection title="AI Intelligence">
                     <div className="space-y-2">
                        <div className="flex items-center gap-3 rounded-2xl bg-white border border-black/5 p-4 shadow-sm">
                           <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                              <BarChart3 size={16} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-black">Spectral Analysis</p>
                              <p className="text-[10px] font-medium text-black/40 leading-tight">Optimizing frequencies</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl bg-white border border-black/5 p-4 shadow-sm">
                           <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                              <Sliders size={16} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-black">Noise Fingerprint</p>
                              <p className="text-[10px] font-medium text-black/40 leading-tight">Environmental cleanup</p>
                           </div>
                        </div>
                        
                        <button 
                          onClick={() => window.location.reload()}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black/[0.03] py-3 text-[10px] font-black uppercase tracking-widest text-black/40 hover:bg-black/5 transition-all"
                        >
                           <RefreshCw size={12} /> Sync Studio Status
                        </button>
                     </div>
                  </ControlSection>
               </div>

               <div className="p-6 border-t border-black/5 bg-white/50">
                  <p className="text-center text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">One World Audio Studio</p>
               </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
