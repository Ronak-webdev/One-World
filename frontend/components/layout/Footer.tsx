import Link from "next/link";
import { Github, Twitter } from "lucide-react";

import { toolkitLinks } from "@/lib/constants";

const resources = ["Documentation", "GitHub", "Model Sources", "License"];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-obsidian text-white">
      <div className="mx-auto grid max-w-content gap-10 px-5 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            One World
          </div>
          <p className="mt-4 text-sm leading-6 text-text-darkSecondary">The complete local AI toolkit.</p>
          <div className="mt-5 flex gap-4 text-text-darkSecondary">
            <Github size={18} />
            <Twitter size={18} />
          </div>
        </div>
        <FooterColumn 
          title="Product" 
          items={[
            ...toolkitLinks, 
            { label: "Changelog", href: "#" }, 
            { label: "Roadmap", href: "#" }
          ]} 
        />
        <FooterColumn 
          title="Resources" 
          items={resources.map(r => ({ label: r, href: "#" }))} 
        />
        <div>
          <h3 className="text-xs font-semibold uppercase text-white">Team</h3>
          <p className="mt-4 text-sm leading-6 text-text-darkSecondary">Built by Ronak, Satvik, and Dhruv.</p>
          <p className="mt-2 text-sm leading-6 text-text-darkSecondary">WaveBrain audio engine under the hood.</p>
        </div>
      </div>
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto flex max-w-content flex-col justify-between gap-3 px-5 py-6 text-xs text-text-darkSecondary md:flex-row">
          <span>© 2025 One World. All rights reserved.</span>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-white">{title}</h3>
      <div className="mt-4 flex flex-col gap-3 text-sm text-text-darkSecondary">
        {items.map((item) => (
          <Link href={item.href} key={item.label} className="transition hover:text-white">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

