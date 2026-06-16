"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const DOT_POSITIONS = [0.15, 0.4, 0.65, 0.9];

function MilestoneDot({ pos, progress }: { pos: number; progress: number }) {
  const isActive = progress >= pos;
  return (
    <motion.span
      className="absolute -left-[5px] h-[11px] w-[11px] rounded-full border-2 bg-white"
      style={{ top: `${pos * 100}%`, translateY: "-50%" }}
      animate={
        isActive
          ? {
              scale: 1.35,
              borderColor: "rgba(91,91,214,0.9)",
              boxShadow: "0 0 8px 3px rgba(91,91,214,0.45)",
            }
          : {
              scale: 1,
              borderColor: "rgba(0,0,0,0.12)",
              boxShadow: "none",
            }
      }
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
    />
  );
}

type ProgressLineProps = {
  progress: number;
  /** When true, the line stretches to h-full (fills its parent container height) */
  fullHeight?: boolean;
};

export function ProgressLine({ progress, fullHeight = false }: ProgressLineProps) {
  const rawProgress = useMotionValue(0);
  const springProgress = useSpring(rawProgress, {
    stiffness: 75,
    damping: 18,
    mass: 0.8,
    restDelta: 0.001,
  });

  const barHeight = useTransform(springProgress, [0, 1], ["0%", "100%"]);
  const tipTop    = useTransform(springProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    rawProgress.set(progress);
  }, [progress, rawProgress]);

  return (
    <div
      className={[
        "relative w-px flex-shrink-0 bg-black/10",
        fullHeight ? "h-full self-stretch" : "self-stretch min-h-[160px]",
      ].join(" ")}
    >
      {/* Animated fill bar */}
      <motion.div
        className="absolute left-0 top-0 w-px bg-gradient-to-b from-accent via-purple-400 to-accent/60"
        style={{ height: barHeight }}
      />

      {/* Glowing travel dot riding the tip */}
      <motion.span
        className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-accent"
        style={{
          top: tipTop,
          translateY: "-50%",
          boxShadow: "0 0 8px 4px rgba(91,91,214,0.55)",
        }}
      />

      {/* Milestone dots */}
      {DOT_POSITIONS.map((pos) => (
        <MilestoneDot key={pos} pos={pos} progress={progress} />
      ))}
    </div>
  );
}
