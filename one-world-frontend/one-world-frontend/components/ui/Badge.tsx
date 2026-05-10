import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "accent" | "green" | "amber" | "muted" | "dark";
};

const tones = {
  accent: "border-accent/30 bg-accent/10 text-accent",
  green: "border-[#34C759]/30 bg-[#34C759]/10 text-[#34C759]",
  amber: "border-[#FF9500]/30 bg-[#FF9500]/10 text-[#B85F00] dark:text-[#FF9500]",
  muted: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]",
  dark: "border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-2)]"
};

export function Badge({ className, tone = "accent", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
