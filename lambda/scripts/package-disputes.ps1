# Package Disputes Module Lambda Functions (PowerShell)
# This script creates deployment packages for all dispute handlers

Write-Host "🔧 Packaging Disputes Module Lambda Functions..." -ForegroundColor Cyan

# Create dist directory if it doesn't exist
$distDir = Join-Path $PSScriptRoot "..\dist"
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

# Function to package a Lambda function
function Package-Lambda {
    param(
        [string]$HandlerFile,
        [string]$ZipName
    )
    
    Write-Host "📦 Packaging $HandlerFile -> $ZipName" -ForegroundColor Yellow
    
    # Create temporary directory
    $tempDir = Join-Path $env:TEMP ([System.IO.Path]::GetRandomFileName())
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    
    try {
        # Copy handler file
        $sourceFile = Join-Path $PSScriptRoot "..\core\disputes\$HandlerFile"
        Copy-Item $sourceFile -Destination $tempDir
        
        # Copy shared utilities if they exist
        $sharedDir = Join-Path $PSScriptRoot "..\core\shared"
        if (Test-Path $sharedDir) {
            $tempSharedDir = Join-Path $tempDir "shared"
            New-Item -ItemType Directory -Path $tempSharedDir | Out-Null
            Copy-Item "$sharedDir\*" -Destination $tempSharedDir -Recurse
        }
        
        # Copy node_modules (if needed)
        $nodeModulesDir = Join-Path $PSScriptRoot "..\node_modules"
        if (Test-Path $nodeModulesDir) {
            Copy-Item $nodeModulesDir -Destination $tempDir -Recurse
        }
        
        # Create zip file
        $zipPath = Join-Path $distDir $ZipName
        if (Test-Path $zipPath) {
            Remove-Item $zipPath -Force
        }
        
        Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -CompressionLevel Optimal
        
        Write-Host "✅ Created $ZipName" -ForegroundColor Green
    }
    finally {
        # Clean up
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Package all dispute handlers
Package-Lambda "create-dispute.ts" "disputes-create.zip"
Package-Lambda "get-disputes-dynamodb.ts" "disputes-get-list.zip"
Package-Lambda "get-dispute-dynamodb.ts" "disputes-get-single.zip"
Package-Lambda "update-dispute-status.ts" "disputes-update-status.zip"
Package-Lambda "close-dispute-dynamodb.ts" "disputes-close.zip"
Package-Lambda "escalate-dispute-dynamodb.ts" "disputes-escalate.zip"
Package-Lambda "request-mediation-dynamodb.ts" "disputes-mediation.zip"
Package-Lambda "get-dispute-messages-dynamodb.ts" "disputes-messages-get.zip"
Package-Lambda "send-dispute-message-dynamodb.ts" "disputes-messages-send.zip"
Package-Lambda "add-evidence.ts" "disputes-evidence-add.zip"
Package-Lambda "accept-resolution-dynamodb.ts" "disputes-resolution-accept.zip"

Write-Host ""
Write-Host "✅ All disputes Lambda functions packaged successfully!" -ForegroundColor Green
Write-Host "📁 Packages location: $distDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd ..\terraform"
Write-Host "2. terraform init"
Write-Host "3. terraform plan"
Write-Host "4. terraform apply"
