import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 ease-standard",
        "hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--border)]",
        "shadow-[var(--card-shadow)]",
        className
      )}
      {...props}
    />
  );
}
