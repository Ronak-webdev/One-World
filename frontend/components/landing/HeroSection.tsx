"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useMemo, useState, useEffect } from "react";

import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const Hyperspeed = dynamic(
  () => import("@/components/three/Hyperspeed").then((m) => m.default),
  { ssr: false }
);


const phrases = [
  "is here.",
  "in one place.",
  "in one world.",
  "to create faster.",
  "for AI creators.",
  "for limitless creativity.",
  "for next-gen workflows.",
  "for hyperspeed production.",
  "to build anything.",
  "for the future.",
  "without limits.",
  "powered by AI.",
  "all in one platform.",
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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const opts = useMemo(() => hyperspeedOptions, []);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section
      ref={ref}
      className="relative flex min-h-svh items-start justify-center px-5 pb-16 pt-24 text-center overflow-hidden transition-colors duration-500 bg-[var(--background)]"
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

        {/* Headline */}
        <h1 className="text-4xl sm:text-[44px] md:text-6xl lg:text-[72px] font-extrabold leading-[1.1] tracking-tight text-[var(--text-1)]">
          <span className="block mb-2 opacity-90">Everything you need</span>
          <div className="relative h-[1.6em] flex items-center justify-center overflow-visible">
            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={{ y: 30, opacity: 0, filter: "blur(10px) drop-shadow(0 0 0px rgba(91,91,214,0))" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px) drop-shadow(0 0 15px rgba(91,91,214,0.4))" }}
                exit={{ y: -30, opacity: 0, filter: "blur(10px) drop-shadow(0 0 0px rgba(91,91,214,0))" }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.16, 1, 0.3, 1],
                  opacity: { duration: 0.4 }
                }}
                className="absolute font-['Dancing_Script',_cursive] bg-gradient-to-r from-accent via-purple-400 to-accent bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient py-2"
              >
                {phrases[index]}
              </motion.span>
            </AnimatePresence>
          </div>
        </h1>

        {/* Subtext */}
        <motion.p
          className="mx-auto mt-5 w-[90%] max-w-[560px] text-sm sm:text-base leading-relaxed text-[var(--text-2)] md:mt-6 md:text-lg md:leading-8"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, duration: 0.4, ease: [0, 0, 0.2, 1] }}
        >
          Audio separation, image editing, file conversion, and experimental AI running locally on your machine.
        </motion.p>



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
