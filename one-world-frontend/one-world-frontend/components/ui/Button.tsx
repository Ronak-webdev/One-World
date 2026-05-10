import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger" | "light" | "glass";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-[var(--text-1)] text-[var(--surface)] hover:bg-[var(--text-1)]/90 shadow-md hover:shadow-lg",
  secondary: "border border-[var(--border)] bg-transparent text-[var(--text-1)] hover:bg-[var(--surface-2)]",
  accent: "bg-accent text-white hover:brightness-110 shadow-[0_0_20px_var(--accent-glow)] hover:shadow-[0_0_35px_var(--accent-glow)]",
  ghost: "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]",
  danger: "border border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white",
  light: "bg-white text-black hover:bg-white/95 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]",
  glass: "glass text-white hover:bg-white/10 hover:border-white/30"
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[52px] px-8 text-base font-bold"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300",
        "active:scale-[0.97] focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none",
        "hover:-translate-y-0.5",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
