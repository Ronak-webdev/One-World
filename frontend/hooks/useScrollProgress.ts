"use client";

import { RefObject, useEffect, useState } from "react";

export function useScrollProgress(ref: RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const elementTop = rect.top + scrollY;
      const elementHeight = node.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate start and end positions
      const start = elementTop;
      const end = elementTop + elementHeight - viewportHeight;

      if (elementHeight <= viewportHeight) {
        // For short sections, progress is based on the element entering and leaving the viewport
        const triggerPoint = elementTop - viewportHeight / 2;
        const progressValue = (scrollY - triggerPoint) / (viewportHeight / 2);
        setProgress(Math.min(1, Math.max(0, progressValue)));
      } else {
        // For tall sections, standard scroll-through progress
        if (scrollY < start) {
          setProgress(0);
        } else if (scrollY > end && end > 0) {
          setProgress(1);
        } else {
          const range = end - start;
          setProgress(range <= 0 ? 0 : Math.min(1, Math.max(0, (scrollY - start) / range)));
        }
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", update, { passive: true });
          window.addEventListener("resize", update);
          update();
        } else {
          window.removeEventListener("scroll", update);
          window.removeEventListener("resize", update);
        }
      },
      { threshold: [0] }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);

  return progress;
}
