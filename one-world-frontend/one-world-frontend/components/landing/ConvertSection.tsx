"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { FormatNode } from "@/components/ui/FormatNode";
import { TabBar } from "@/components/ui/TabBar";

const categories: Record<string, { label: string; popular?: boolean }[]> = {
  Document: [
    { label: "PDF → Word", popular: true },
    { label: "Word → PDF", popular: true },
    { label: "PDF → PPT" },
    { label: "PPT → PDF" },
    { label: "PDF → TXT" },
    { label: "Markdown → PDF" }
  ],
  Image: [
    { label: "PNG ↔ JPG", popular: true },
    { label: "WEBP ↔ PNG", popular: true },
    { label: "AVIF → JPG" },
    { label: "SVG → PNG" },
    { label: "ICO Generator" },
    { label: "Bulk converter" }
  ],
  Media: [
    { label: "MP4 → MP3", popular: true },
    { label: "WAV → MP3", popular: true },
    { label: "AVI → MP4" },
    { label: "MOV → MP4" },
    { label: "MP4 → GIF" },
    { label: "MKV → MP4" }
  ]
};

export function ConvertSection() {
  const [active, setActive] = useState("Document");

  return (
    <section className="section-pad bg-[var(--surface-2)] transition-colors duration-300">
      <div className="mx-auto max-w-content px-5">
        <p className="text-xs font-semibold uppercase text-accent tracking-widest">03 — Convert</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-4xl font-bold leading-tight text-[var(--text-1)] md:text-5xl">
              Any format.<br />Any direction.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--text-2)]">
              PDF, Word, PPT, spreadsheets, images, and media converted locally using native libraries and CLI engines.
            </p>
          </div>
          <div className="space-y-3">
            <FormatNode source="PDF" engine="LibreOffice / pdf2docx" target="DOCX" />
            <FormatNode source="PNG" engine="Pillow" target="WEBP" />
            <FormatNode source="MP4" engine="FFmpeg" target="MP3" />
          </div>
        </div>

        {/* Interactive converter card */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)]">
          <div className="flex items-center justify-between mb-5">
            <TabBar tabs={Object.keys(categories)} active={active} onChange={setActive} />
            <span className="hidden sm:block text-xs text-[var(--text-3)] bg-[var(--surface-2)] rounded-full px-3 py-1.5 border border-[var(--border)]">
              All run locally
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {categories[active].map((item) => (
                <div
                  className={`group relative rounded-xl border bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text-1)] hover:border-accent/30 hover:bg-accent/[0.04] hover:text-accent transition-all duration-200 cursor-pointer ${
                    item.popular ? "border-accent/20" : "border-[var(--border)]"
                  }`}
                  key={item.label}
                >
                  {item.popular && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-accent text-white rounded-full px-1.5 py-0.5 uppercase tracking-wide">
                      Popular
                    </span>
                  )}
                  {item.label}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Drop zone preview */}
          <div className="mt-6 h-44 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-5 hover:border-accent/40 hover:bg-accent/[0.02] transition-all duration-300 group cursor-default">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[var(--surface-3)] flex items-center justify-center border border-[var(--border)]">
                  <span className="text-sm">📄</span>
                </div>
                <span className="text-sm font-medium text-[var(--text-2)]">Drop your file here to convert</span>
              </div>
              <div>
                <div className="h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden mb-2">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "66%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 1.2, ease: [0, 0, 0.2, 1] }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[var(--text-3)]">converted-file.pdf · 2.4 MB</span>
                  <span className="text-xs text-accent font-medium">Converting...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
