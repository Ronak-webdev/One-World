"use client";

import Link from "next/link";
import { AudioLines, Beaker, FileType, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

import { fadeRise, stagger } from "@/lib/animations";

const capabilities = [
  { icon: AudioLines, label: "Audio", title: "Separate, Transcribe, Enhance", description: "Four production-grade models running locally. No quality compromise.", href: "/audio" },
  { icon: ImageIcon, label: "Image", title: "Remove, Upscale, Transform", description: "Real-ESRGAN, rembg, and OpenCV. Batch or single.", href: "/image" },
  { icon: FileType, label: "Convert", title: "Any Format. Any Direction.", description: "PDF, Word, PPT, images, and media conversion without cloud upload.", href: "/convert" },
  { icon: Beaker, label: "Lab", title: "Experimental AI Tools", description: "Video generation, 3D modeling, and early local AI experiments.", href: "/lab" }
];

export function CapabilitiesSection() {
  return (
    <section className="section-pad bg-white">
      <motion.div className="mx-auto max-w-content px-5" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-120px" }}>
        <motion.p variants={fadeRise} className="text-xs font-semibold uppercase text-accent">Capabilities</motion.p>
        <motion.h2 variants={fadeRise} className="mt-4 max-w-2xl text-4xl font-bold leading-tight md:text-5xl">One interface across every creative operation.</motion.h2>
        <motion.div variants={stagger} className="mt-14 grid overflow-hidden rounded-2xl border border-black/10 md:grid-cols-2">
          {capabilities.map((item, index) => (
            <motion.div variants={fadeRise} className="group relative min-h-[260px] border-black/10 p-8 even:border-t md:border-r md:even:border-r-0 md:[&:nth-child(n+3)]:border-t" key={item.label}>
              <span className="absolute right-6 top-3 text-7xl font-extrabold text-black/[0.04]">{String(index + 1).padStart(2, "0")}</span>
              <item.icon className="text-accent" size={26} />
              <p className="mt-10 text-[11px] font-semibold uppercase text-text-tertiary">{item.label}</p>
              <h3 className="mt-3 text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 max-w-md text-[15px] leading-6 text-text-secondary">{item.description}</p>
              <Link className="mt-6 inline-block text-sm font-medium text-obsidian opacity-0 transition group-hover:opacity-100" href={item.href}>
                Explore {item.label} →
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

