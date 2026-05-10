"use client";

import { useState } from "react";

export function BeforeAfter() {
  const [value, setValue] = useState(50);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] shadow-[var(--card-shadow)]">
      {/* Before layer */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#d0d0d8,#e8e8ef_45%,#b8bcc8)]" />

      {/* After layer (with clip) */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(91,91,214,0.4),rgba(109,109,224,0.2)_50%,transparent_70%)]"
        style={{ clipPath: `inset(0 0 0 ${value}%)` }}
      />

      {/* Labels */}
      <div className="absolute left-4 top-4 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold uppercase text-white/70 border border-white/10">Before</div>
      <div
        className="absolute right-4 top-4 rounded-full bg-accent/80 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold uppercase text-white border border-accent/30"
        style={{ clipPath: `inset(0 0 0 ${Math.max(0, value - 60)}%)` }}
      >
        After
      </div>

      {/* Divider */}
      <div className="absolute bottom-0 top-0 flex flex-col items-center" style={{ left: `${value}%` }}>
        <div className="absolute inset-0 w-0.5 bg-white/80 backdrop-blur-sm shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 7H10M4 7L6 5M4 7L6 9M10 7L8 5M10 7L8 9" stroke="#5B5BD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Range input */}
      <input
        aria-label="Compare before and after image"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        max={100}
        min={0}
        type="range"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </div>
  );
}
