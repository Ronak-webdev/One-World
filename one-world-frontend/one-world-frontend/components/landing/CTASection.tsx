"use client";

import Link from "next/link";
import { Github, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/providers/ThemeProvider";

export function CTASection() {
  const { isDark } = useTheme();

  return (
    <section className="noise-dark relative bg-[var(--section-alt-bg)] px-5 py-32 text-center text-[var(--section-alt-fg)] overflow-hidden transition-colors duration-500">
      {/* Glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-[640px]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-xs font-semibold uppercase text-accent tracking-widest"
        >
          Get started
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="mt-4 text-5xl font-extrabold leading-tight text-[var(--section-alt-fg)]"
        >
          One tool for everything.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-5 text-lg leading-8 text-[var(--section-alt-fg-2)]"
        >
          Download, run, create. No accounts. No internet required after setup.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22, duration: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/audio">
            <Button
              size="lg"
              variant={isDark ? "light" : "primary"}
              className="group shadow-md hover:shadow-lg transition-all duration-300"
            >
              Download One World
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link
            className="inline-flex h-[52px] items-center gap-2 px-5 text-[var(--section-alt-fg-2)] transition-all duration-200 hover:text-[var(--text-1)] rounded-full hover:bg-[var(--surface-3)]"
            href="/"
          >
            <Github size={18} />
            View on GitHub
          </Link>
        </motion.div>

        {/* Small trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-10 flex items-center justify-center gap-6 flex-wrap"
        >
          {["MIT License", "No telemetry", "Self-hosted"].map((item) => (
            <span key={item} className="text-xs text-[var(--section-alt-fg-2)] flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[var(--text-3)] opacity-40" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
