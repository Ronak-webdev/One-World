"use client";

import Lenis from "lenis";
import { getGsap } from "@/lib/gsap";

export function createLenis() {
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  const { gsap, ScrollTrigger } = getGsap();

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return () => {
    lenis.destroy();
  };
}

