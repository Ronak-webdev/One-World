"use client";

import React, { useState, useEffect } from 'react';

/**
 * Premium Hardware-inspired Processing Loader
 * Features a blinking "Thinking..." state inside the processing unit.
 */
export function Loader() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full flex-col items-center justify-center py-10">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes traceFlow {
          to { stroke-dashoffset: 0; }
        }
        .animate-trace {
          animation: traceFlow 3s cubic-bezier(0.5, 0, 0.9, 1) infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-blink {
          animation: blink 1.5s ease-in-out infinite;
        }
      `}} />
      
      <div className="relative w-full max-w-[600px]">
        <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
          <defs>
            <linearGradient id="chipGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>

          {/* Background Traces */}
          <g className="opacity-20">
            {[
              "M100 100 H200 V210 H326", "M80 180 H180 V230 H326",
              "M60 260 H150 V250 H326", "M100 350 H200 V270 H326",
              "M700 90 H560 V210 H474", "M740 160 H580 V230 H474",
              "M720 250 H590 V250 H474", "M680 340 H570 V270 H474"
            ].map((d, i) => (
              <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--border)]" />
            ))}
          </g>

          {/* Animated Flow Traces */}
          <g>
            {[
              { d: "M100 100 H200 V210 H326", color: "#9900ff" },
              { d: "M80 180 H180 V230 H326", color: "#00ccff" },
              { d: "M60 260 H150 V250 H326", color: "#ffea00" },
              { d: "M100 350 H200 V270 H326", color: "#00ff15" },
              { d: "M700 90 H560 V210 H474", color: "#00ccff" },
              { d: "M740 160 H580 V230 H474", color: "#00ff15" },
              { d: "M720 250 H590 V250 H474", color: "#ff3300" },
              { d: "M680 340 H570 V270 H474", color: "#ffea00" }
            ].map((item, i) => (
              <path 
                key={i} 
                d={item.d} 
                fill="none" 
                stroke={item.color} 
                strokeWidth="2" 
                strokeDasharray="40 400" 
                strokeDashoffset="438"
                style={{ filter: `drop-shadow(0 0 6px ${item.color})` }}
                className="animate-trace" 
              />
            ))}
          </g>
          
          {/* Main Processing Unit - Now a Black Box */}
          <rect x={330} y={190} width={140} height={100} rx={16} ry={16} fill="url(#chipGradient)" stroke="#333" strokeWidth="2" />
          
          {/* Pins */}
          <g opacity="0.4">
            {[205, 225, 245, 265].map(y => (
              <React.Fragment key={y}>
                <rect x={322} y={y} width={8} height={10} rx={2} fill="#888" />
                <rect x={470} y={y} width={8} height={10} rx={2} fill="#888" />
              </React.Fragment>
            ))}
          </g>

          {/* Center Text: Thinking... */}
          <text x={400} y={245} fontSize={16} fontWeight="800" letterSpacing="1" textAnchor="middle" alignmentBaseline="middle" fill="#fff" style={{ fontFamily: 'system-ui' }}>
            Thinking{dots}
          </text>

          {/* Node Points */}
          <g opacity="0.3">
            {[ [100, 100], [80, 180], [60, 260], [100, 350], [700, 90], [740, 160], [720, 250], [680, 340] ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={4} fill="var(--text-3)" />
            ))}
          </g>
        </svg>
      </div>
      
      <p className="mt-6 text-sm font-semibold tracking-widest text-[var(--text-2)] animate-pulse">
        AI INFERENCE IN PROGRESS
      </p>
    </div>
  );
}
