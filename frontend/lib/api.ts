import { API_BASE_URL } from "@/lib/constants";

export type JobState = "queued" | "processing" | "complete" | "failed" | "unsupported";

export type JobStatus = {
  job_id: string;
  toolkit: string;
  tool: string;
  status: JobState;
  results?: Record<string, string>;
  partial_results?: any;
  message?: string;
  error?: string;
};

export type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

export type ToolDefinition = {
  title: string;
  endpoint: string;
  accepted: string;
  outputFormats?: string[];
  description: string;
};

export async function createJob(toolkit: string, endpoint: string, file: File, fields: any) {
  const body = new FormData();
  body.append("file", file);
  Object.entries(fields).forEach(([key, value]) => {
    if (value instanceof File) {
      body.append(key, value);
    } else {
      body.append(key, String(value));
    }
  });

  const path = endpoint.startsWith("/api") ? endpoint : `/api/${toolkit}/${endpoint.replace(/^\//, "")}`;
  const url = `${API_BASE_URL}${path}`;
  console.log(`[API] Creating job at: ${url}`);
  
  const response = await fetch(url, { method: "POST", body });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API Error] ${response.status}: ${errorText}`);
    throw new Error(errorText);
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

export function downloadUrl(toolkit: string, jobId: string, type?: string, inline: boolean = false) {
  if (!jobId || jobId === "undefined") return "";
  const base = `${API_BASE_URL}/api/${toolkit}/download/${jobId}`;
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (inline) params.append("inline", "true");
  params.append("t", Date.now().toString()); // Cache buster
  
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

