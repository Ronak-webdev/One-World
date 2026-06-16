"use client";

import Link from "next/link";
import { Github, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)] px-5 py-32 text-center transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-[800px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 mb-6">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Get started today</span>
          </div>
          
          <h2 className="text-4xl font-extrabold leading-[1.1] text-[var(--text-1)] md:text-6xl">
            One tool for everything. <br />
            <span className="text-accent">Zero Friction.</span>
          </h2>
          
          <p className="mx-auto mt-6 max-w-[540px] text-lg leading-8 text-[var(--text-2)]">
            Download, run, and create instantly. No accounts, no cloud dependency, and total privacy by design.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/audio">
              <Button 
                size="lg" 
                variant="primary" 
                className="group h-[56px] px-8 shadow-xl shadow-accent/10 hover:shadow-accent/20"
              >
                Download One World
                <ArrowRight size={18} className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link 
              className="inline-flex h-[56px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-8 text-sm font-medium text-[var(--text-1)] transition-all hover:bg-[var(--surface-2)] hover:border-[var(--text-3)]" 
              href="https://github.com"
              target="_blank"
            >
              <Github size={18} />
              View on GitHub
            </Link>
          </div>
          
          <p className="mt-8 text-xs text-[var(--text-3)] font-mono">
            v1.2.0 · Local-first · MIT Licensed
          </p>
        </motion.div>
      </div>
    </section>
  );
}
