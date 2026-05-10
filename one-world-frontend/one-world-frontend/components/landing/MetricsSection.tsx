"use client";

import { motion } from "framer-motion";

import { CountUp } from "@/components/ui/CountUp";
import { metrics } from "@/lib/constants";

const icons = ["⚡", "🧠", "🔒", "🎮"];

export function MetricsSection() {
  return (
    <section className="bg-[var(--surface-2)] py-20 transition-colors duration-300">
      <div className="mx-auto max-w-content px-5">
        <motion.div
          className="grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] md:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
        >
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.value}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } }
              }}
              className="group relative border-[var(--border)] p-8 md:border-r md:last:border-r-0 hover:bg-[var(--surface-2)] transition-colors duration-200 cursor-default"
            >
              {/* Hover accent line top */}
              <div className="absolute top-0 left-8 right-8 h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

              <span className="text-2xl mb-3 block">{icons[i]}</span>
              <div className="text-4xl font-bold text-[var(--text-1)]">
                <CountUp value={metric.value} />
              </div>
              <p className="mt-3 max-w-[13rem] text-sm leading-6 text-[var(--text-2)]">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
