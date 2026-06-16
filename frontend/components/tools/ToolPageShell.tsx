"use client";

import { useMemo, useState } from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { TabBar } from "@/components/ui/TabBar";
import { ImageToolWorkspace } from "@/components/tools/ImageToolWorkspace";
import { AudioToolWorkspace } from "@/components/tools/AudioToolWorkspace";
import { ConvertToolWorkspace } from "@/components/tools/ConvertToolWorkspace";
import { LabToolWorkspace } from "@/components/tools/LabToolWorkspace";
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

  const workspace = (() => {
    if (!tool) return null;
    switch (toolkit) {
      case "image": return <ImageToolWorkspace toolkit={toolkit} tool={tool} />;
      case "audio": return <AudioToolWorkspace toolkit={toolkit} tool={tool} />;
      case "convert": return <ConvertToolWorkspace toolkit={toolkit} tool={tool} />;
      case "lab": return <LabToolWorkspace toolkit={toolkit} tool={tool} />;
      default: return null;
    }
  })();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)]">
        <section className="bg-[var(--background)] px-5 pb-24 pt-32 text-[var(--text-1)]">
          <div className="mx-auto max-w-content">
            <Badge>{label}</Badge>
            <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-tight text-[var(--text-1)]">{title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-2)]">{description}</p>
          </div>
        </section>
        <section className="mx-auto max-w-content px-5 py-12">
          <div className="overflow-x-auto pb-2">
            <TabBar tabs={tools.map((item) => item.title)} active={active} onChange={setActive} />
          </div>
          <div className="mt-6 h-[600px] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl">
            {workspace}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
