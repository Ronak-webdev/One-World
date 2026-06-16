import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/10 bg-white transition duration-300 ease-standard hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)]",
        className
      )}
      {...props}
    />
  );
}

