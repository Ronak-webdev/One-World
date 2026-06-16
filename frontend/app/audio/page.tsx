import { ToolWorkspaceShell } from "@/components/tools/ToolWorkspaceShell";
import type { ToolDefinition } from "@/lib/api";

const tools: ToolDefinition[] = [
  { title: "Vocal Remover", endpoint: "/api/audio/vocal-remove", accepted: "audio/*", outputFormats: ["wav", "mp3", "flac"], description: "MDX/audio-separator route for vocal and instrumental extraction." },
  { title: "Stem Separator", endpoint: "/api/audio/stem-separate", accepted: "audio/*", description: "Demucs htdemucs route for four-stem separation." },
  { title: "Transcription", endpoint: "/api/audio/transcribe", accepted: "audio/*,video/*", description: "Faster-Whisper transcription with word-level timestamps." },
  { title: "Enhancer", endpoint: "/api/audio/enhance", accepted: "audio/*", description: "Resemble-Enhance route with dependency-aware status." },
  { title: "Pitch Shift", endpoint: "/api/audio/pitch-shift", accepted: "audio/*", description: "Local pitch adjustment through librosa." },
  { title: "Noise Reduction", endpoint: "/api/audio/denoise", accepted: "audio/*", description: "Denoise audio with local DSP libraries." },
  { title: "Format Converter", endpoint: "/api/audio/convert", accepted: "audio/*", outputFormats: ["mp3", "wav", "flac", "ogg", "m4a"], description: "FFmpeg-backed audio format conversion." },
  { title: "Silence Remover", endpoint: "/api/audio/remove-silence", accepted: "audio/*", description: "Strip long silent regions with local thresholding." }
];

export default function AudioPage() {
  return <ToolWorkspaceShell toolkit="audio" tools={tools} />;
}

