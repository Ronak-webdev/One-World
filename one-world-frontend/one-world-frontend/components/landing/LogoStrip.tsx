"use client";

const logos = [
  { name: "PyTorch", emoji: "🔥" },
  { name: "ONNX Runtime", emoji: "⚡" },
  { name: "Demucs", emoji: "🎵" },
  { name: "Whisper", emoji: "🎤" },
  { name: "FastAPI", emoji: "🚀" },
  { name: "Real-ESRGAN", emoji: "🖼" },
  { name: "rembg", emoji: "✂️" },
  { name: "LibreOffice", emoji: "📄" },
  { name: "FFmpeg", emoji: "🎞" },
  { name: "Next.js", emoji: "▲" }
];

export function LogoStrip() {
  const repeated = [...logos, ...logos];
  return (
    <section className="overflow-hidden bg-[var(--surface-2)] py-12 border-y border-[var(--border)] transition-colors duration-300">
      <p className="mb-6 text-center text-xs font-semibold uppercase text-[var(--text-3)] tracking-widest">Built on open source</p>
      <div className="group flex whitespace-nowrap">
        <div className="flex animate-[ticker_28s_linear_infinite] gap-10 group-hover:[animation-play-state:paused] items-center">
          {repeated.map((logo, index) => (
            <span
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-2)] transition-all duration-200 hover:text-[var(--text-1)] hover:scale-105 cursor-default"
              key={`${logo.name}-${index}`}
            >
              <span className="text-base">{logo.emoji}</span>
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
