# Badge Generator Script
# Usage: .\scripts\generate-badges.ps1

$badges = @"
<!-- Badges for README.md -->
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![GitHub Release Date](https://img.shields.io/github/release-date/TheDemonTuan/all-agent-in-one)
![GitHub all releases](https://img.shields.io/github/downloads/TheDemonTuan/all-agent-in-one/total)
![GitHub issues](https://img.shields.io/github/issues/TheDemonTuan/all-agent-in-one)
![GitHub pull requests](https://img.shields.io/github/issues-pr/TheDemonTuan/all-agent-in-one)
![GitHub](https://img.shields.io/github/license/TheDemonTuan/all-agent-in-one)
![Electron](https://img.shields.io/badge/Electron-34.5.8-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows)
"@

Write-Host "Generated Badges:"
Write-Host $badges

# Copy to clipboard
$badges | Set-Clipboard
Write-Host "`n✓ Badges copied to clipboard!"
