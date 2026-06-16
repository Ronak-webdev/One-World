@echo off
title WaveBrain - Full Studio Starter
echo [1/3] Checking Ollama...
tasklist /FI "IMAGENAME eq ollama app.exe" 2>NUL | find /I /N "ollama app.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting Ollama background process...
    start "" "ollama app.exe"
    timeout /t 5
) else (
    echo Ollama is already running.
)

echo [2/3] Starting Backend Server...
start "WaveBrain Backend" cmd /c "cd backend && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [3/3] Starting Frontend (Next.js)...
start "WaveBrain Frontend" cmd /c "pnpm --dir frontend dev"

echo.
echo ==========================================
echo   WaveBrain AI Studio is starting up!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo ==========================================
pause
