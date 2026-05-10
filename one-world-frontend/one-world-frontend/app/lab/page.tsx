import { ToolPageShell } from "@/components/tools/ToolPageShell";
import type { ToolDefinition } from "@/lib/api";

const tools: ToolDefinition[] = [
  { title: "Style Transfer", endpoint: "/api/lab/style-transfer", accepted: "image/*", description: "Local stylized image processing route for the live lab feature." },
  { title: "Video Generation", endpoint: "/api/lab/video-generate", accepted: "image/*", description: "Placeholder endpoint returning 501 until local video models are enabled." },
  { title: "3D Generation", endpoint: "/api/lab/3d-generate", accepted: "image/*", description: "Placeholder endpoint returning 501 until local 3D models are enabled." }
];

export default function LabPage() {
  return <ToolPageShell label="04 — Lab" title="Experimental local AI routes." description="Live style transfer plus clear placeholders for future video, 3D, avatar, and document features." toolkit="lab" tools={tools} />;
}

