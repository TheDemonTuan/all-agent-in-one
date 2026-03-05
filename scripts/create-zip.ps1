$sourcePath = "release\win-unpacked"
$destinationPath = "TDT-Space-v0.1.0-win.zip"

Write-Host "Creating ZIP archive from $sourcePath to $destinationPath..."

# Remove existing zip if exists
if (Test-Path $destinationPath) {
    Remove-Item $destinationPath -Force
}

# Create compression
Compress-Archive -Path "$sourcePath\*" -DestinationPath $destinationPath -Force

Write-Host "✓ ZIP archive created successfully!"
Write-Host "  File: $destinationPath"
Write-Host "  Size: $((Get-Item $destinationPath).Length / 1MB) MB"
