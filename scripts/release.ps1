param(
    [string]$Version = "0.1.0"
)

# Refresh PATH to include gh
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$Tag = "v$Version"
$Repo = "TheDemonTuan/all-agent-in-one"
$ZipFile = "TDT-Space-$Tag-win.zip"

Write-Host "=== TDT Space Release $Tag ===" -ForegroundColor Cyan

# Step 1: Check auth
Write-Host "Checking GitHub auth..." -ForegroundColor Yellow
$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not authenticated! Run: gh auth login" -ForegroundColor Red
    exit 1
}
Write-Host "OK - Authenticated" -ForegroundColor Green

# Step 2: Check ZIP exists
Write-Host "Checking ZIP file..." -ForegroundColor Yellow
if (-not (Test-Path $ZipFile)) {
    Write-Host "Building application..." -ForegroundColor Yellow
    bun run electron:build
    & .\scripts\create-zip.ps1
}
Write-Host "ZIP exists: $ZipFile" -ForegroundColor Green

# Step 3: Commit changes
Write-Host "Checking git changes..." -ForegroundColor Yellow
$changes = git status --porcelain
if ($changes) {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git add .
    git commit -m "chore: Release $Tag"
    git push origin main
}

# Step 4: Create tag
Write-Host "Creating tag $Tag..." -ForegroundColor Yellow
git tag -d $Tag 2>$null
git tag -a $Tag -m "Release $Tag"
git push origin $Tag --force
Write-Host "Tag pushed" -ForegroundColor Green

# Step 5: Create release
Write-Host "Creating GitHub Release..." -ForegroundColor Yellow
$releaseNotes = @"
TDT Space v$Version - Initial Release

Features:
- Grid Terminal Layout (1x1 to 4x4)
- Multi-Agent Support
- Workspace Management
- Custom Templates
- Terminal Search & History

Installation:
1. Download $ZipFile
2. Extract and run TDT Space.exe

Docs: https://github.com/$Repo/blob/main/README.md
"@

gh release delete $Tag --cleanup-tag --yes 2>$null

gh release create $Tag `
    --title "TDT Space $Tag" `
    --notes $releaseNotes `
    --repo $Repo `
    $ZipFile

Write-Host ""
Write-Host "Release created!" -ForegroundColor Green
Write-Host "https://github.com/$Repo/releases/tag/$Tag" -ForegroundColor Cyan
