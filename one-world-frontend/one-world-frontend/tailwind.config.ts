import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: "#0A0A0A",
        graphite: "#141414",
        accent: {
          DEFAULT: "#5B5BD6",
          hover: "#4747C2",
          subtle: "rgba(91, 91, 214, 0.08)",
          glow: "rgba(91, 91, 214, 0.35)"
        },
        text: {
          primary: "#0A0A0A",
          secondary: "#6E6E73",
          tertiary: "#AEAEB2",
          dark: "#F5F5F7",
          darkSecondary: "#86868B"
        },
        surface: {
          primary: "#FFFFFF",
          secondary: "#F5F5F7",
          dark: "#111114",
          darkSecondary: "#18181c"
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      maxWidth: {
        content: "1120px"
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        enter: "cubic-bezier(0, 0, 0.2, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)"
      },
      animation: {
        ticker: "ticker 30s linear infinite",
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite"
      },
      keyframes: {
        ticker: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" }
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(32px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        }
      },
      boxShadow: {
        "glow-sm": "0 0 12px rgba(91, 91, 214, 0.25)",
        glow: "0 0 24px rgba(91, 91, 214, 0.3)",
        "glow-lg": "0 0 48px rgba(91, 91, 214, 0.35)",
        "card-light": "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "card-dark": "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)",
        "card-hover": "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)"
      }
    }
  },
  plugins: []
};

export default config;
