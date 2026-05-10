"use client";

import { motion } from "framer-motion";

export function ProgressLine({ progress }: { progress: number }) {
  const dots = [0.12, 0.38, 0.64, 0.9];

  return (
    <div className="relative h-44 w-px bg-[var(--border)]">
      {/* Animated fill */}
      <motion.div
        className="absolute left-0 top-0 w-px bg-gradient-to-b from-accent to-accent/30"
        style={{ height: `${Math.round(progress * 100)}%` }}
        transition={{ duration: 0.1 }}
      />
      {/* Glow at tip */}
      <motion.div
        className="absolute -left-0.5 w-1.5 rounded-full bg-accent shadow-glow-sm"
        style={{ top: `${Math.round(progress * 100)}%`, height: "4px" }}
        transition={{ duration: 0.1 }}
      />
      {/* Dot markers */}
      {dots.map((top) => (
        <span
          key={top}
          className={`absolute -left-1.5 h-3 w-3 rounded-full border transition-all duration-300 ${
            progress >= top
              ? "border-accent/60 bg-accent/20 shadow-glow-sm"
              : "border-[var(--border)] bg-[var(--surface-2)]"
          }`}
          style={{ top: `${top * 100}%` }}
        />
      ))}
    </div>
  );
}
