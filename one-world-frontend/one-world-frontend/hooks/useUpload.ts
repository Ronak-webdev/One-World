"use client";

import { useCallback, useState } from "react";

import { createJob, downloadUrl, getJob, type JobStatus, type UploadState } from "@/lib/api";

export function useUpload(toolkit: string, endpoint: string, fields: Record<string, string | number> = {}) {
  const [state, setState] = useState<UploadState>("idle");
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setState("uploading");
      setError(null);
      try {
        const created = await createJob(endpoint, file, fields);
        setState("processing");
        let latest: JobStatus | null = null;
        for (let index = 0; index < 120; index += 1) {
          latest = await getJob(toolkit, created.job_id);
          setJob(latest);
          if (["complete", "failed", "unsupported"].includes(latest.status)) break;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (!latest || latest.status !== "complete") {
          throw new Error(latest?.message ?? "Job did not finish");
        }
        setState("done");
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [endpoint, fields, toolkit]
  );

  return {
    state,
    job,
    error,
    upload,
    download: job?.status === "complete" ? downloadUrl(toolkit, job.job_id) : null
  };
}

