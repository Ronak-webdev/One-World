"use client";

import { cn } from "@/lib/utils";

type TabBarProps = {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
};

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "h-9 rounded-full px-4 text-sm font-medium text-text-secondary transition duration-150",
            active === tab && "bg-obsidian text-white"
          )}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

