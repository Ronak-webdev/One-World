"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { FormatNode } from "@/components/ui/FormatNode";
import { TabBar } from "@/components/ui/TabBar";

const categories: Record<string, string[]> = {
  Document: ["PDF → Word", "Word → PDF", "PDF → PPT", "PPT → PDF", "PDF → TXT", "Markdown → PDF"],
  Image: ["PNG ↔ JPG", "WEBP ↔ PNG", "AVIF → JPG", "SVG → PNG", "ICO Generator", "Bulk converter"],
  Media: ["MP4 → MP3", "WAV → MP3", "AVI → MP4", "MOV → MP4", "MP4 → GIF", "MKV → MP4"]
};

export function ConvertSection() {
  const [active, setActive] = useState("Document");

  return (
    <section className="section-pad bg-surface-secondary">
      <div className="mx-auto max-w-content px-5">
        <p className="text-xs font-semibold uppercase text-accent">03 — Convert</p>
        <div className="mt-4 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">Any format. Any direction.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-text-secondary">
              PDF, Word, PPT, spreadsheets, images, and media converted locally using native libraries and CLI engines.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <FormatNode source="PDF" engine="LibreOffice / pdf2docx" target="DOCX" />
            <FormatNode source="PNG" engine="Pillow" target="WEBP" />
            <FormatNode source="MP4" engine="FFmpeg" target="MP3" />
          </div>
        </div>
        
        <div className="mt-12 rounded-2xl border border-black/10 bg-white p-6 md:p-10 shadow-sm">
          <TabBar tabs={Object.keys(categories)} active={active} onChange={setActive} />
          
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories[active].map((item) => (
              <div 
                className="rounded-xl border border-black/10 bg-surface-secondary px-5 py-4 text-sm font-semibold transition-all hover:border-accent/20 hover:bg-accent/5" 
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
          
          <div className="mt-10 rounded-2xl border border-dashed border-black/20 bg-surface-secondary/50 p-8">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Drop zone preview</span>
                <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded">PROCESSED</span>
              </div>
              <div className="space-y-3">
                <div className="h-3 rounded-full bg-black/5 overflow-hidden">
                  <motion.div 
                    className="h-full bg-accent"
                    initial={{ width: 0 }}
                    whileInView={{ width: "70%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-black/60">converted-file.pdf</span>
                  <span className="text-xs text-text-tertiary">2.4 MB · 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

