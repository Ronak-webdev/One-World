import { ToolWorkspaceShell } from "@/components/tools/ToolWorkspaceShell";
import type { ToolDefinition } from "@/lib/api";

const tools: ToolDefinition[] = [
  { title: "AI Lab Assistant", endpoint: "/api/lab/ollama", accepted: "image/*", description: "Chat with locally installed Ollama models with vision and voice support." }
];

export default function LabPage() {
  return <ToolWorkspaceShell toolkit="lab" tools={tools} />;
}
