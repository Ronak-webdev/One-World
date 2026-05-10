"use client";

import Link from "next/link";
import { Github, Twitter, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { toolkitLinks } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--footer-bg)] py-16 text-[var(--footer-fg)] transition-colors duration-500 relative overflow-hidden">
      {/* Top glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      <div className="mx-auto grid max-w-content gap-10 px-5 py-16 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--footer-fg)]">
            <span className="relative h-2.5 w-2.5 rounded-full bg-accent">
              <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30 scale-150" />
            </span>
            One World
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--footer-fg-2)]">
            The complete local AI toolkit. Built with love in Ahmedabad. Professional AI creative tools designed to run locally on your hardware.
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href="#"
              className="h-9 w-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--footer-fg-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-3)] transition-all duration-200"
              aria-label="GitHub"
            >
              <Github size={16} />
            </a>
            <a
              href="#"
              className="h-9 w-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--footer-fg-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-3)] transition-all duration-200"
              aria-label="Twitter"
            >
              <Twitter size={16} />
            </a>
          </div>
        </div>

        <FooterColumn title="Product" items={[...toolkitLinks.map((link) => link.label), "Changelog", "Roadmap"]} />
        <FooterColumn title="Resources" items={["Documentation", "GitHub", "Model Sources", "License"]} />

        {/* Newsletter / Team */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-[var(--footer-fg)] tracking-widest">Team</h3>
          <p className="mt-4 text-sm leading-6 text-[var(--footer-fg-2)]">
            Built by Ronak, Satvik, and Dhruv.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--footer-fg-2)]">
            WaveBrain audio engine under the hood.
          </p>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-1 pl-3">
            <span className="text-xs text-[var(--footer-fg-2)] flex-1">Stay updated</span>
            <button
              type="button"
              className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center hover:bg-accent-hover transition-colors duration-200 shrink-0"
              aria-label="Subscribe"
            >
              <ArrowRight size={13} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-content flex-col justify-between gap-3 px-5 py-5 text-xs text-[var(--footer-fg-2)] md:flex-row">
          <span>© {new Date().getFullYear()} One World. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-accent transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-[var(--footer-fg)] tracking-widest">{title}</h3>
      <div className="mt-4 flex flex-col gap-2.5 text-sm text-[var(--footer-fg-2)]">
        {items.map((item) => (
          <Link
            href="/"
            key={item}
            className="transition-all duration-200 hover:text-accent hover:pl-1 w-fit"
          >
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}
