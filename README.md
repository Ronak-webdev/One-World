# One World

Minimal premium local AI toolkit scaffold.

## Structure

- `one-world-frontend/` — Next.js 14 App Router UI with Tailwind, Framer Motion, GSAP, Lenis, and local tool pages.
- `wavebrain/backend/` — FastAPI backend with WaveBrain-style routers for audio, image, conversion, and lab routes.

## Local Setup

Frontend:

```powershell
pnpm --dir one-world-frontend install
pnpm --dir one-world-frontend dev
```

Backend:

```powershell
cd wavebrain/backend
& 'C:\Users\shail\OneDrive\Desktop\Oneworld\venv\Scripts\python.exe' -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Copy `wavebrain/backend/.env.example` to `.env` and `one-world-frontend/.env.local.example` to `.env.local` if you need non-default binary or API paths.

## Notes

The provided venv contains the existing audio runtime, but not all image/conversion packages or model weights. Missing heavyweight tools return explicit unsupported/failed job status until their dependencies and weights are installed.

