# 🌊 WaveBrain AI Studio

<div align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js_14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/AI-PyTorch-EE4C2C?style=for-the-badge&logo=pytorch" alt="PyTorch" />
  <img src="https://img.shields.io/badge/3D-Three.js-000000?style=for-the-badge&logo=threedotjs" alt="Three.js" />
</div>

<br />

**WaveBrain** is a comprehensive, local-first AI toolkit designed for media processing. It bridges a stunning, interactive WebGL frontend with a heavily optimized, GPU-accelerated Python backend. From vocal isolation to high-resolution image upscaling, WaveBrain handles complex multi-model pipelines completely locally, ensuring zero cloud dependency and maximum privacy.

## ✨ Key Features

### 🎵 Audio Engine
* **Vocal & Stem Separation**: Extracts vocals, drums, bass, and other instruments using state-of-the-art ONNX inference (MDX-NET / Demucs).
* **Transcription**: Millisecond-accurate word-level timestamps across 99 languages using Faster-Whisper.
* **Audio Enhancement**: Neural denoising and super-resolution powered by Resemble-Enhance.
* **DSP Utilities**: Pitch shifting, silence removal, and format conversion directly inside the browser queue.

### 🖼️ Image Engine
* **Background Removal**: Instant, crisp subject isolation using `u2net` architecture.
* **AI Upscaling**: Crystal-clear image enhancement up to 4x resolution via Real-ESRGAN.
* **Object Eraser**: Seamless scaffolded object cleanup and local image filtering pipelines.
* **Batch Processing**: Heavy-duty `.zip` in, `.zip` out automated pipelines.

### ⚡ Architecture & Performance
* **100% Local Inference**: No cloud APIs, no subscription fees, absolute data privacy.
* **GPU-Optimized Queue**: Built on an asynchronous SQLite-backed job queue inside FastAPI, automatically leveraging CUDA and FP16/TF32 hardware acceleration where available.
* **Immersive UX**: Features a highly interactive React Three Fiber (R3F) and Framer Motion frontend for a butter-smooth, application-like experience.

---

## 🛠️ Tech Stack

### Frontend
* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS + Framer Motion
* **Graphics**: Three.js + React Three Fiber
* **Language**: TypeScript

### Backend
* **Framework**: FastAPI (Python 3.10+)
* **Machine Learning**: PyTorch, ONNX Runtime (GPU), Transformers, librosa
* **Processing Tools**: FFmpeg, Pillow, rembg, OpenCV
* **Concurrency**: Asyncio + SQLite job queue

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* **Node.js**: v18+ & **pnpm**: v8+
* **Python**: 3.10+
* **FFmpeg**: Must be installed and added to system PATH.
* **CUDA/GPU (Optional but Highly Recommended)**: An NVIDIA GPU with 8GB+ VRAM for acceptable AI inference speeds.

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Start the AI Server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
# In a new terminal
cd frontend
pnpm install

# Start the Web UI
pnpm dev
```

Visit `http://localhost:3000` to interact with the studio.

---

## 🌍 Deployment Guide

WaveBrain's architecture cleanly separates the client UI from the heavy AI processing, allowing for a hybrid deployment strategy.

### 1. Frontend (Vercel)
The frontend is 100% statically renderable and can be hosted for free.
1. Fork or push this repository to your GitHub account.
2. Import the `frontend` directory into **Vercel**.
3. Add the Environment Variable:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
   ```
4. Deploy!

### 2. Backend (Local + Cloudflare Tunnel)
Due to the heavy GPU requirements (8-16GB RAM, CUDA), hosting the backend on traditional cloud platforms is expensive. The most cost-effective method is running it on your own hardware and exposing it securely.
1. Run the backend locally as shown in the *Getting Started* section.
2. Install `cloudflared` (Cloudflare Tunnel).
3. Expose your local port securely to the internet:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
4. Copy the generated `.trycloudflare.com` URL and paste it into your Vercel `NEXT_PUBLIC_API_BASE_URL` environment variable.

---

## 📝 License
This project is open-sourced under the MIT License.
