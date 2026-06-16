"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function BeforeAfter({ beforeImage, afterImage }: { beforeImage: string; afterImage: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  
  // Use framer-motion values for smooth interpolation
  const x = useMotionValue(50);
  const springX = useSpring(x, { stiffness: 200, damping: 25 });
  const beforeClipPath = useTransform(springX, (val) => `inset(0 ${100 - val}% 0 0)`);
  const afterClipPath = useTransform(springX, (val) => `inset(0 0 0 ${val}%)`);

  useEffect(() => {
    // Fallback: If images don't report load (e.g. cached or broken), show anyway after 2s
    const timer = setTimeout(() => {
      if (loadedCount < 2) setIsLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [loadedCount]);

  useEffect(() => {
    if (loadedCount >= 2) {
      setIsLoaded(true);
    }
  }, [loadedCount]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    let newX = ((clientX - bounds.left) / bounds.width) * 100;
    newX = Math.max(0, Math.min(100, newX));
    x.set(newX);
  };

  const handleImageLoad = () => {
    setLoadedCount(prev => prev + 1);
  };

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className="group relative flex h-full w-full cursor-ew-resize items-center justify-center overflow-hidden rounded-2xl border border-black/10 transition-all duration-700 hover:shadow-[0_0_50px_rgba(91,91,214,0.15)]"
      style={{ touchAction: "none" }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            <span className="text-xs font-bold text-black/40 animate-pulse uppercase tracking-widest">Loading Comparison...</span>
          </div>
        </div>
      )}

      {/* Background (Original) */}
      <motion.div 
        className="absolute inset-0 h-full w-full overflow-hidden"
        style={{ clipPath: beforeClipPath }}
      >
        <img 
          src={beforeImage} 
          alt="Before"
          onLoad={handleImageLoad}
          className="h-full w-full object-contain pointer-events-none" 
        />
      </motion.div>
      
      {/* Foreground (Processed) */}
      <motion.div 
        className="absolute inset-0 z-0 h-full w-full overflow-hidden"
        style={{ clipPath: afterClipPath }}
      >
        <img 
          src={afterImage} 
          alt="After"
          onLoad={handleImageLoad}
          className="h-full w-full object-contain pointer-events-none" 
        />
      </motion.div>

      {/* Cinematic Overlays & Badges */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.05)]" />
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isLoaded ? 1 : 0, x: 0 }}
        className="pointer-events-none absolute left-6 top-6 rounded-full bg-black/60 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl backdrop-blur-md transition-opacity group-hover:opacity-100"
      >
        Original
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, x: 0 }}
        className="pointer-events-none absolute right-6 top-6 rounded-full bg-accent px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl backdrop-blur-md transition-opacity group-hover:opacity-100"
      >
        Processed
      </motion.div>

      {/* Slider Line & Handle */}
      <motion.div 
        className="pointer-events-none absolute bottom-0 top-0 w-[2px] bg-white/80 shadow-[0_0_15px_rgba(0,0,0,0.3)] z-20" 
        style={{ left: useTransform(springX, (val) => `${val}%`) }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-accent shadow-[0_0_30px_rgba(91,91,214,0.4)] transition-transform duration-300 group-hover:scale-110">
          <div className="flex gap-1">
            <div className="h-3 w-[2px] rounded-full bg-white/80" />
            <div className="h-3 w-[2px] rounded-full bg-white/80" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}


