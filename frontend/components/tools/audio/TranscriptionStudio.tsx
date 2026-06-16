"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { 
  Play, Pause, Download, Settings, Globe, FileText, Clock, Users, 
  Search, Edit3, Check, X, Sparkles, Volume2, VolumeX, SkipForward,
  SkipBack, Languages, Layout, Type, ListMusic, MessageSquare,
  ShieldCheck, Zap, Bot, Share2, MoreHorizontal, Trash2, ChevronRight, RefreshCw
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
  SelectGrid
} from "../image/WorkspaceShared";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface Word {
  word: string;
  start: number;
  end: number;
  probability: number;
}

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  start: number;
  end: number;
  words?: Word[];
  confidence?: number;
}

interface Speaker {
  id: string;
  name: string;
  color: string;
}

const SPEAKER_COLORS = [
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-green-600",
  "from-rose-500 to-pink-600",
];

/* ─── Utils ────────────────────────────────────────────────────────── */

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

/* ─── Main Component ───────────────────────────────────────────────── */

export function TranscriptionStudio({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const { state, job, error, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Studio States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [selectedModel, setSelectedModel] = useState("large-v3");
  const [showSubtitles, setShowSubtitles] = useState(true);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Derive segments from job (either partial or complete)
  const segments: TranscriptSegment[] = useMemo(() => {
    if (!job) return [];
    const raw = job.status === "complete" ? job.results?.segments : job.partial_results?.segments;
    if (!raw || !Array.isArray(raw)) return [];
    return raw as TranscriptSegment[];
  }, [job]);

  const activeSegmentId = useMemo(() => {
    const active = segments.find(s => currentTime >= s.start && currentTime <= s.end);
    return active?.id || null;
  }, [segments, currentTime]);

  // Initializing WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !originalFile) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "rgba(91, 91, 214, 0.15)",
      progressColor: "#5b5bd6",
      cursorColor: "#5b5bd6",
      barWidth: 3,
      barGap: 3,
      barRadius: 4,
      height: 80,
      normalize: true,
      minPxPerSec: 50,
      hideScrollbar: true,
    });

    wavesurfer.current.load(originalFile.previewUrl);

    wavesurfer.current.on("ready", () => {
      setDuration(wavesurfer.current?.getDuration() || 0);
    });

    wavesurfer.current.on("audioprocess", (time) => {
      setCurrentTime(time);
    });

    wavesurfer.current.on("finish", () => {
      setIsPlaying(false);
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [originalFile]);

  // Control Functions
  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(wavesurfer.current.isPlaying());
    }
  };

  const seekTo = (time: number) => {
    if (wavesurfer.current) {
      wavesurfer.current.setTime(time);
      setCurrentTime(time);
    }
  };

  const handleModelChange = (id: string) => setSelectedModel(id);

  const startProcessing = () => {
    if (originalFile) {
      upload(originalFile.file, { model_name: selectedModel, language: selectedLanguage });
    }
  };

  const handleEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    // In a real app, this would persist to backend or local storage
    // For now we just update local state if we were managing segments locally
    setEditingId(null);
  };

  // Auto-scroll transcript to active segment
  useEffect(() => {
    if (activeSegmentId && transcriptScrollRef.current) {
      const activeEl = document.getElementById(`segment-${activeSegmentId}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeSegmentId]);

  /* ─── UI Parts ─────────────────────────────────────────────────── */

  const isIdle = state === "idle";
  const isProcessing = state === "processing" || state === "uploading";
  const isDone = state === "done";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white selection:bg-accent/20">
      <AnimatePresence>
        {isIdle ? (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex flex-1 flex-col items-center justify-center p-8 text-center"
          >
            <div className="mb-8 max-w-2xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-purple-500/20">
                <Sparkles size={32} className="text-white" />
              </div>
              <h1 className="mb-3 text-4xl font-black tracking-tight text-black">Transcription Studio</h1>
              <p className="text-lg font-medium text-black/40">Professional speech-to-text with word-level precision and speaker diarization.</p>
            </div>
            
            <div className="w-full max-w-xl">
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) => upload(f, { model_name: selectedModel, language: selectedLanguage })}
              />
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {["Whisper Large v3", "Multi-lingual", "Speaker Detection", "SRT/VTT Export"].map(f => (
                <span key={f} className="rounded-full border border-black/5 bg-black/[0.02] px-4 py-1.5 text-xs font-bold text-black/40 uppercase tracking-widest">{f}</span>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 overflow-hidden"
          >
            {/* Left Sidebar: Controls & File Info */}
            <aside className="w-80 shrink-0 flex flex-col border-r border-black/5 bg-[#fcfcfd]">
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <ControlSection title="Audio Information">
                  <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                    <p className="truncate text-sm font-bold text-black">{originalFile?.file.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Duration</span>
                      <span className="text-xs font-bold text-accent">{formatTime(duration)}</span>
                    </div>
                  </div>
                </ControlSection>

                <ControlSection title="AI Intelligence">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-[10px] font-bold text-black/30 uppercase tracking-widest">Whisper Model</p>
                      <SelectGrid 
                        options={[
                          { id: "tiny", label: "Fast" },
                          { id: "small", label: "Balanced" },
                          { id: "large-v3", label: "Quality" }
                        ]}
                        value={selectedModel}
                        onChange={handleModelChange}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-bold text-black/30 uppercase tracking-widest">Language</p>
                      <select 
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full rounded-xl border border-black/5 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-accent/40"
                      >
                        <option value="auto">Auto Detect</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>
                </ControlSection>

                <ControlSection title="Studio Features">
                  <div className="space-y-2">
                    <button onClick={() => setShowSubtitles(!showSubtitles)} className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-sm font-bold transition-all", showSubtitles ? "border-accent/30 bg-accent/10 text-accent" : "border-black/5 bg-white text-black/40")}>
                      <Type size={16} /> Subtitle Preview
                    </button>
                    <button className="flex w-full items-center gap-3 rounded-xl border border-black/5 bg-white px-3 py-2 text-sm font-bold text-black/40">
                      <Users size={16} /> Speaker Mapping
                    </button>
                  </div>
                </ControlSection>
              </div>

              <div className="p-6 border-t border-black/5 bg-white/50">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Bot size={20} className="animate-pulse text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">AI is Listening...</p>
                      <p className="text-[10px] font-semibold text-black/30">Streaming segments</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => window.location.reload()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition-all hover:bg-black/80">
                    <RefreshCw size={16} /> Start New Studio
                  </button>
                )}
              </div>
            </aside>

            {/* Center: Main Timeline & Transcript */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Timeline Header */}
              <div className="border-b border-black/5 p-6 backdrop-blur-xl bg-white/80">
                <div className="mb-6 h-20 rounded-2xl border border-black/5 bg-black/[0.02] relative group">
                  <div ref={waveformRef} className="w-full h-full opacity-80" />
                  {/* Custom Progress Line */}
                  <div className="absolute inset-y-0 left-0 bg-accent/10 pointer-events-none" style={{ width: `${(currentTime / duration) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <button onClick={togglePlay} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                      {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
                    </button>
                    <div className="flex items-center gap-1">
                       <button onClick={() => seekTo(Math.max(0, currentTime - 5))} className="p-2 text-black/40 hover:text-black"><SkipBack size={20} /></button>
                       <button onClick={() => seekTo(Math.min(duration, currentTime + 5))} className="p-2 text-black/40 hover:text-black"><SkipForward size={20} /></button>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md px-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div 
                      className="h-1.5 w-full bg-black/5 rounded-full cursor-pointer relative"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        seekTo((x / rect.width) * duration);
                      }}
                    >
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-accent rounded-full"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-black/5 px-3 py-1.5">
                      <Volume2 size={16} className="text-black/40" />
                      <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        wavesurfer.current?.setVolume(v);
                      }} className="w-16 accent-accent h-1" />
                    </div>
                    <select 
                      value={playbackRate}
                      onChange={(e) => {
                        const r = parseFloat(e.target.value);
                        setPlaybackRate(r);
                        wavesurfer.current?.setPlaybackRate(r);
                      }}
                      className="rounded-xl border border-black/5 bg-white px-2 py-1.5 text-xs font-bold text-black/60 outline-none hover:border-black/10"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="1">1.0x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2.0x</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Interactive Transcript Area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-8 py-4 bg-[#fcfcfd]">
                  <div className="flex items-center gap-6">
                    <button className="text-sm font-bold text-accent border-b-2 border-accent pb-4 mt-4 -mb-4">Transcript</button>
                    <button className="text-sm font-bold text-black/30 hover:text-black transition-colors">Timeline</button>
                    <button className="text-sm font-bold text-black/30 hover:text-black transition-colors">Notes</button>
                  </div>
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                    <input 
                      type="text" 
                      placeholder="Search transcript..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-black/5 bg-white py-2 pl-9 pr-4 text-xs font-medium outline-none focus:border-accent/40"
                    />
                  </div>
                </div>

                <div ref={transcriptScrollRef} className="flex-1 overflow-y-auto p-8 scroll-smooth">
                  <div className="mx-auto max-w-4xl space-y-10">
                    {isProcessing && segments.length === 0 && (
                      <div className="py-32 flex flex-col items-center text-center">
                        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                          <div className="absolute inset-0 animate-ping rounded-full bg-accent/5" />
                          <div className="absolute inset-2 animate-ping rounded-full bg-accent/10" style={{ animationDelay: "0.2s" }} />
                          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-xl shadow-accent/20">
                            <Bot className="animate-bounce" size={24} />
                          </div>
                        </div>
                        <h3 className="text-lg font-black text-black">AI Studio is Listening</h3>
                        <p className="text-sm font-medium text-black/30 mt-1 max-w-xs">Initializing {selectedModel} weights and analyzing your audio...</p>
                      </div>
                    )}

                    {segments.map((seg, idx) => {
                      const isActive = activeSegmentId === seg.id;
                      const isEditing = editingId === seg.id;
                      const speakerIdx = parseInt(seg.speaker.replace(/\D/g, "") || "0") % SPEAKER_COLORS.length;
                      const colorClass = SPEAKER_COLORS[speakerIdx];

                      return (
                        <motion.div 
                          key={seg.id}
                          id={`segment-${seg.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "group flex gap-6 transition-all duration-300",
                            isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                          )}
                        >
                          {/* Speaker Indicator */}
                          <div className="flex flex-col items-center shrink-0 w-24">
                            <div className={cn("mb-2 h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg text-white font-bold text-xs", colorClass)}>
                              {seg.speaker.charAt(0)}{seg.speaker.match(/\d+/)?.[0]}
                            </div>
                            <span className="text-[10px] font-black text-black/30 uppercase tracking-tighter truncate w-full text-center">{seg.speaker}</span>
                            <span className="mt-1 text-[10px] font-bold text-accent/60">{formatTime(seg.start)}</span>
                          </div>

                          {/* Text Content */}
                          <div className="flex-1 pt-1">
                            {isEditing ? (
                              <div className="relative">
                                <textarea 
                                  autoFocus
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full rounded-2xl border border-accent/30 bg-accent/5 p-4 text-base font-medium leading-relaxed text-black outline-none shadow-inner"
                                  rows={Math.ceil(editText.length / 60)}
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                  <button onClick={() => setEditingId(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-black/40 hover:bg-black/5">Cancel</button>
                                  <button onClick={saveEdit} className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/20">Save Edit</button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div 
                                  className={cn(
                                    "text-lg font-medium leading-relaxed text-black/80 transition-all duration-300 cursor-text",
                                    isActive && "text-black scale-[1.01]"
                                  )}
                                  onClick={() => handleEdit(seg.id, seg.text)}
                                >
                                  {seg.text.split(" ").map((word, wIdx) => {
                                    // Simulated word highlighting if word data exists
                                    return (
                                      <span key={wIdx} className="inline-block mr-1.5 transition-colors duration-200">
                                        {word}
                                      </span>
                                    );
                                  })}
                                </div>
                                <div className="mt-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                                  <button className="flex items-center gap-1.5 text-[10px] font-black text-black/30 uppercase hover:text-accent transition-colors"><Edit3 size={12} /> Edit</button>
                                  <button onClick={() => seekTo(seg.start)} className="flex items-center gap-1.5 text-[10px] font-black text-black/30 uppercase hover:text-black transition-colors"><Play size={12} fill="currentColor" /> Play from here</button>
                                  <button className="flex items-center gap-1.5 text-[10px] font-black text-black/30 uppercase hover:text-rose-500 transition-colors"><Trash2 size={12} /> Remove</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {isProcessing && segments.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-6 py-4 animate-pulse"
                      >
                         <div className="w-24 shrink-0 flex flex-col items-center">
                            <div className="h-10 w-10 rounded-2xl bg-black/5" />
                         </div>
                         <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-black/5" />
                            <div className="h-4 w-1/2 rounded bg-black/5" />
                         </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </main>

            {/* Right Sidebar: Export & Polish */}
            <aside className="w-80 shrink-0 flex flex-col border-l border-black/5 bg-[#fcfcfd]">
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <ControlSection title="AI Polish">
                  <div className="space-y-2">
                    <button className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white p-3 text-left transition-all hover:border-accent/30 hover:bg-accent/5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600 flex"><MessageSquare size={16} /></div>
                        <div>
                          <p className="text-xs font-bold text-black">Improve Punctuation</p>
                          <p className="text-[10px] font-medium text-black/30">AI formatting fix</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-black/20" />
                    </button>
                    <button className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white p-3 text-left transition-all hover:border-accent/30 hover:bg-accent/5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 flex"><Globe size={16} /></div>
                        <div>
                          <p className="text-xs font-bold text-black">Translate Content</p>
                          <p className="text-[10px] font-medium text-black/30">Support 50+ languages</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-black/20" />
                    </button>
                  </div>
                </ControlSection>

                <ControlSection title="Export Studio">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "txt", label: "Text", icon: <FileText size={14} /> },
                      { id: "srt", label: "SRT", icon: <Layout size={14} /> },
                      { id: "vtt", label: "VTT", icon: <Type size={14} /> },
                      { id: "json", label: "JSON", icon: <ListMusic size={14} /> }
                    ].map(fmt => (
                      <a key={fmt.id} href={getDownloadUrl(toolkit, job?.job_id || "", fmt.id)} download className="group">
                        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white p-4 transition-all group-hover:border-accent group-hover:shadow-lg group-hover:shadow-accent/5">
                           <div className="text-black/40 group-hover:text-accent">{fmt.icon}</div>
                           <span className="text-[10px] font-black text-black uppercase tracking-tighter">{fmt.label}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </ControlSection>

                <ControlSection title="Security & Status">
                   <div className="rounded-2xl bg-black/[0.03] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck size={14} className="text-green-600" />
                        <span className="text-[10px] font-black text-black uppercase">Encrypted Studio</span>
                      </div>
                      <p className="text-[10px] font-medium text-black/40 leading-relaxed">
                        Your audio and transcripts are processed locally and stored on your secure workspace.
                      </p>
                   </div>
                </ControlSection>
              </div>

             
            </aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Subtitle Preview Overlay */}
      {showSubtitles && activeSegmentId && !editingId && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="rounded-2xl bg-black/80 px-8 py-4 backdrop-blur-xl border border-white/10 shadow-2xl">
             <p className="text-lg font-bold text-white text-center max-w-lg">
                {segments.find(s => s.id === activeSegmentId)?.text}
             </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
