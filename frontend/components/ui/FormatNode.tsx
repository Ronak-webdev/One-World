import { ArrowRight } from "lucide-react";

export function FormatNode({ source, engine, target }: { source: string; engine: string; target: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border border-black/10 bg-white p-4 sm:p-5 text-sm shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-surface-secondary px-4 py-2.5 font-mono font-bold text-obsidian shrink-0">{source}</span>
        <ArrowRight className="text-accent shrink-0 sm:hidden" size={16} />
      </div>
      <ArrowRight className="text-accent shrink-0 hidden sm:block" size={18} />
      <span className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-2.5 text-accent font-medium truncate">
        {engine}
      </span>
      <ArrowRight className="text-accent shrink-0" size={18} />
      <span className="rounded-xl bg-obsidian px-4 py-2.5 font-mono font-bold text-white shrink-0">{target}</span>
    </div>
  );
}

