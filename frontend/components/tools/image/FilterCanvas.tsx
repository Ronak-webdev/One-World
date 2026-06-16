"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize, MousePointer2 } from "lucide-react";

export type FilterSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  tint: number;
  vibrance: number;
  sharpness: number;
  blur: number;
  vignette: number;
  grain: number;
  sepia: number;
  hue: number;
  bloom: number;
  clarity: number;
};

interface FilterCanvasProps {
  image: string;
  settings: FilterSettings;
  compareMode: boolean;
  onExport?: (canvas: HTMLCanvasElement) => void;
}

export function FilterCanvas({ image, settings, compareMode }: FilterCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Comparison slider value (0-100)
  const sliderX = useMotionValue(50);
  const springX = useSpring(sliderX, { stiffness: 300, damping: 30 });
  const clipPathTransform = useTransform(springX, (v) => `inset(0 0 0 ${v}%)`);
  const sliderLeftTransform = useTransform(springX, (v) => `${v}%`);
  
  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      setImgObj(img);
      setIsLoaded(true);
      // Auto-fit image
      if (containerRef.current) {
        const container = containerRef.current;
        const scale = Math.min(
          (container.clientWidth - 40) / img.width,
          (container.clientHeight - 40) / img.height
        );
        setZoom(Math.min(1, scale));
      }
    };
  }, [image]);

  // Handle Zoom & Pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.1, Math.min(5, prev * delta)));
    } else {
      setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan((prev) => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
    
    // Update comparison slider if in compare mode and moving mouse normally
    if (compareMode && !isPanning && !e.altKey) {
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        const xPos = ((e.clientX - bounds.left) / bounds.width) * 100;
        sliderX.set(Math.max(0, Math.min(100, xPos)));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Generate CSS filter string
  // Clarity and Sharpness are simulated with contrast/brightness adjustments or SVG filters if needed
  const filterString = `
    brightness(${100 + settings.brightness + settings.exposure}%)
    contrast(${100 + settings.contrast + (settings.clarity * 0.5)}%)
    saturate(${settings.saturation + settings.vibrance * 0.5 + 100}%)
    hue-rotate(${settings.hue}deg)
    sepia(${settings.sepia}%)
    blur(${settings.blur / 10}px)
  `.replace(/\s+/g, " ");

  // Temperature & Tint Overlays
  const tempColor = settings.temperature > 0 ? `rgba(255, 150, 0, ${settings.temperature / 500})` : `rgba(0, 150, 255, ${Math.abs(settings.temperature) / 500})`;
  const tintColor = settings.tint > 0 ? `rgba(255, 0, 255, ${settings.tint / 1000})` : `rgba(0, 255, 0, ${Math.abs(settings.tint) / 1000})`;

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    if (imgObj && containerRef.current) {
      const scale = Math.min(
        (containerRef.current.clientWidth - 40) / imgObj.width,
        (containerRef.current.clientHeight - 40) / imgObj.height
      );
      setZoom(Math.min(1, scale));
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex h-full w-full flex-1 min-h-0 select-none items-center justify-center overflow-hidden bg-[#0a0a0a]"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            key="loader"
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              <p className="text-sm font-bold uppercase tracking-widest text-white/40">Initializing Engine...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="relative transition-transform duration-75"
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          cursor: isPanning ? "grabbing" : "crosshair"
        }}
      >
        {imgObj && (
          <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            {/* Base Image (Original for Comparison) */}
            <img 
              src={image} 
              alt="Original" 
              className="block"
              style={{ width: imgObj.width, height: imgObj.height }}
            />

            {/* Filtered Layer */}
            <motion.div 
              className="absolute inset-0 z-10 overflow-hidden"
              style={{ 
                clipPath: compareMode ? clipPathTransform : "none"
              }}
            >
              <div className="relative h-full w-full">
                {/* SVG Filter for Highlights/Shadows */}
                <svg width="0" height="0" className="absolute">
                  <filter id="tone-mapping">
                    <feComponentTransfer>
                      {/* Shadows adjustment: use offset */}
                      {/* Highlights adjustment: use gamma */}
                      <feFuncR type="gamma" exponent={1 - settings.highlights / 300} offset={settings.shadows / 500} />
                      <feFuncG type="gamma" exponent={1 - settings.highlights / 300} offset={settings.shadows / 500} />
                      <feFuncB type="gamma" exponent={1 - settings.highlights / 300} offset={settings.shadows / 500} />
                    </feComponentTransfer>
                  </filter>
                </svg>

                <img 
                  src={image} 
                  alt="Filtered" 
                  style={{ 
                    width: imgObj.width, 
                    height: imgObj.height,
                    filter: `${filterString} url(#tone-mapping)`
                  }}
                />
                
                {/* Bloom Simulation */}
                {settings.bloom > 0 && (
                  <img 
                    src={image} 
                    alt="Bloom" 
                    className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50"
                    style={{ 
                      width: imgObj.width, 
                      height: imgObj.height,
                      filter: `blur(${settings.bloom / 5}px) brightness(1.5) contrast(1.2)`,
                      opacity: settings.bloom / 200
                    }}
                  />
                )}

                {/* Temp/Tint Overlays */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: tempColor, mixBlendMode: "soft-light" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: tintColor, mixBlendMode: "soft-light" }} />
                
                {/* Vignette */}
                {settings.vignette > 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none" 
                    style={{ 
                      background: `radial-gradient(circle, transparent ${100 - settings.vignette}%, rgba(0,0,0,${settings.vignette/100}) 150%)`
                    }} 
                  />
                )}

                {/* Grain (Noise Overlay) */}
                {settings.grain > 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.03] contrast-[150%] brightness-[100%]"
                    style={{ 
                      backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')`,
                      filter: `contrast(150%) brightness(1000%)`,
                      opacity: settings.grain / 500
                    }}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Comparison Slider Line */}
      {compareMode && isLoaded && (
        <motion.div 
          className="absolute inset-y-0 z-30 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
          style={{ left: sliderLeftTransform }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-md shadow-xl">
            <div className="flex gap-0.5">
              <div className="h-2 w-0.5 rounded-full bg-white/50" />
              <div className="h-2 w-0.5 rounded-full bg-white/50" />
            </div>
          </div>
        </motion.div>
      )}

      {/* HUD / Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 p-1.5 backdrop-blur-xl shadow-2xl">
        <button 
          onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <ZoomOut size={18} />
        </button>
        <div className="px-2 text-[10px] font-bold text-white/40 tracking-tighter w-12 text-center">
          {Math.round(zoom * 100)}%
        </div>
        <button 
          onClick={() => setZoom(z => Math.min(5, z + 0.1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <ZoomIn size={18} />
        </button>
        <div className="h-4 w-[1px] bg-white/10 mx-1" />
        <button 
          onClick={resetView}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all"
          title="Fit to Screen"
        >
          <Maximize size={18} />
        </button>
        <div className="h-4 w-[1px] bg-white/10 mx-1" />
        <div className="flex items-center gap-1 px-2">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Alt + Drag to Pan</span>
        </div>
      </div>

      {/* Badges */}
      {compareMode && (
        <>
          <div className="absolute left-6 top-6 z-40 rounded-full bg-black/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 backdrop-blur-md">
            Original
          </div>
          <div className="absolute right-6 top-6 z-40 rounded-full bg-accent/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            Preview
          </div>
        </>
      )}
    </div>
  );
}
