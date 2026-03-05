# TDT Space Release Build Guide

## Creating a Release

### Automated Build (Recommended)

```bash
# 1. Ensure all changes are committed
git status

# 2. Build the application
bun run electron:build

# 3. The release will be in: release/win-unpacked/
```

### Manual Packaging

If you want to create a distributable ZIP:

```bash
# Using PowerShell
Compress-Archive -Path release\win-unpacked\* -DestinationPath TDT-Space-v0.1.0-win.zip -Force
```

Or using 7-Zip:
```bash
"C:\Program Files\7-Zip\7z.exe" a -tzip TDT-Space-v0.1.0-win.zip .\release\win-unpacked\*
```

---

## Release Checklist

Before creating a release:

- [ ] Update version in `package.json`
- [ ] Update version in README.md badges
- [ ] Test application on clean Windows installation
- [ ] Verify all features work correctly
- [ ] Build release package
- [ ] Create ZIP archive
- [ ] Write release notes
- [ ] Create GitHub Release

---

## Creating GitHub Release

### Using GitHub CLI

```bash
# Install gh CLI first: https://cli.github.com/

# 1. Create and push tag
git tag -a v0.1.0 -m "Release v0.1.0 - Initial Release"
git push origin v0.1.0

# 2. Create release with ZIP
gh release create v0.1.0 \
  --title "TDT Space v0.1.0" \
  --notes "See CHANGELOG.md for details" \
  --generate-notes \
  TDT-Space-v0.1.0-win.zip
```

### Using GitHub Web Interface

1. **Go to Releases**
   - Navigate to: https://github.com/TheDemonTuan/all-agent-in-one/releases
   - Click "Draft a new release"

2. **Create Tag**
   - Click "Choose a tag"
   - Enter: `v0.1.0`
   - Click "Create new tag"

3. **Release Title**
   - Enter: `TDT Space v0.1.0`

4. **Release Notes**
   ```markdown
   ## 🎉 Initial Release

   ### Features
   - Multi-Agent Terminal Support
   - Grid Layout System (1x1 to 4x4)
   - Workspace Management
   - Custom Templates
   - Terminal Search & History
   - Agent Allocation per Pane

   ### Installation
   1. Download `TDT-Space-v0.1.0-win.zip`
   2. Extract to desired location
   3. Run `TDT Space.exe`

   ### Known Issues
   - [List any known issues]

   ### What's Changed
   - Initial release of TDT Space
   ```

5. **Upload Binary**
   - Drag & drop `TDT-Space-v0.1.0-win.zip`
   - Or click to browse and select
   - Wait for upload to complete

6. **Publish**
   - Select "Set as the latest release"
   - Click "Publish release"

---

## Release Notes Template

```markdown
## 🚀 What's New

[Describe major new features and improvements]

## 🐛 Bug Fixes

[List bug fixes]

## ⚠️ Breaking Changes

[List any breaking changes]

## 📦 Installation

### Windows
1. Download `TDT-Space-vX.X.X-win.zip`
2. Extract to desired location
3. Run `TDT Space.exe`

### Build from Source
```bash
git clone https://github.com/TheDemonTuan/all-agent-in-one.git
cd all-agent-in-one
bun install
bun run electron:build
```

## 🔧 Technical Details

- Electron: [version]
- Node.js: [version]
- Build Date: [date]

## 🙏 Thanks

Thanks to all contributors!
```

---

## Automating Releases (CI/CD)

For future releases, consider setting up GitHub Actions:

`.github/workflows/release.yml`:
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install Dependencies
        run: bun install
      
      - name: Build Application
        run: bun run electron:build
      
      - name: Create ZIP
        run: |
          Compress-Archive -Path release\win-unpacked\* -DestinationPath TDT-Space-${{ github.ref_name }}-win.zip
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: TDT-Space-${{ github.ref_name }}-win.zip
          generate_release_notes: true
```

---

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Examples:
- `v0.1.0` - Initial beta release
- `v1.0.0` - First stable release
- `v1.1.0` - New features
- `v1.1.1` - Bug fixes

---

## Support

For release-related questions:
- 📧 Create issue on GitHub
- 💬 GitHub Discussions

---

**Happy Releasing! 🎉**
