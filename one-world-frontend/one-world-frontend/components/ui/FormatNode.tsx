import { ArrowRight } from "lucide-react";

export function FormatNode({ source, engine, target }: { source: string; engine: string; target: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm hover:border-accent/20 hover:bg-accent/[0.02] transition-all duration-200 group">
      <span className="rounded-xl bg-[var(--surface-2)] px-4 py-2.5 font-mono font-semibold text-[var(--text-1)] shrink-0">{source}</span>
      <ArrowRight className="text-[var(--text-3)] group-hover:text-accent transition-colors duration-200 shrink-0" size={16} />
      <span className="rounded-xl border border-accent/20 bg-accent/10 px-3 py-2.5 text-accent text-xs font-medium text-center flex-1 min-w-0 truncate">{engine}</span>
      <ArrowRight className="text-[var(--text-3)] group-hover:text-accent transition-colors duration-200 shrink-0" size={16} />
      <span className="rounded-xl bg-obsidian dark:bg-[#0a0a0a] px-4 py-2.5 font-mono font-semibold text-white shrink-0">{target}</span>
    </div>
  );
}
