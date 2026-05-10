"use client";

import Link from "next/link";
import { AudioLines, Beaker, FileType, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

import { fadeRise, stagger } from "@/lib/animations";

const capabilities = [
  { icon: AudioLines, label: "Audio", title: "Separate, Transcribe, Enhance", description: "Four production-grade models running locally. No quality compromise.", href: "/audio", color: "from-violet-500/20 to-accent/10" },
  { icon: ImageIcon, label: "Image", title: "Remove, Upscale, Transform", description: "Real-ESRGAN, rembg, and OpenCV. Batch or single.", href: "/image", color: "from-blue-500/20 to-cyan-500/10" },
  { icon: FileType, label: "Convert", title: "Any Format. Any Direction.", description: "PDF, Word, PPT, images, and media conversion without cloud upload.", href: "/convert", color: "from-emerald-500/20 to-teal-500/10" },
  { icon: Beaker, label: "Lab", title: "Experimental AI Tools", description: "Video generation, 3D modeling, and early local AI experiments.", href: "/lab", color: "from-orange-500/20 to-amber-500/10" }
];

export function CapabilitiesSection() {
  return (
    <section className="section-pad bg-[var(--surface)] transition-colors duration-300">
      <motion.div
        className="mx-auto max-w-content px-5"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.p variants={fadeRise} className="text-xs font-semibold uppercase text-accent tracking-widest">
          Capabilities
        </motion.p>
        <motion.h2
          variants={fadeRise}
          className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-[var(--text-1)] md:text-5xl"
        >
          One interface across every creative operation.
        </motion.h2>

        <motion.div
          variants={stagger}
          className="mt-14 grid overflow-hidden rounded-2xl border border-[var(--border)] md:grid-cols-2 shadow-[var(--card-shadow)]"
        >
          {capabilities.map((item, index) => (
            <motion.div
              variants={fadeRise}
              className="group relative min-h-[280px] border-[var(--border)] bg-[var(--surface)] p-8 transition-all duration-300 even:border-t md:border-r md:even:border-r-0 md:[&:nth-child(n+3)]:border-t hover:bg-[var(--surface-2)] cursor-default"
              key={item.label}
            >
              {/* Gradient accent on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-inherit pointer-events-none`} />

              {/* Number watermark */}
              <span className="absolute right-6 top-3 text-7xl font-extrabold leading-none text-[var(--text-1)] opacity-[0.04] md:text-[200px] select-none">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Icon */}
              <div className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 group-hover:bg-accent/15 group-hover:border-accent/30 transition-all duration-300">
                <item.icon className="text-accent" size={22} />
              </div>

              <p className="relative z-10 mt-8 text-[11px] font-semibold uppercase text-[var(--text-3)] tracking-widest">{item.label}</p>
              <h3 className="relative z-10 mt-3 text-2xl font-bold text-[var(--text-1)]">{item.title}</h3>
              <p className="relative z-10 mt-3 max-w-md text-[15px] leading-6 text-[var(--text-2)]">{item.description}</p>

              <Link
                className="relative z-10 mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:gap-2.5"
                href={item.href}
              >
                Explore {item.label}
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
