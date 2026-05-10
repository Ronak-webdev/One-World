"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/providers/ThemeProvider";
import { toolkitLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggle, isDark } = useTheme();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl shadow-[0_1px_20px_rgba(0,0,0,0.08)]"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex h-[60px] max-w-content items-center justify-between px-5">
          {/* Logo */}
          <Link
            className={cn(
              "flex items-center gap-2.5 text-sm font-semibold transition-all duration-300 group",
              scrolled
                ? "text-[var(--text-1)]"
                : "text-[var(--foreground)]"
            )}
            href="/"
          >
            <span className="relative h-2.5 w-2.5 rounded-full bg-accent">
              <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-40 scale-150" />
            </span>
            One World
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {toolkitLinks.map((link) => (
              <Link
                className={cn(
                  "text-sm font-medium transition-all duration-200 hover-accent-line relative",
                  scrolled
                    ? "text-[var(--text-2)] hover:text-[var(--text-1)]"
                    : "text-[var(--text-2)] hover:text-[var(--text-1)]",
                  pathname === link.href && (scrolled ? "text-[var(--text-1)]" : "text-[var(--text-1)]")
                )}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: Theme toggle + CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggle}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              className={cn(
                "relative h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200",
                "hover:scale-110 active:scale-95",
                "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]"
              )}
              type="button"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun size={16} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <Link href="/audio">
              <Button
                size="sm"
                variant={isDark ? "accent" : "primary"}
                className="shadow-glow-sm hover:shadow-glow transition-all duration-200"
              >
                Open App
              </Button>
            </Link>
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                "text-[var(--text-2)] hover:text-[var(--text-1)]"
              )}
              type="button"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.span key="sun-m" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                    <Sun size={16} />
                  </motion.span>
                ) : (
                  <motion.span key="moon-m" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                    <Moon size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              className={cn("p-1.5 rounded-lg transition", "text-[var(--text-1)]")}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              type="button"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col bg-[var(--background)] p-5"
          >
            <div className="flex justify-between items-center">
              <Link className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]" href="/" onClick={() => setOpen(false)}>
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                One World
              </Link>
              <button
                className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-1)]"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <motion.div
              className="flex flex-1 flex-col items-center justify-center gap-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
            >
              {toolkitLinks.map((link) => (
                <motion.div
                  key={link.href}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Link
                    className="text-4xl font-bold text-[var(--text-1)] hover:text-accent transition-colors"
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <div className="flex justify-center pb-4">
              <Link href="/audio" onClick={() => setOpen(false)}>
                <Button size="lg" variant="primary" className="w-full max-w-xs">Open App</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
