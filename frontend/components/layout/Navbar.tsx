"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { toolkitLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 80);
    update();
    requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition duration-300", scrolled && "border-b border-black/10 bg-white/85 backdrop-blur-xl")}>
        <nav className="mx-auto flex h-[60px] max-w-content items-center justify-between px-5">
          <Link className="flex items-center gap-2.5 text-[19px] font-extrabold tracking-tighter text-[var(--text-1)]" href="/">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-md shadow-accent/10">
              <Globe className="text-white" size={18} strokeWidth={2.5} />
            </div>
            One World
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {[{ href: "/", label: "Home" }, ...toolkitLinks].map((link) => (
              <Link 
                className={cn(
                  "relative px-4 py-2 text-sm font-bold transition-colors duration-200",
                  pathname === link.href ? "text-accent" : "text-[var(--text-1)] hover:text-accent"
                )} 
                href={link.href} 
                key={link.href}
              >
                {pathname === link.href && (
                  <motion.div 
                    layoutId="navbar-active"
                    className="absolute inset-0 rounded-full bg-accent/10 -z-10"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>
          <button className="md:hidden text-[var(--text-1)]" onClick={() => setOpen(true)} aria-label="Open menu" type="button">
            <Menu size={22} />
          </button>
        </nav>
      </header>
      {open ? (
        <div className="fixed inset-0 z-[60] flex scale-100 flex-col bg-white p-5 text-obsidian">
          <button className="ml-auto" onClick={() => setOpen(false)} aria-label="Close menu" type="button">
            <X size={24} />
          </button>
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            {toolkitLinks.map((link) => (
              <Link className="text-4xl font-semibold" href={link.href} key={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
