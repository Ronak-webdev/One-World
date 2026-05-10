"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowRight, Cpu, Lock, Sparkles, Zap } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { SplitText } from "@/components/ui/SplitText";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const Hyperspeed = dynamic(
  () => import("@/components/three/Hyperspeed").then((m) => m.default),
  { ssr: false }
);

const pills = [
  ["4 AI Models", Cpu],
  ["100% Local", Lock],
  ["No API Keys", Sparkles],
  ["RTX Optimized", Zap]
];

const queueItems = [
  { name: "Audio stem split", width: "72%", queue: 1 },
  { name: "Background remove", width: "86%", queue: 2 },
  { name: "PDF to Word", width: "58%", queue: 3 }
];

const hyperspeedOptions = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: "turbulentDistortion" as const,
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 0.5,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5] as [number, number],
  lightStickHeight: [1.3, 1.7] as [number, number],
  movingAwaySpeed: [60, 80] as [number, number],
  movingCloserSpeed: [-120, -160] as [number, number],
  carLightsLength: [400 * 0.1, 400 * 0.4] as [number, number],
  carLightsRadius: [0.08, 0.2] as [number, number],
  carWidthPercentage: [0.3, 0.5] as [number, number],
  carShiftX: [-0.8, 0.8] as [number, number],
  carFloorSeparation: [0, 5] as [number, number],
  colors: {
    roadColor: 0x050505,
    islandColor: 0x050505,
    background: 0x000000,
    shoulderLines: 0xffffff,
    brokenLines: 0xffffff,
    leftCars: [0xff00ff, 0x8800ff, 0xaa00ff] as number[],
    rightCars: [0x00ffff, 0x0088ff, 0x0055ff] as number[],
    sticks: 0x00ffff
  }
};

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const opts = useMemo(() => hyperspeedOptions, []);
  const { isDark } = useTheme();

  return (
    <section
      ref={ref}
      className="relative flex min-h-svh items-center justify-center px-5 pb-16 pt-24 text-center overflow-hidden transition-colors duration-500 bg-[var(--background)]"
    >
      {/* Hyperspeed WebGL background */}
      <div className="absolute inset-0 z-0">
        <Hyperspeed effectOptions={opts} />
        {/* Theme-aware overlay */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-700 pointer-events-none",
          isDark 
            ? "bg-gradient-to-b from-black/20 via-transparent to-black/40 opacity-100" 
            : "bg-white/20 opacity-100"
        )} />
      </div>

      {/* Parallax background blobs */}
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 h-72 w-72 rounded-full bg-purple-500/8 blur-[60px]" />
      </motion.div>

      {/* Grid overlay */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none z-[2] transition-opacity duration-500",
          isDark ? "opacity-[0.03]" : "opacity-[0.05]"
        )}
        style={{
          backgroundImage: isDark 
            ? "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)"
            : "linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />

      <motion.div style={{ opacity }} className="relative z-10 mx-auto max-w-[840px]">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 backdrop-blur-sm mb-6"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
          <p className="text-xs font-semibold uppercase text-[var(--text-2)] tracking-widest">
            AI-powered tools for every creative need
          </p>
        </motion.div>

        {/* Headline */}
        <h1 className="text-[44px] font-extrabold leading-[1.05] text-[var(--text-1)] md:text-7xl">
          <SplitText text="Everything you need to create. In one place." />
        </h1>

        {/* Subtext */}
        <motion.p
          className="mx-auto mt-5 max-w-[560px] text-base leading-7 text-[var(--text-2)] md:mt-6 md:text-lg md:leading-8"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, duration: 0.4, ease: [0, 0, 0.2, 1] }}
        >
          Audio separation, image editing, file conversion, and experimental AI running locally on your machine.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row md:mt-9"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54, duration: 0.4, ease: [0, 0, 0.2, 1] }}
        >
          <Link href="/audio">
            <Button
              size="lg"
              variant="primary"
              className="group shadow-md hover:shadow-lg transition-all duration-300"
            >
              Get Started
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
          <a
            className="inline-flex h-[52px] items-center gap-2 px-5 text-[var(--text-2)] transition-all duration-200 hover:text-[var(--text-1)] hover:gap-3 rounded-full hover:bg-[var(--surface-2)]"
            href="#workflow"
          >
            See how it works
            <ArrowDown size={16} className="animate-bounce" />
          </a>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          className="mt-10 hidden flex-wrap justify-center gap-2 sm:flex md:mt-12"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.64, duration: 0.4 }}
        >
          {pills.map(([label, Icon], i) => (
            <motion.span
              key={label as string}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.64 + i * 0.06, duration: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/50 backdrop-blur-sm hover:border-accent/30 hover:bg-accent/[0.06] hover:text-white transition-all duration-200 cursor-default"
            >
              <Icon size={13} className="text-accent" />
              {label as string}
            </motion.span>
          ))}
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          className="mx-auto mt-10 max-w-[720px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-left backdrop-blur-md md:mt-12 shadow-[var(--card-shadow-hover)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.76, duration: 0.6, ease: [0, 0, 0.2, 1] }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <div className="rounded-xl bg-[var(--surface-2)] p-4 border border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                </div>
                <span className="font-mono text-xs text-[var(--text-3)] ml-2">wavebrain/local-session</span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-[#34C759]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
                Ready
              </span>
            </div>
            <div className="grid gap-3 pt-4 md:grid-cols-3">
              {queueItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-200 cursor-default"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                >
                  <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: "0%" }}
                      animate={{ width: item.width }}
                      transition={{ delay: 1.1 + index * 0.15, duration: 0.8, ease: [0, 0, 0.2, 1] }}
                    />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--text-1)]">{item.name}</p>
                  <p className="mt-1 text-[11px] text-[var(--text-3)] font-mono">Local queue #{item.queue}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex z-10">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className={cn("h-10 w-px bg-gradient-to-b from-transparent via-[var(--text-3)] to-transparent", isDark ? "opacity-30" : "opacity-50")} />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-3)] opacity-40" />
        </motion.div>
      </div>
    </section>
  );
}
