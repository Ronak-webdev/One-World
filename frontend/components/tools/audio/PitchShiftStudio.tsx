"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import WaveSurfer from "wavesurfer.js";

import { useUpload } from "@/hooks/useUpload";
import { downloadUrl as getDownloadUrl, type ToolDefinition } from "@/lib/api";
import { 
  WorkspaceDropZone, 
  ControlSection,
  SelectGrid,
  SliderControl
} from "../image/WorkspaceShared";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Download, Sliders, Settings, Mic2, 
  Volume2, VolumeX, Music, Zap, Radio, Bot, Ghost, AudioLines, Repeat
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function PitchShiftStudio({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const { state, job, error, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopPreview, setLoopPreview] = useState(true);
  
  // Audio Parameters
  const [semitones, setSemitones] = useState(0);
  const [fineTune, setFineTune] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [reverbMix, setReverbMix] = useState(0);
  const [echoMix, setEchoMix] = useState(0);
  const [distortionMix, setDistortionMix] = useState(0);
  
  const [selectedPreset, setSelectedPreset] = useState("default");

  // Tone.js nodes
  const playerRef = useRef<Tone.Player | null>(null);
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const distRef = useRef<Tone.Distortion | null>(null);

  // WaveSurfer Refs
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // --- 1. Init Audio Graph ---
  useEffect(() => {
    let _player: Tone.Player;
    let _pitch: Tone.PitchShift;
    let _reverb: Tone.Reverb;
    let _delay: Tone.FeedbackDelay;
    let _dist: Tone.Distortion;

    const initGraph = async () => {
        await Tone.start();
        _pitch = new Tone.PitchShift({ pitch: 0 });
        _reverb = new Tone.Reverb({ decay: 2, preDelay: 0.01, wet: 0 });
        _delay = new Tone.FeedbackDelay({ delayTime: 0.3, feedback: 0.3, wet: 0 });
        _dist = new Tone.Distortion({ distortion: 0.5, wet: 0 });

        _pitch.chain(_dist, _delay, _reverb, Tone.getDestination());
        pitchShiftRef.current = _pitch;
        reverbRef.current = _reverb;
        delayRef.current = _delay;
        distRef.current = _dist;
    };
    initGraph();
    return () => {
        _player?.dispose();
        _pitch?.dispose();
        _reverb?.dispose();
        _delay?.dispose();
        _dist?.dispose();
    };
  }, []);

  // --- 2. Load File ---
  useEffect(() => {
    if (originalFile?.previewUrl && pitchShiftRef.current) {
      if (playerRef.current) playerRef.current.dispose();
      
      const player = new Tone.Player({
        url: originalFile.previewUrl,
        loop: loopPreview,
        onload: () => {
          setDuration(player.buffer.duration);
        }
      });
      player.connect(pitchShiftRef.current);
      playerRef.current = player;
    }
  }, [originalFile, loopPreview]);

  // --- 3. WaveSurfer Setup ---
  useEffect(() => {
    if (!waveformRef.current || !originalFile) return;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "rgba(0, 0, 0, 0.1)",
      progressColor: "#f43f5e",
      cursorColor: "#e11d48",
      barWidth: 3,
      barGap: 3,
      barRadius: 4,
      height: 120,
      normalize: true,
      interact: true,
      hideScrollbar: true,
    });

    wavesurferRef.current.load(originalFile.previewUrl);
    wavesurferRef.current.setVolume(0); // Mute WaveSurfer so Tone.js handles audio
    
    // Bind interaction from WaveSurfer directly to Tone.Player
    wavesurferRef.current.on('interaction', (newTime) => {
      if (playerRef.current && playerRef.current.loaded) {
        if (playerRef.current.state === "started") {
             playerRef.current.stop();
             playerRef.current.start(0, newTime);     
        }
      }
    });

    wavesurferRef.current.on('audioprocess', (time) => {
      setCurrentTime(time);
    });
    wavesurferRef.current.on('timeupdate', (time) => {
      setCurrentTime(time);
    });
    wavesurferRef.current.on('finish', () => {
      if (!playerRef.current?.loop) {
        setIsPlaying(false);
      }
    });

    return () => wavesurferRef.current?.destroy();
  }, [originalFile]);

  // --- 4. Sync playback clock & Update Effects ---
  useEffect(() => {
    // Update live Tone.js params
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = semitones + (fineTune / 100);
    }
    if (playerRef.current) {
      playerRef.current.playbackRate = playbackSpeed;
    }
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(playbackSpeed);
    }
    if (reverbRef.current) reverbRef.current.wet.value = reverbMix;
    if (delayRef.current) delayRef.current.wet.value = echoMix;
    if (distRef.current) distRef.current.wet.value = distortionMix;

  }, [semitones, fineTune, playbackSpeed, reverbMix, echoMix, distortionMix]);


  const PRESETS = [
    { id: "default", name: "Original", icon: <Music size={16} />, pitch: 0, formants: 0, echo: 0, reverb: 0, dist: 0, speed: 1.0 },
    { id: "deep", name: "Deep Voice", icon: <Mic2 size={16} />, pitch: -5, formants: -3, echo: 0.1, reverb: 0.2, dist: 0, speed: 0.95 },
    { id: "chipmunk", name: "Chipmunk", icon: <Zap size={16} />, pitch: 8, formants: 4, echo: 0, reverb: 0, dist: 0, speed: 1.1 },
    { id: "robot", name: "Robot", icon: <Bot size={16} />, pitch: 0, formants: 0, echo: 0.4, reverb: 0.5, dist: 0.2, speed: 1.0 },
    { id: "horror", name: "Dark Voice", icon: <Ghost size={16} />, pitch: -8, formants: -4, echo: 0.5, reverb: 0.8, dist: 0.3, speed: 0.85 },
    { id: "alien", name: "Alien Entity", icon: <Bot size={16} />, pitch: 4, formants: 2, echo: 0.1, reverb: 0.4, dist: 0.15, speed: 0.9 },
    { id: "underwater", name: "Underwater", icon: <Music size={16} />, pitch: -2, formants: 0, echo: 0.2, reverb: 0.8, dist: 0.05, speed: 0.8 },
    { id: "telephone", name: "Telephone", icon: <Radio size={16} />, pitch: 0, formants: 0, echo: 0.0, reverb: 0.0, dist: 0.8, speed: 1.0 },
    { id: "radio", name: "Radio Host", icon: <Radio size={16} />, pitch: -1, formants: -1, echo: 0.0, reverb: 0.1, dist: 0.05, speed: 1.0 },
  ];

  const handlePlayPause = async () => {
    await Tone.start();
    if (isPlaying) {
      playerRef.current?.stop();
      wavesurferRef.current?.pause();
    } else {
      const currentTime = wavesurferRef.current?.getCurrentTime() || 0;
      playerRef.current?.start(0, currentTime);
      wavesurferRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const setPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(preset.id);
    setSemitones(preset.pitch);
    setPlaybackSpeed(preset.speed);
    setEchoMix(preset.echo);
    setReverbMix(preset.reverb);
    setDistortionMix(preset.dist);
    setFineTune(0);
  };

  const handleExport = () => {
    if (originalFile) {
      upload(originalFile.file, {
        semitones: semitones + (fineTune / 100),
        speed: playbackSpeed,
        reverb: reverbMix,
        delay: echoMix,
        distortion: distortionMix
      });
    }
  };

  const exportedUrl = job?.status === "complete" ? getDownloadUrl(toolkit, job.job_id, "shifted", true) : null;

  const isIdle = state === "idle";
  const isProcessing = state === "processing" || state === "uploading";
  const isDone = state === "done";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white selection:bg-rose-500/20">
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
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-rose-500 to-pink-600 shadow-2xl shadow-rose-500/30">
                <Music size={40} className="text-white fill-current" />
              </div>
              <h1 className="mb-4 text-5xl font-black tracking-tight text-black">Pitch Shift Studio</h1>
              <p className="text-xl font-medium text-black/40">Real-time voice manipulation and pitch modification.</p>
            </div>
            
            <div className="w-full max-w-2xl">
              <WorkspaceDropZone
                accepted={tool.accepted}
                onFile={(f) => upload(f, {}, true)} // Just upload locally for preview
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

            {/* Left Sidebar */}
            <aside className="w-80 shrink-0 flex flex-col border-r border-black/5 bg-[#fcfcfd]">
               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <ControlSection title="Voice Presets">
                  <div className="grid grid-cols-1 gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPreset(p.id)}
                        className={cn(
                          "group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                          selectedPreset === p.id 
                            ? "border-rose-500/30 bg-rose-500/5 shadow-sm" 
                            : "border-black/5 bg-white hover:border-black/10"
                        )}
                      >
                        <div className={cn("mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors", selectedPreset === p.id ? "bg-rose-500 text-white" : "bg-black/5 text-black/40 group-hover:bg-black/10")}>
                          {p.icon}
                        </div>
                        <div>
                          <div className={cn("font-bold", selectedPreset === p.id ? "text-rose-600" : "text-black/70 group-hover:text-black/90")}>{p.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ControlSection>
              </div>
              <div className="border-t border-black/5 p-6 bg-white shrink-0">
                <button 
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-bold text-white shadow-xl shadow-black/10 transition-all hover:scale-[1.02] hover:bg-black/80 disabled:opacity-50"
                >
                  {isProcessing ? "Exporting High Quality..." : "Export File"}
                </button>
              </div>
            </aside>

            {/* Center Canvas */}
            <main className="flex-1 overflow-y-auto bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:32px_32px]">
               <div className="flex min-h-full flex-col p-8">
                  {/* Player */}
                  <div className="relative rounded-[2.5rem] border border-black/5 bg-white/60 p-8 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
                     <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-pink-600/10 shadow-inner">
                          <Music size={24} className="text-rose-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-black">Real-time Preview</h3>
                          <p className="text-xs font-semibold text-black/40">Zero-latency Tone.js graph</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative mb-6 rounded-2xl border border-black/5 bg-white px-2 py-4 shadow-sm">
                      <div ref={waveformRef} className="w-full" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-black/30 w-16">{formatTime(currentTime)}</div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handlePlayPause}
                          className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-xl shadow-rose-500/30 transition-transform hover:scale-105 active:scale-95"
                        >
                          {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="ml-1 fill-current" />}
                        </button>
                      </div>
                      <div className="text-sm font-bold text-black/30 w-16 text-right">{formatTime(duration)}</div>
                    </div>
                  </div>

                  {exportedUrl && (
                    <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/5 p-6 flex justify-between items-center text-green-700">
                      <div>
                        <h4 className="font-bold">Export Complete</h4>
                        <p className="text-sm opacity-80">High-fidelity processing finished locally via Pedalboard.</p>
                      </div>
                      <a href={exportedUrl} download className="flex px-4 py-2 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700">
                        <Download size={18} className="mr-2" /> Download
                      </a>
                    </div>
                  )}

               </div>
            </main>

             {/* Right Sidebar: Real-Time Advanced Settings */}
            <aside className="w-80 shrink-0 border-l border-black/5 bg-[#fcfcfd] p-6 shadow-[-32px_0_64px_-16px_rgba(0,0,0,0.05)] overflow-y-auto">
              <div className="mb-8 flex items-center gap-3">
                <Sliders size={20} className="text-black/40" />
                <h3 className="font-bold text-black/70 uppercase tracking-widest text-xs">Audio Graph Nodes</h3>
              </div>

              <div className="space-y-6">
                <ControlSection title="Pitch & Speed">
                  <SliderControl 
                    label="Semitones Shift" 
                    value={semitones} 
                    onChange={setSemitones} 
                    min={-24} 
                    max={24} 
                    step={1} 
                    formatValue={(v) => `${v > 0 ? "+" : ""}${v}`} 
                  />
                  <SliderControl 
                    label="Fine Tune (Cents)" 
                    value={fineTune} 
                    onChange={setFineTune} 
                    min={-100} 
                    max={100} 
                    step={1} 
                  />
                  <SliderControl 
                    label="Playback Speed" 
                    value={playbackSpeed} 
                    onChange={setPlaybackSpeed} 
                    min={0.25} 
                    max={2.0} 
                    step={0.05} 
                    formatValue={(v) => `${v}x`} 
                  />
                </ControlSection>
                
                <ControlSection title="Effects Chain">
                  <SliderControl 
                    label="Reverb" 
                    value={reverbMix} 
                    onChange={setReverbMix} 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    formatValue={(v) => `${(v*100).toFixed(0)}%`} 
                  />
                  <SliderControl 
                    label="Echo / Delay" 
                    value={echoMix} 
                    onChange={setEchoMix} 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    formatValue={(v) => `${(v*100).toFixed(0)}%`} 
                  />
                  <SliderControl 
                    label="Distortion Drive" 
                    value={distortionMix} 
                    onChange={setDistortionMix} 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    formatValue={(v) => `${(v*100).toFixed(0)}%`} 
                  />
                </ControlSection>

                {/* Status Indicator */}
                <div className="rounded-xl bg-green-500/10 p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-green-700">Tone.js Online</span>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-green-700/60 leading-tight">Zero-latency preview active. Adjustments apply instantly to playback.</p>
                </div>
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
