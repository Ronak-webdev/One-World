"use client";

import { useEffect, useRef } from "react";

import { getGsap } from "@/lib/gsap";

const panels = [
  ["CHOOSE", "Choose your toolkit", "Audio, Image, Convert, or Lab, each optimized for its domain."],
  ["UPLOAD", "Drop your file", "Drag, drop, or paste. Max file size: 2GB."],
  ["PROCESS", "Your machine does the work", "All AI inference runs locally. Your GPU, your data, your control."],
  ["DOWNLOAD", "Done. In seconds.", "Download your result with no watermarks or cloud compression."]
];

export function WorkflowSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const { gsap, ScrollTrigger } = getGsap();
    const ctx = gsap.context(() => {
      gsap.to(track, {
        xPercent: -75,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          end: "+=3000"
        }
      });
    }, section);
    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section ref={sectionRef} id="workflow" className="overflow-hidden bg-white">
      <div ref={trackRef} className="flex w-[400vw]">
        {panels.map(([label, title, body], index) => (
          <article className="flex h-screen w-screen items-center px-5" key={label}>
            <div className="mx-auto grid max-w-content items-center gap-10 lg:grid-cols-2">
              <div className="relative">
                <span className="absolute -top-24 left-0 text-[160px] font-extrabold leading-none text-black/[0.04] md:text-[220px]">{String(index + 1).padStart(2, "0")}</span>
                <p className="relative text-xs font-semibold uppercase text-accent">{label}</p>
                <h2 className="relative mt-4 text-4xl font-bold md:text-5xl">{title}</h2>
                <p className="relative mt-5 max-w-md text-base leading-7 text-text-secondary">{body}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-surface-secondary p-6">
                {index === 2 ? (
                  <div className="rounded-xl bg-obsidian p-5 font-mono text-sm text-text-dark">
                    {["[✓] File received", "[✓] Model loaded from cache", "[→] Running inference...", "[✓] Output ready"].map((line) => (
                      <p className="py-2" key={line}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {[64, 86, 42, 72].map((width) => (
                      <div className="h-12 rounded-xl bg-white" key={width}>
                        <div className="h-full rounded-xl bg-accent/20" style={{ width: `${width}%` }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

