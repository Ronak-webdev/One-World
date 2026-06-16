import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "accent" | "green" | "amber" | "muted" | "dark";
};

const tones = {
  accent: "border-accent/30 bg-accent/10 text-accent",
  green: "border-[#34C759]/30 bg-[#34C759]/10 text-[#34C759]",
  amber: "border-[#FF9500]/30 bg-[#FF9500]/10 text-[#B85F00]",
  muted: "border-black/10 bg-black/[0.03] text-text-secondary",
  dark: "border-white/10 bg-white/[0.04] text-text-darkSecondary"
};

export function Badge({ className, tone = "accent", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase leading-none",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

