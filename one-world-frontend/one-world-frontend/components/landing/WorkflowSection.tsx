"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, CloudOff, Zap, ShieldCheck, ArrowRight } from "lucide-react";

const workflowSteps = [
  {
    title: "Choose your toolkit",
    description: "Select from Audio, Image, or Research Lab modules, each powered by fine-tuned local models.",
    icon: <Cpu size={32} />,
    visual: "tools"
  },
  {
    title: "Privacy-first processing",
    description: "Your files never leave your machine. No cloud uploads, no data retention, 100% private.",
    icon: <ShieldCheck size={32} />,
    visual: "privacy"
  },
  {
    title: "RTX Accelerated",
    description: "Leverage your local GPU for near-instant inference. Support for CUDA, CoreML, and DirectML.",
    icon: <Zap size={32} />,
    visual: "speed"
  },
  {
    title: "Export & Done",
    description: "Get high-quality results in seconds. No watermarks, no limits, no subscriptions required.",
    icon: <CloudOff size={32} />,
    visual: "export"
  }
];

function ProcessId() {
  const [id, setId] = useState("");
  useEffect(() => {
    setId(Math.random().toString(36).substring(7).toUpperCase());
  }, []);
  return <p className="mt-1 text-accent">Process ID: {id || "LOADING..."}</p>;
}

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="workflow" className="section-pad bg-[var(--surface-2)] transition-colors duration-500 overflow-hidden">
      <div className="mx-auto max-w-content px-5">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase text-accent tracking-widest"
          >
            02 — How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-4xl md:text-5xl font-extrabold leading-tight text-[var(--text-1)]"
          >
            The power of local AI.
          </motion.h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] items-center">
          {/* Left: Interactive Steps */}
          <div className="space-y-3">
            {workflowSteps.map((step, index) => (
              <button
                key={step.title}
                onClick={() => setActiveStep(index)}
                className={`group relative flex w-full items-start gap-5 rounded-2xl p-6 text-left transition-all duration-300 ${
                  activeStep === index
                    ? "bg-[var(--surface)] shadow-lg border border-[var(--border)]"
                    : "hover:bg-[var(--surface-3)]/50"
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                    activeStep === index ? "bg-accent text-white" : "bg-[var(--surface-3)] text-[var(--text-3)]"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold transition-colors duration-300 ${
                      activeStep === index ? "text-[var(--text-1)]" : "text-[var(--text-2)] group-hover:text-[var(--text-1)]"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed transition-all duration-300 ${
                    activeStep === index ? "text-[var(--text-2)] opacity-100" : "text-[var(--text-3)] opacity-0 h-0 overflow-hidden"
                  }`}>
                    {step.description}
                  </p>
                </div>
                {activeStep === index && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-6 bottom-6 w-1 bg-accent rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Right: Visualizer */}
          <div className="relative aspect-video lg:aspect-square w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="relative h-full w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-8 flex flex-col items-center justify-center overflow-hidden"
              >
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                     style={{ backgroundImage: "radial-gradient(var(--text-3) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 text-accent mb-8"
                >
                  {workflowSteps[activeStep].icon}
                </motion.div>

                <div className="w-full max-w-sm space-y-4 relative z-10">
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <motion.div
                      className="h-full bg-accent"
                      initial={{ width: "0%" }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 1.5, delay: 0.3, ease: "circOut" }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]"
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-8 text-center font-mono text-[10px] text-[var(--text-3)] uppercase tracking-widest relative z-10">
                  <p>Inference Status: Active</p>
                  <ProcessId />
                </div>

                {/* Animated Orbs */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent/10 rounded-full blur-[60px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-[70px] animate-pulse" style={{ animationDelay: "1s" }} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
