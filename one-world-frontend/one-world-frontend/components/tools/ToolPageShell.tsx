"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { TabBar } from "@/components/ui/TabBar";
import { ToolRunner } from "@/components/tools/ToolRunner";
import { type ToolDefinition } from "@/lib/api";

type ToolPageShellProps = {
  label: string;
  title: string;
  description: string;
  toolkit: string;
  tools: ToolDefinition[];
};

export function ToolPageShell({ label, title, description, toolkit, tools }: ToolPageShellProps) {
  const [active, setActive] = useState(tools[0]?.title ?? "");
  const tool = useMemo(() => tools.find((item) => item.title === active) ?? tools[0], [active, tools]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--surface-2)] transition-colors duration-300">
        {/* Hero header */}
        <section className="relative bg-obsidian px-5 pb-24 pt-32 text-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/10 blur-[80px]" />
          </div>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="relative mx-auto max-w-content"
          >
            <Badge>{label}</Badge>
            <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-tight text-text-dark">{title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-text-darkSecondary">{description}</p>
          </motion.div>
        </section>

        {/* Tool area */}
        <section className="mx-auto max-w-content px-5 py-12">
          <div className="overflow-x-auto pb-3 no-scrollbar">
            <TabBar tabs={tools.map((item) => item.title)} active={active} onChange={setActive} />
          </div>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            {tool ? <ToolRunner toolkit={toolkit} tool={tool} /> : null}
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}
