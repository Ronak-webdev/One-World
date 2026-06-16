"use client";

import { motion } from "framer-motion";

type SplitTextProps = {
  text: string;
  className?: string;
};

export function SplitText({ text, className }: SplitTextProps) {
  return (
    <span className={className}>
      {text.split(" ").map((word, index) => (
        <motion.span
          className="inline-block"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.35, ease: [0, 0, 0.2, 1] }}
          key={`${word}-${index}`}
        >
          {word}
          {index < text.split(" ").length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

