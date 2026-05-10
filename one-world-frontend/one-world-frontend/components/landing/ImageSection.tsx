"use client";

import { motion } from "framer-motion";

import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { Badge } from "@/components/ui/Badge";

const imageTools = [
  ["Background Remover", "rembg u2net", "live"],
  ["Image Upscaler", "Real-ESRGAN x4", "live"],
  ["Image Enhancer", "Pillow sharpening", "live"],
  ["Filter Studio", "OpenCV presets", "live"],
  ["Format Converter", "Pillow", "live"],
  ["Object Remover", "OpenCV inpaint", "live"],
  ["Colorizer", "Future", "planned"],
  ["Cartoon-ifier", "Pure CV", "live"],
  ["Face Restoration", "Future", "planned"],
  ["Batch Processor", "BackgroundTasks", "live"]
];

export function ImageSection() {
  return (
    <section className="section-pad bg-[var(--surface)] transition-colors duration-300">
      <div className="mx-auto grid max-w-content gap-12 px-5 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Before/After + Tools Grid */}
        <div>
          <BeforeAfter />
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {imageTools.map(([name, method, status], index) => (
              <motion.div
                className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-accent/25 hover:bg-accent/[0.03] transition-all duration-200 card-lift cursor-default"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 5) * 0.05, duration: 0.35, ease: [0, 0, 0.2, 1] }}
                key={name}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-1)]">{name}</h3>
                    <p className="mt-1 text-xs text-[var(--text-2)] font-mono">{method}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    status === "live"
                      ? "bg-[#34C759]/10 text-[#34C759]"
                      : "bg-[var(--surface-2)] text-[var(--text-3)]"
                  }`}>
                    {status === "live" ? "Live" : "Soon"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Sticky sidebar */}
        <aside className="top-28 self-start lg:sticky">
          <Badge tone="muted">02 — Image</Badge>
          <h2 className="mt-5 text-4xl font-bold leading-tight text-[var(--text-1)] md:text-5xl">
            Transform images without leaving your machine.
          </h2>
          <p className="mt-5 text-base leading-7 text-[var(--text-2)]">
            rembg, Real-ESRGAN, and OpenCV pipelines stay local, fast, and inspectable.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {[
              ["⚡", "GPU-accelerated upscaling up to 4x"],
              ["🔒", "Zero cloud upload — fully private"],
              ["📦", "Batch process entire folders"],
              ["🎨", "Non-destructive editing workflow"]
            ].map(([icon, text]) => (
              <div key={text} className="flex items-start gap-3 text-sm text-[var(--text-2)]">
                <span className="shrink-0 text-base">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Spec card */}
          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
            <p className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-3">Engine specs</p>
            {[
              ["Model", "Real-ESRGAN x4plus"],
              ["Backend", "ONNX Runtime"],
              ["Input", "JPG, PNG, WEBP"],
              ["Output", "Up to 4x original"]
            ].map(([key, val]) => (
              <div key={key} className="flex justify-between text-sm py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-[var(--text-3)]">{key}</span>
                <span className="text-[var(--text-1)] font-medium">{val}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
