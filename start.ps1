Write-Host "===================================================================" -ForegroundColor Magenta
Write-Host "  AAKA-NSXA Intelligence — Network Security Analytics Platform" -ForegroundColor White
Write-Host "===================================================================" -ForegroundColor Magenta

$pythonPath = "C:\Users\chakr\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $pythonPath)) { $pythonPath = "python" }

Write-Host "Starting Backend API on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k cd /d `"$PSScriptRoot\backend`" && `"$pythonPath`" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting Frontend UI on http://127.0.0.1:5173 ..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k cd /d `"$PSScriptRoot\frontend`" && npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2
Write-Host "`nPlatform running successfully!" -ForegroundColor Green
Write-Host "Opening browser at: http://localhost:5173" -ForegroundColor Yellow
Start-Process "http://localhost:5173"
