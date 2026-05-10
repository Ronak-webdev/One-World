"use client";

import { useEffect } from "react";

import { createLenis } from "@/lib/lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => createLenis(), []);
  return <>{children}</>;
}

