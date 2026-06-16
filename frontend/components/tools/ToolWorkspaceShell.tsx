"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Layers, Zap, Sparkles, Wand2, Eraser, FileType2, Package, 
  Mic2, Music2, FileText, FileCode, FileImage, Video, Palette, Image as ImageIcon,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { type ToolDefinition } from "@/lib/api";
import { ImageToolWorkspace } from "./ImageToolWorkspace";
import { AudioToolWorkspace } from "./AudioToolWorkspace";
import { TranscriptionStudio } from "./audio/TranscriptionStudio";
import { AudioEnhancerStudio } from "./audio/AudioEnhancerStudio";
import { ConvertToolWorkspace } from "./ConvertToolWorkspace";
import { LabToolWorkspace } from "./LabToolWorkspace";
import { PitchShiftStudio } from "./audio/PitchShiftStudio";
import { cn } from "@/lib/utils";

type ToolWorkspaceShellProps = {
  toolkit: "image" | "audio" | "convert" | "lab";
  tools: ToolDefinition[];
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  // Image
  "Background Remover": <Layers size={16} />,
  "Upscaler": <Zap size={16} />,
  "Enhancer": <Sparkles size={16} />,
  "Filter Studio": <Wand2 size={16} />,
  "Object Remover": <Eraser size={16} />,
  "Format Converter": <FileType2 size={16} />,
  "Batch Processor": <Package size={16} />,
  // Audio
  "Vocal Remover": <Mic2 size={16} />,
  "Stem Separator": <Music2 size={16} />,
  "Transcription": <FileType2 size={16} />,
  "Pitch Shift": <Zap size={16} />,
  "Noise Reduction": <Sparkles size={16} />,
  "Silence Remover": <Eraser size={16} />,
  // Convert
  "PDF to Word": <FileText size={16} />,
  "Word to PDF": <FileText size={16} />,
  "PDF to PPT": <FileText size={16} />,
  "PDF to TXT": <FileText size={16} />,
  "Markdown to PDF": <FileCode size={16} />,
  "Image Convert": <FileImage size={16} />,
  "Media Convert": <Video size={16} />,
  // Lab
  "Style Transfer": <Palette size={16} />,
  "Placeholders": <ImageIcon size={16} />,
  "AI Lab Assistant": <Bot size={16} />,
};

export function ToolWorkspaceShell({ toolkit, tools }: ToolWorkspaceShellProps) {
  const [active, setActive] = useState(tools[0]?.title ?? "");
  const tool = useMemo(() => tools.find((item) => item.title === active) ?? tools[0], [active, tools]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f8f8fb] font-sans text-[var(--foreground)]">
      {/* Top Header */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-black/5 bg-white/80 px-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-2 text-sm font-semibold text-black/50 transition-colors hover:text-accent">
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
            Hub
          </Link>
          <div className="h-4 w-px bg-black/10" />
          <div className="flex items-center gap-2">
            <div className="h-5 items-center rounded-full bg-accent/10 px-2.5 text-[10px] font-bold uppercase tracking-wider text-accent flex">
              {toolkit} Studio
            </div>
            <span className="text-sm font-bold text-black/70">/</span>
            <span className="text-sm font-semibold text-black">{active}</span>
          </div>
        </div>

      </header>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Premium Sidebar - Hidden if only one tool exists (Full Screen mode) */}
        {tools.length > 1 && (
          <aside className="relative z-10 w-full shrink-0 border-b border-black/5 bg-white/60 pb-3 pt-3 backdrop-blur-2xl overflow-x-auto minimal-scrollbar md:w-56 md:border-b-0 md:border-r md:overflow-y-auto">
            <nav className="flex gap-2 px-2 md:flex-col md:gap-0.5">
              <div className="hidden px-3 text-[10px] font-bold uppercase tracking-widest text-black/30 md:mb-3 md:block">
                {toolkit.toUpperCase()} Tools
              </div>
              {tools.map((item) => {
                const isActive = active === item.title;
                const icon = TOOL_ICONS[item.title];
                return (
                  <button
                    key={item.title}
                    onClick={() => setActive(item.title)}
                    className={cn(
                      "group relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 md:shrink-1",
                      isActive ? "text-accent" : "text-black/50 hover:text-black"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-accent/8 shadow-[inset_0_0_0_1px_rgba(91,91,214,0.12)]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className={cn("relative z-10 shrink-0", isActive ? "text-accent" : "text-black/30 group-hover:text-black/60")}>
                      {icon}
                    </span>
                    <span className="relative z-10 truncate">{item.title}</span>
                    {isActive && (
                      <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Workspace Canvas */}
        <main className={cn(
          "relative flex-1 flex flex-col overflow-hidden",
          tools.length > 1 ? "p-4" : "p-0"
        )}>
          {/* Subtle grid background - Hidden in single-tool mode to allow component's custom BG */}
          {tools.length > 1 && (
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_30%,transparent_100%)]" />
          )}

          <div className="relative z-10 flex-1 flex flex-col min-h-0 h-full w-full">
            <AnimatePresence>
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full"
              >
                {toolkit === "image" ? (
                  <ImageToolWorkspace toolkit={toolkit} tool={tool} />
                ) : toolkit === "audio" ? (
                  tool.title === "Transcription" ? (
                    <TranscriptionStudio toolkit={toolkit} tool={tool} />
                  ) : tool.title === "Enhancer" ? (
                    <AudioEnhancerStudio toolkit={toolkit} tool={tool} />
                  ) : tool.title === "Pitch Shift" ? (
                    <PitchShiftStudio toolkit={toolkit} tool={tool} />
                  ) : (
                    <AudioToolWorkspace toolkit={toolkit} tool={tool} />
                  )
                ) : toolkit === "convert" ? (
                  <ConvertToolWorkspace toolkit={toolkit} tool={tool} />
                ) : (
                  <LabToolWorkspace toolkit={toolkit} tool={tool} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
