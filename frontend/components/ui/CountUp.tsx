"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, margin: "-80px" });
  const numeric = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  const [display, setDisplay] = useState(value.match(/\d/) ? "0" : value);

  useEffect(() => {
    if (!visible || Number.isNaN(numeric)) return;
    let frame = 0;
    const frames = 72;
    const prefix = value.startsWith("<") ? "< " : "";
    const suffix = value.replace(/[<\s\d.]/g, "");
    const tick = () => {
      frame += 1;
      const eased = 1 - Math.pow(1 - frame / frames, 4);
      const current = numeric * eased;
      setDisplay(`${prefix}${Number.isInteger(numeric) ? Math.round(current) : current.toFixed(1)}${suffix}`);
      if (frame < frames) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [numeric, value, visible]);

  return <span ref={ref}>{display}</span>;
}

