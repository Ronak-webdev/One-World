import dynamic from "next/dynamic";

import { Badge } from "@/components/ui/Badge";

const VideoVisual = dynamic(() => import("@/components/three/LabVisuals").then((mod) => mod.VideoVisual), { ssr: false });
const Model3DVisual = dynamic(() => import("@/components/three/LabVisuals").then((mod) => mod.Model3DVisual), { ssr: false });
const AvatarVisual = dynamic(() => import("@/components/three/LabVisuals").then((mod) => mod.AvatarVisual), { ssr: false });
const StyleVisual = dynamic(() => import("@/components/three/LabVisuals").then((mod) => mod.StyleVisual), { ssr: false });
const DocumentVisual = dynamic(() => import("@/components/three/LabVisuals").then((mod) => mod.DocumentVisual), { ssr: false });

const tools = [
  { name: "Video Generation", status: "IN DEV", desc: "Text/image to video via local diffusion models.", Visual: VideoVisual },
  { name: "3D Model Generation", status: "IN DEV", desc: "Text to .obj or .glb via future local generators.", Visual: Model3DVisual },
  { name: "AI Avatar", status: "PLANNED", desc: "Animated avatars from reference images.", Visual: AvatarVisual },
  { name: "Style Transfer", status: "LIVE", desc: "Neural-style visual treatment through local processing.", Visual: StyleVisual },
  { name: "Document AI", status: "PLANNED", desc: "Q&A and summarization on uploaded documents.", Visual: DocumentVisual }
];

export function LabSection() {
  return (
    <section className="section-pad bg-[var(--background)] text-[var(--text-1)] transition-colors duration-500">
      <div className="mx-auto max-w-content px-5">
        <p className="text-xs font-semibold uppercase text-accent">04 — Lab</p>
        <h2 className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight text-[var(--text-1)] md:text-5xl">Experimental. Use at your own excitement.</h2>
        <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-2)]">Video generation, 3D model synthesis, and more coming locally. These features are in active development.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {tools.map(({ name, status, desc, Visual }) => (
            <article 
              className="flex min-h-[460px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:-translate-y-1 hover:shadow-xl" 
              key={name} 
              style={{ opacity: status === "PLANNED" ? 0.62 : status === "IN DEV" ? 0.9 : 1 }}
            >
              <div className="flex-none">
                <Badge tone={status === "LIVE" ? "green" : status === "IN DEV" ? "amber" : "dark"}>{status}</Badge>
                <h3 className="mt-5 text-lg font-semibold text-[var(--text-1)]">{name}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">{desc}</p>
              </div>
              
              {/* Unique 3D Visual - Now fills the remaining space */}
              <div className="mt-6 flex-1 overflow-hidden rounded-xl bg-black/5">
                <Visual />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

