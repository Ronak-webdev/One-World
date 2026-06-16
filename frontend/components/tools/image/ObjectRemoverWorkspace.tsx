"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eraser, Undo2, Redo2, ZoomIn, ZoomOut, Brush, Trash2, Maximize, MousePointer2 } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { downloadUrl, type ToolDefinition } from "@/lib/api";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import {
  ProcessingOverlay,
  ResultActionBar,
  WorkspaceLayout,
  ControlSection,
  SliderControl,
  ToggleButton,
} from "./WorkspaceShared";

export function ObjectRemoverWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [isEraseMode, setIsEraseMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPanRef = useRef({ x: 0, y: 0 });

  const { state, error, job, upload, originalFile } = useUpload(toolkit, tool.endpoint);
  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && job?.job_id;

  // Sync canvases with image when it loads or container resizes
  useEffect(() => {
    if (image && canvasRef.current && maskCanvasRef.current && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const padding = 40;
      
      // Use original high-resolution dimensions for the bitmap
      const w = image.naturalWidth;
      const h = image.naturalHeight;

      canvasRef.current.width = w;
      canvasRef.current.height = h;
      maskCanvasRef.current.width = w;
      maskCanvasRef.current.height = h;

      const ctx = canvasRef.current.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, w, h);

      // Re-initialize mask if it's empty or size changed
      const mCtx = maskCanvasRef.current.getContext("2d")!;
      if (historyIndex === -1) {
        mCtx.clearRect(0, 0, w, h);
        const initialData = mCtx.getImageData(0, 0, w, h);
        setHistory([initialData]);
        setHistoryIndex(0);

        // Auto-calculate fit scale
        const maxW = rect.width - padding;
        const maxH = rect.height - padding;
        const scale = Math.min(maxW / w, maxH / h, 1);
        setZoom(scale);
      } else {
        // Redraw current history if resizing
        mCtx.putImageData(history[historyIndex], 0, 0);
      }
    }
  }, [image]); // Only sync when image object changes

  const loadImageToCanvas = useCallback((file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setHistoryIndex(-1); // Reset history for new image
      setZoom(1);
      setPan({ x: 0, y: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!maskCanvasRef.current) return { x: 0, y: 0 };
    const rect = maskCanvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e.nativeEvent) {
      clientX = e.nativeEvent.touches[0].clientX;
      clientY = e.nativeEvent.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * (maskCanvasRef.current.width / rect.width),
      y: (clientY - rect.top) * (maskCanvasRef.current.height / rect.height),
    };
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !maskCanvasRef.current || isPanning) return;
    const mCtx = maskCanvasRef.current.getContext("2d")!;
    const { x, y } = getPos(e);
    
    mCtx.globalCompositeOperation = isEraseMode ? "destination-out" : "source-over";
    mCtx.fillStyle = "rgba(255, 60, 60, 0.6)";
    mCtx.shadowBlur = 2;
    mCtx.shadowColor = "rgba(255, 60, 60, 0.4)";
    mCtx.beginPath();
    // Adjust brush size for full-res coordinate space
    mCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    mCtx.fill();
  }, [isDrawing, brushSize, isEraseMode, isPanning]);

  const saveHistory = useCallback(() => {
    if (!maskCanvasRef.current || isPanning) return;
    const mCtx = maskCanvasRef.current.getContext("2d")!;
    const data = mCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    setHistory((h) => [...h.slice(0, historyIndex + 1), data]);
    setHistoryIndex((i) => i + 1);
  }, [historyIndex, isPanning]);

  const undo = () => {
    if (historyIndex <= 0 || !maskCanvasRef.current) return;
    const mCtx = maskCanvasRef.current.getContext("2d")!;
    mCtx.putImageData(history[historyIndex - 1], 0, 0);
    setHistoryIndex((i) => i - 1);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1 || !maskCanvasRef.current) return;
    const mCtx = maskCanvasRef.current.getContext("2d")!;
    mCtx.putImageData(history[historyIndex + 1], 0, 0);
    setHistoryIndex((i) => i + 1);
  };

  const clearMask = () => {
    if (!maskCanvasRef.current) return;
    const mCtx = maskCanvasRef.current.getContext("2d")!;
    mCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    saveHistory();
  };

  const handleProcess = async () => {
    if (!imageFile || !maskCanvasRef.current || !image) return;

    // Generate mask in ORIGINAL image resolution
    const offscreen = document.createElement("canvas");
    offscreen.width = image.naturalWidth;
    offscreen.height = image.naturalHeight;
    const oc = offscreen.getContext("2d")!;
    
    // Draw current mask to offscreen at original size
    oc.drawImage(maskCanvasRef.current, 0, 0, offscreen.width, offscreen.height);

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const maskFile = new File([blob], "mask.png", { type: "image/png" });
      upload(imageFile, { mask: maskFile });
    }, "image/png");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    } else {
      setIsDrawing(true);
      draw(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanRef.current.x;
      const dy = e.clientY - lastPanRef.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    } else {
      draw(e);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) saveHistory();
    setIsDrawing(false);
    setIsPanning(false);
  };

  const sidebar = (
    <div className="flex flex-col gap-4">
      <ControlSection title="Brush Control">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEraseMode(false)} 
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${!isEraseMode ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-white border border-black/5 text-black/40 hover:bg-black/5"}`}
            >
              <Brush size={14} /> Paint
            </button>
            <button 
              onClick={() => setIsEraseMode(true)} 
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${isEraseMode ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white border border-black/5 text-black/40 hover:bg-black/5"}`}
            >
              <Eraser size={14} /> Erase
            </button>
          </div>
          <SliderControl label="Size" value={brushSize} min={2} max={150} onChange={setBrushSize} />
        </div>
      </ControlSection>

      <ControlSection title="Canvas Actions">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className="flex items-center justify-center gap-2 rounded-xl border border-black/5 bg-white py-2 text-[10px] font-black uppercase tracking-wider text-black/60 disabled:opacity-30 hover:bg-black/5">
            <Undo2 size={12} /> Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex items-center justify-center gap-2 rounded-xl border border-black/5 bg-white py-2 text-[10px] font-black uppercase tracking-wider text-black/60 disabled:opacity-30 hover:bg-black/5">
            <Redo2 size={12} /> Redo
          </button>
          <button onClick={clearMask} className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-500/10 bg-red-500/5 py-2 text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-500/10">
            <Trash2 size={12} /> Clear Mask
          </button>
        </div>
      </ControlSection>

      <ControlSection title="View">
        <div className="flex gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))} className="flex flex-1 items-center justify-center rounded-xl bg-white border border-black/5 py-2 hover:bg-black/5"><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="flex flex-1 items-center justify-center rounded-xl bg-white border border-black/5 py-2 hover:bg-black/5"><ZoomOut size={14} /></button>
          <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="flex flex-1 items-center justify-center rounded-xl bg-white border border-black/5 py-2 hover:bg-black/5"><Maximize size={14} /></button>
        </div>
      </ControlSection>

      <button
        onClick={handleProcess}
        className="mt-2 w-full rounded-2xl bg-gradient-to-r from-accent to-indigo-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95"
      >
        Start Removal
      </button>
    </div>
  );

  return (
    <WorkspaceLayout
      title="Object Remover"
      description="Professional AI masking to erase objects, text, or people flawlessly."
      badge="LaMa AI · SOTA"
      sidebar={image ? sidebar : undefined}
    >
      <AnimatePresence>
        {!image && (state === "idle" || state === "error") && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-1 min-h-0 flex-col items-center justify-center gap-8"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-red-500/20 to-pink-500/10 shadow-2xl shadow-red-500/10">
              <Eraser size={64} strokeWidth={1} className="text-red-500" />
            </div>
            <div className="w-full max-w-xl">
              {error && (
                <div className="mb-6 rounded-2xl bg-red-500/10 p-4 text-center text-sm font-bold text-red-600 border border-red-500/20">
                  {error}
                </div>
              )}
              <label className="group flex flex-col items-center gap-6 cursor-pointer rounded-[2rem] border-2 border-dashed border-black/10 p-16 transition-all hover:border-accent/50 hover:bg-accent/[0.02]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 transition-transform group-hover:scale-110 group-hover:bg-accent/10">
                  <Brush size={32} strokeWidth={1.5} className="text-black/40 transition-colors group-hover:text-accent" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-black/80">Drop image here</p>
                  <p className="text-sm font-medium text-black/30 mt-2">Select a photo to start cleaning up</p>
                </div>
                <input type="file" accept={tool.accepted} className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadImageToCanvas(f);
                }} />
              </label>
            </div>
          </motion.div>
        )}

        {image && !isProcessing && !isDone && (
          <motion.div
            key="canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 min-h-0 flex-col gap-4"
          >
            {/* Viewport Container */}
            <div
              ref={containerRef}
              className="relative flex-1 min-h-0 overflow-hidden rounded-[2rem] border border-black/5 bg-[repeating-conic-gradient(#f0f0f0_0%_25%,white_0%_50%)] bg-[length:24px_24px] shadow-inner"
              style={{ cursor: isPanning ? "grabbing" : isEraseMode ? "cell" : "crosshair" }}
            >
              {/* Transform Layer */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ 
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center"
                }}
              >
                <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.1)] group/canvas">
                  <canvas ref={canvasRef} className="block rounded-lg pointer-events-none" />
                  <canvas
                    ref={maskCanvasRef}
                    className="absolute inset-0 rounded-lg touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={(e) => {
                      handleMouseMove(e);
                      // Move preview circle
                      const cursor = document.getElementById('brush-preview');
                      if (cursor) {
                        const pos = getPos(e);
                        cursor.style.left = `${pos.x}px`;
                        cursor.style.top = `${pos.y}px`;
                        cursor.style.display = 'block';
                      }
                    }}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                      handleMouseUp();
                      const cursor = document.getElementById('brush-preview');
                      if (cursor) cursor.style.display = 'none';
                    }}
                  />
                  
                  {/* Brush Preview Circle */}
                  <div 
                    id="brush-preview"
                    className="pointer-events-none absolute border border-white/80 bg-accent/30 rounded-full z-10 hidden"
                    style={{
                      width: brushSize,
                      height: brushSize,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 10px rgba(91, 91, 214, 0.3)'
                    }}
                  />
                </div>
              </div>

              {/* View Controls Overlay */}
              <div className="absolute bottom-6 right-6 flex items-center gap-2 rounded-2xl bg-white/80 p-2 backdrop-blur-xl shadow-xl border border-black/5">
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 hover:bg-black/5 rounded-xl transition-colors"><ZoomOut size={16} /></button>
                <span className="text-[10px] font-black w-10 text-center text-black/40">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))} className="p-2 hover:bg-black/5 rounded-xl transition-colors"><ZoomIn size={16} /></button>
                <div className="w-px h-4 bg-black/10 mx-1" />
                <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-2 hover:bg-black/5 rounded-xl transition-colors"><Maximize size={16} /></button>
              </div>

              {/* Hint Overlay */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="rounded-full bg-black/80 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/90 backdrop-blur-md shadow-2xl flex items-center gap-3"
                >
                  <div className={`h-2 w-2 rounded-full ${isEraseMode ? 'bg-red-500 animate-pulse' : 'bg-accent animate-pulse'}`} />
                  {isEraseMode ? "Erasing Mask" : "Painting Mask"} 
                  <span className="text-white/30 ml-1">•</span>
                  <span className="text-white/50">Alt+Drag to Pan</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex flex-1 min-h-0">
            {originalFile?.previewUrl && (
              <div
                className="h-full w-full rounded-[2rem] bg-contain bg-center bg-no-repeat opacity-30"
                style={{ backgroundImage: `url(${originalFile.previewUrl})` }}
              />
            )}
            <ProcessingOverlay label="Removing objects with LaMa AI..." />
          </motion.div>
        )}

        {isDone && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 min-h-0 flex-col gap-4"
          >
            <div className="flex-1 min-h-0 overflow-hidden rounded-[2rem] bg-white/50 backdrop-blur-sm shadow-inner">
              {originalFile?.previewUrl ? (
                <BeforeAfter
                  beforeImage={originalFile.previewUrl}
                  afterImage={downloadUrl(toolkit, job!.job_id, undefined, true)}
                />
              ) : (
                <img
                  src={downloadUrl(toolkit, job!.job_id, undefined, true)}
                  className="h-full w-full object-contain rounded-[2rem]"
                  alt="Result"
                />
              )}
            </div>
            <ResultActionBar toolkit={toolkit} job={job!} onReset={() => { setImage(null); setImageFile(null); setHistory([]); setHistoryIndex(-1); }} />
          </motion.div>
        )}
      </AnimatePresence>

    </WorkspaceLayout>
  );
}
