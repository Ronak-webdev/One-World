import { ToolWorkspaceShell } from "@/components/tools/ToolWorkspaceShell";
import type { ToolDefinition } from "@/lib/api";

const tools: ToolDefinition[] = [
  { title: "Background Remover", endpoint: "/api/image/remove-background", accepted: "image/*", description: "rembg u2net background removal when the dependency and model are available." },
  { title: "Upscaler", endpoint: "/api/image/upscale", accepted: "image/*", description: "Real-ESRGAN x4 upscaling with local model weights." },
  { title: "Enhancer", endpoint: "/api/image/enhance", accepted: "image/*", description: "Fast Pillow-based contrast and sharpness enhancement." },
  { title: "Filter Studio", endpoint: "/api/image/filter", accepted: "image/*", description: "Local image filters for monochrome, warm, cool, cinema, and cartoon looks." },
  { title: "Format Converter", endpoint: "/api/image/convert", accepted: "image/*", outputFormats: ["png", "jpg", "webp", "bmp", "tiff"], description: "Pillow-backed image conversion." },
  { title: "Object Remover", endpoint: "/api/image/remove-object", accepted: "image/*", description: "Scaffolded object cleanup route with a lightweight local preview." },
  { title: "Batch Processor", endpoint: "/api/image/batch", accepted: ".zip", outputFormats: ["png", "jpg", "webp"], description: "Zip in, zip out batch image conversion." }
];

export default function ImagePage() {
  return <ToolWorkspaceShell toolkit="image" tools={tools} />;
}

