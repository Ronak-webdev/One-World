import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0A0A0A",
        graphite: "#141414",
        accent: {
          DEFAULT: "#5B5BD6",
          hover: "#4747C2",
          subtle: "rgba(91, 91, 214, 0.08)"
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
          secondary: "#F5F5F7"
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
        exit: "cubic-bezier(0.4, 0, 1, 1)"
      }
    }
  },
  plugins: []
};

export default config;

