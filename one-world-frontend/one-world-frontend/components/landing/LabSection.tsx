"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/Badge";

const WireframeSphere = dynamic(() => import("@/components/three/WireframeSphere").then((mod) => mod.WireframeSphere), { ssr: false });

const tools = [
  { name: "Video Generation", status: "IN DEV", description: "Text/image to video via local diffusion models.", icon: "🎬" },
  { name: "3D Model Generation", status: "IN DEV", description: "Text to .obj or .glb via future local generators.", icon: "🧊", hasSphere: true },
  { name: "AI Avatar", status: "PLANNED", description: "Animated avatars from reference images.", icon: "🧑‍🎨" },
  { name: "Style Transfer", status: "LIVE", description: "Neural-style visual treatment through local processing.", icon: "🎨" },
  { name: "Document AI", status: "PLANNED", description: "Q&A and summarization on uploaded documents.", icon: "📋" }
];

const badgeTone = { "LIVE": "green", "IN DEV": "amber", "PLANNED": "dark" } as const;

export function LabSection() {
  return (
    <section className="section-pad bg-[var(--section-alt-bg)] text-[var(--section-alt-fg)] relative overflow-hidden transition-colors duration-500">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-accent/6 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-content px-5">
        <p className="text-xs font-semibold uppercase text-accent tracking-widest">04 — Lab</p>
        <h2 className="mt-5 max-w-2xl text-5xl font-extrabold leading-tight text-[var(--section-alt-fg)]">
          Experimental.<br />Use at your own excitement.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-7 text-[var(--section-alt-fg-2)]">
          Video generation, 3D model synthesis, and more coming locally. These features are in active development.
        </p>

        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          {tools.map(({ name, status, description, icon, hasSphere }, index) => (
            <motion.article
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.07, duration: 0.4, ease: [0, 0, 0.2, 1] }}
              className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-accent/30 hover:shadow-lg transition-all duration-300 card-lift cursor-default p-5"
              style={{ opacity: status === "PLANNED" ? 0.65 : status === "IN DEV" ? 0.88 : 1 }}
            >
              {/* Status indicator dot */}
              <div className={`absolute top-3 right-3 h-1.5 w-1.5 rounded-full ${
                status === "LIVE" ? "bg-[#34C759] animate-pulse" :
                status === "IN DEV" ? "bg-[#FF9500]" :
                "bg-[var(--text-3)] opacity-40"
              }`} />

              <span className="text-2xl mb-3 block">{icon}</span>
              <Badge tone={badgeTone[status]}>{status}</Badge>
              <h3 className="mt-4 text-base font-semibold text-[var(--section-alt-fg)]">{name}</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--section-alt-fg-2)]">{description}</p>
              {hasSphere ? <WireframeSphere /> : null}
            </motion.article>
          ))}
        </div>

        {/* Coming soon banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-8 rounded-2xl border border-accent/20 bg-accent/[0.06] p-5 flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--section-alt-fg)]">More experiments shipping soon</p>
            <p className="text-xs text-[var(--section-alt-fg-2)] mt-1">We push updates weekly. Star the repo to stay notified.</p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-white transition-colors duration-200 shrink-0"
          >
            View Roadmap →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
