"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type TabBarProps = {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
};

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "relative h-9 rounded-full px-4 text-sm font-medium transition-colors duration-200",
            active === tab
              ? "text-white"
              : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          )}
          type="button"
        >
          {active === tab && (
            <motion.span
              layoutId="active-tab"
              className="absolute inset-0 rounded-full bg-[var(--text-1)]"
              style={{ zIndex: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          {tab}
        </button>
      ))}
    </div>
  );
}
