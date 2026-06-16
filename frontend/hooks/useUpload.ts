"use client";

import { useCallback, useState } from "react";

import { createJob, downloadUrl, getJob, type JobStatus, type UploadState } from "@/lib/api";

export function useUpload(
  toolkit: string,
  endpoint: string,
  initialFields: Record<string, string | number | File> = {}
) {
  const [state, setState] = useState<UploadState>("idle");
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<{ file: File; previewUrl: string } | null>(null);

  const upload = useCallback(
    async (file: File, customFields?: Record<string, string | number | File>) => {
      setState("uploading");
      setError(null);

      // Generate local preview URL and revoke any previous one
      setOriginalFile((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return { file, previewUrl: URL.createObjectURL(file) };
      });

      try {
        const payloadFields = { ...initialFields, ...customFields };
        const created = await createJob(toolkit, endpoint, file, payloadFields);
        console.log(`[useUpload] Created job: ${created.job_id} for toolkit: ${toolkit}`);
        setState("processing");

        // Small delay before first poll — gives backend time to persist the job
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let latest: JobStatus | null = null;
        const pollInterval = 1000;
        const maxRetries = 900; // Increased to 15 minutes for Demucs/Whisper tasks
        for (let index = 0; index < maxRetries; index += 1) {
          try {
            latest = await getJob(toolkit, created.job_id);
            setJob(latest);
            if (["complete", "failed", "unsupported"].includes(latest.status)) break;
          } catch (err) {
            // Retry on 404 up to 10 times (job may not be persisted yet)
            if (err instanceof Error && err.message.includes("Job not found") && index < 10) {
              console.warn(`[useUpload] Job ${created.job_id} not found yet, retrying... (${index + 1}/10)`);
            } else {
              throw err;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }

        if (!latest || latest.status !== "complete") {
          const msg = latest?.error || latest?.message || "Job timed out or failed on server";
          throw new Error(msg);
        }
        setState("done");
      } catch (err) {
        console.error("[useUpload Error]:", err);
        setState("error");
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, toolkit]
  );

  return {
    state,
    job,
    error,
    upload,
    originalFile,
    download: job?.status === "complete" ? downloadUrl(toolkit, job.job_id) : null,
  };
}
