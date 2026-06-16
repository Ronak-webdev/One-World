export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
export const MAX_UPLOAD_SIZE_MB = 2048;

export const toolkitLinks = [
  { href: "/audio", label: "Audio" },
  { href: "/image", label: "Image" },
  { href: "/convert", label: "Convert" },
  { href: "/lab", label: "Lab" }
];

export const metrics = [
  { value: "< 500ms", label: "Avg inference time per lightweight task" },
  { value: "4 Models", label: "Built-in AI pipelines" },
  { value: "100% Local", label: "No cloud upload ever" },
  { value: "RTX Ready", label: "Optimized for CUDA and ONNX" }
];

