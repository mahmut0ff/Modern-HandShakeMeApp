# Package Dashboard Stats Lambda Functions (PowerShell)
# Упаковка Lambda функций для dashboard статистики

Write-Host "📦 Packaging Dashboard Stats Lambda Functions..." -ForegroundColor Cyan

# Create dist directory if it doesn't exist
if (-not (Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist" | Out-Null
}

# Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript build failed" -ForegroundColor Red
    exit 1
}

# Package Client Dashboard Stats
Write-Host "📦 Packaging client-dashboard-stats..." -ForegroundColor Yellow
Push-Location "build\core\profiles"
Compress-Archive -Path "get-client-dashboard-stats.js" -DestinationPath "..\..\..\dist\clients-dashboard-stats.zip" -Force
Pop-Location

# Package Master Dashboard Stats
Write-Host "📦 Packaging master-dashboard-stats..." -ForegroundColor Yellow
Push-Location "build\core\profiles"
Compress-Archive -Path "get-master-dashboard-stats.js" -DestinationPath "..\..\..\dist\masters-dashboard-stats.zip" -Force
Pop-Location

Write-Host ""
Write-Host "✅ Dashboard Stats Lambda functions packaged successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Created files:" -ForegroundColor Cyan
Write-Host "  - dist\clients-dashboard-stats.zip"
Write-Host "  - dist\masters-dashboard-stats.zip"
