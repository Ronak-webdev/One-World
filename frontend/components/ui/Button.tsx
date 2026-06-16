import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger" | "light";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-obsidian text-white hover:bg-[#2D2D2D]",
  secondary: "border border-obsidian bg-transparent text-obsidian hover:bg-obsidian hover:text-white",
  accent: "bg-accent text-white hover:bg-accent-hover",
  ghost: "text-text-secondary hover:text-text-primary underline-offset-8 hover:underline",
  danger: "border border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white",
  light: "bg-[#F5F5F7] text-obsidian hover:bg-white"
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[52px] px-7 text-base"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-150 ease-standard active:scale-[0.97] focus-visible:focus-ring disabled:opacity-40 disabled:hover:bg-inherit",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

