@echo off
echo ===================================================================
echo   AAKA-NSXA Intelligence ? Network Security Analytics Platform
echo ===================================================================
echo Starting Backend API on http://127.0.0.1:8000 ...
start "AAKA-NSXA Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo Starting Frontend UI on http://127.0.0.1:5173 ...
start "AAKA-NSXA Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application is launching!
echo Open your browser at: http://localhost:5173
echo ===================================================================
