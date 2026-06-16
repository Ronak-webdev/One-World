"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type ToolDefinition } from "@/lib/api";
import { BackgroundRemoverWorkspace } from "./image/BackgroundRemoverWorkspace";
import { UpscalerWorkspace } from "./image/UpscalerWorkspace";
import { EnhancerWorkspace } from "./image/EnhancerWorkspace";
import { FilterStudioWorkspace } from "./image/FilterStudioWorkspace";
import { ObjectRemoverWorkspace } from "./image/ObjectRemoverWorkspace";
import { FormatConverterWorkspace } from "./image/FormatConverterWorkspace";
import { BatchProcessorWorkspace } from "./image/BatchProcessorWorkspace";

type Props = {
  toolkit: string;
  tool: ToolDefinition;
};

export function ImageToolWorkspace({ toolkit, tool }: Props) {
  const key = tool.title;

  const workspace = (() => {
    switch (tool.title) {
      case "Background Remover":
        return <BackgroundRemoverWorkspace toolkit={toolkit} tool={tool} />;
      case "Upscaler":
        return <UpscalerWorkspace toolkit={toolkit} tool={tool} />;
      case "Enhancer":
        return <EnhancerWorkspace toolkit={toolkit} tool={tool} />;
      case "Filter Studio":
        return <FilterStudioWorkspace toolkit={toolkit} tool={tool} />;
      case "Object Remover":
        return <ObjectRemoverWorkspace toolkit={toolkit} tool={tool} />;
      case "Format Converter":
        return <FormatConverterWorkspace toolkit={toolkit} tool={tool} />;
      case "Batch Processor":
        return <BatchProcessorWorkspace toolkit={toolkit} tool={tool} />;
      default:
        return (
          <div className="flex h-full items-center justify-center text-black/30 text-sm">
            No workspace available for this tool.
          </div>
        );
    }
  })();

  return (
    <AnimatePresence>
      <motion.div
        key={key}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="h-full w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
      >
        {workspace}
      </motion.div>
    </AnimatePresence>
  );
}
