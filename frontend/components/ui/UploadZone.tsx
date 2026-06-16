"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type UploadZoneProps = {
  accepted?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
};

export function UploadZone({ accepted, disabled, onFile }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex min-h-[320px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 transition-all duration-300",
        isDragging
          ? "border-accent bg-accent/10 shadow-[0_0_50px_rgba(91,91,214,0.3)]"
          : "border-black/5 bg-white/40 shadow-xl backdrop-blur-2xl hover:border-accent/50 hover:bg-white/60",
        disabled && "opacity-50 grayscale"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files.item(0);
        if (file && !disabled) onFile(file);
      }}
    >
      {/* Animated glowing orb behind the content */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <input
        ref={inputRef}
        accept={accepted}
        className="hidden"
        disabled={disabled}
        type="file"
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) onFile(file);
        }}
      />

      <div className="flex flex-col items-center justify-center p-8 text-center">
        <button
          className={cn(
            "mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-[#7c7ce0] text-white shadow-2xl transition-transform duration-300",
            !disabled && "hover:scale-110 hover:shadow-[0_0_30px_rgba(91,91,214,0.6)] active:scale-95",
            isDragging && "scale-110 animate-pulse shadow-[0_0_40px_rgba(91,91,214,0.8)]"
          )}
          disabled={disabled}
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Select file"
        >
          <Upload size={32} strokeWidth={2.5} />
        </button>
        
        <h3 className="text-xl font-extrabold tracking-tight text-black">
          {isDragging ? "Drop to process..." : "Drag & drop your file"}
        </h3>
        <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-black/50">
          or click the icon to browse local files. Processing runs entirely locally with full GPU acceleration.
        </p>
        
        {accepted && (
          <div className="mt-6 inline-flex items-center rounded-full border border-black/5 bg-black/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-black/40">
            {accepted.replace(/\*/g, ' Any')}
          </div>
        )}
      </div>
    </div>
  );
}

