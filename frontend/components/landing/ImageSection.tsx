"use client";

import { motion } from "framer-motion";

import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { Badge } from "@/components/ui/Badge";

const imageTools = [
  ["Background Remover", "rembg u2net"],
  ["Image Upscaler", "Real-ESRGAN x4"],
  ["Image Enhancer", "Pillow sharpening"],
  ["Filter Studio", "OpenCV presets"],
  ["Format Converter", "Pillow"],
  ["Object Remover", "OpenCV inpaint"],
  ["Colorizer", "Future"],
  ["Cartoon-ifier", "Pure CV"],
  ["Face Restoration", "Future"],
  ["Batch Processor", "BackgroundTasks"]
];

export function ImageSection() {
  return (
    <section className="section-pad bg-[var(--background)] text-[var(--text-1)] transition-colors duration-500">
      <div className="mx-auto grid max-w-content gap-12 px-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
        <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-2xl">
          <BeforeAfter 
            beforeImage="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000&blur=50"
            afterImage="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000"
          />
        </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {imageTools.map(([name, method], index) => (
              <motion.div
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 5) * 0.04 }}
                key={name}
              >
                <h3 className="font-semibold text-[var(--text-1)]">{name}</h3>
                <p className="mt-2 text-sm text-[var(--text-2)]">{method}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <aside className="top-28 self-start lg:sticky">
          <Badge tone="muted">02 — Image</Badge>
          <h2 className="mt-5 text-4xl font-bold leading-tight text-[var(--text-1)] md:text-5xl">Transform images without leaving your machine.</h2>
          <p className="mt-5 text-base leading-7 text-[var(--text-2)]">rembg, Real-ESRGAN, and OpenCV pipelines stay local, fast, and inspectable.</p>
        </aside>
      </div>
    </section>
  );
}

