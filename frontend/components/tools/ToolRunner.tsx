"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UploadZone } from "@/components/ui/UploadZone";
import { type ToolDefinition } from "@/lib/api";
import { useUpload } from "@/hooks/useUpload";
import { Loader } from "@/components/ui/Loader";
import { downloadUrl as getDownloadUrl } from "@/lib/api";

type ToolRunnerProps = {
  toolkit: string;
  tool: ToolDefinition;
};

export function ToolRunner({ toolkit, tool }: ToolRunnerProps) {
  const [format, setFormat] = useState(tool.outputFormats?.[0] ?? "");
  const { state, error, job, upload } = useUpload(toolkit, tool.endpoint, format ? { output_format: format } : {});
  const busy = state === "uploading" || state === "processing";

  return (
    <Card className="p-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <h3 className="text-xl font-semibold">{tool.title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">{tool.description}</p>
        </div>
        {tool.outputFormats?.length ? (
          <select className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm" value={format} onChange={(event) => setFormat(event.target.value)} aria-label="Output format">
            {tool.outputFormats.map((item) => (
              <option key={item} value={item}>{item.toUpperCase()}</option>
            ))}
          </select>
        ) : null}
      </div>
      {state === "processing" ? (
        <div className="mt-8">
          <Loader />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <UploadZone accepted={tool.accepted} disabled={busy} onFile={upload} />
          </div>
          <div className="mt-5 flex flex-col gap-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between border-t border-black/5 pt-5">
            <span className="inline-flex items-center gap-2 font-medium">
              {state === "uploading" ? <Loader2 className="animate-spin text-accent" size={16} /> : null}
              {error ?? (state === "done" ? "Processing Complete" : job?.message ?? "Ready to process")}
            </span>
            {state === "done" && job?.job_id ? (
              <div className="flex flex-wrap gap-2">
                {tool.title === "Vocal Remover" ? (
                  <>
                    <a href={getDownloadUrl(toolkit, job.job_id, "vocals")} download>
                      <Button size="sm" variant="primary">
                        <Download size={14} className="mr-2" /> Vocals
                      </Button>
                    </a>
                    <a href={getDownloadUrl(toolkit, job.job_id, "instrumental")} download>
                      <Button size="sm" variant="primary">
                        <Download size={14} className="mr-2" /> Instrumental
                      </Button>
                    </a>
                    <a href={getDownloadUrl(toolkit, job.job_id)} download>
                      <Button size="sm" variant="secondary">
                        <Download size={14} className="mr-2" /> Both (ZIP)
                      </Button>
                    </a>
                  </>
                ) : (
                  <a href={getDownloadUrl(toolkit, job.job_id)} download>
                    <Button size="sm" variant="primary">
                      <Download size={14} className="mr-2" /> Download Result
                    </Button>
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}
    </Card>
  );
}
