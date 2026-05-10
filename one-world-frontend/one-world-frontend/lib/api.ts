import { API_BASE_URL } from "@/lib/constants";

export type JobState = "queued" | "running" | "complete" | "failed" | "unsupported";

export type JobStatus = {
  job_id: string;
  toolkit: string;
  operation: string;
  status: JobState;
  progress: number;
  message: string;
  output: string | null;
  outputs?: { name: string; label: string; path: string }[];
};

export type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

export type ToolDefinition = {
  title: string;
  endpoint: string;
  accepted: string;
  outputFormats?: string[];
  description: string;
};

export async function createJob(endpoint: string, file: File, fields: Record<string, string | number> = {}) {
  const body = new FormData();
  body.append("file", file);
  Object.entries(fields).forEach(([key, value]) => body.append(key, String(value)));

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: "POST", body });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as { job_id: string; status: JobState };
}

export async function getJob(toolkit: string, jobId: string) {
  const response = await fetch(`${API_BASE_URL}/api/${toolkit}/status/${jobId}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as JobStatus;
}

export function downloadUrl(toolkit: string, jobId: string) {
  return `${API_BASE_URL}/api/${toolkit}/download/${jobId}`;
}

export function downloadFileUrl(toolkit: string, jobId: string, index: number) {
  return `${API_BASE_URL}/api/${toolkit}/download/${jobId}/${index}`;
}

