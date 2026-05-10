import { ToolPageShell } from "@/components/tools/ToolPageShell";
import type { ToolDefinition } from "@/lib/api";

const tools: ToolDefinition[] = [
  { title: "PDF to Word", endpoint: "/api/convert/pdf-to-word", accepted: "application/pdf", description: "Convert PDF files to DOCX using pdf2docx." },
  { title: "Word to PDF", endpoint: "/api/convert/word-to-pdf", accepted: ".doc,.docx", description: "LibreOffice headless conversion to PDF." },
  { title: "PDF to PPT", endpoint: "/api/convert/pdf-to-ppt", accepted: "application/pdf", description: "Render PDF pages into a generated PPTX deck." },
  { title: "PDF to TXT", endpoint: "/api/convert/pdf-to-txt", accepted: "application/pdf", description: "Extract text from PDFs with PyMuPDF." },
  { title: "Markdown to PDF", endpoint: "/api/convert/markdown-to-pdf", accepted: ".md,text/markdown", description: "Render Markdown to PDF through WeasyPrint." },
  { title: "Image Convert", endpoint: "/api/convert/image", accepted: "image/*", outputFormats: ["png", "jpg", "webp"], description: "Format conversion for image files." },
  { title: "Media Convert", endpoint: "/api/convert/media", accepted: "audio/*,video/*", outputFormats: ["mp4", "mp3", "wav", "gif"], description: "FFmpeg media conversion route." }
];

export default function ConvertPage() {
  return <ToolPageShell label="03 — Convert" title="Any format, queued locally." description="Document, image, and media conversion flows with consistent job status and downloads." toolkit="convert" tools={tools} />;
}

