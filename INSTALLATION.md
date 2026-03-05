# Installation Guide - TDT Space

## Quick Start for Windows

### Option 1: Pre-built Executable (Recommended)

1. **Download Release**
   - Go to [Releases page](https://github.com/TheDemonTuan/all-agent-in-one/releases)
   - Download the latest `TDT-Space-vX.X.X-win.zip`
   - Extract to a folder (e.g., `C:\Programs\TDT Space`)

2. **Run Application**
   - Double-click `TDT Space.exe`
   - Application will launch immediately

3. **Create Desktop Shortcut** (Optional)
   - Right-click `TDT Space.exe`
   - Select "Send to" → "Desktop (create shortcut)"

---

### Option 2: Build from Source

#### Prerequisites

1. **Install Node.js**
   - Download from: https://nodejs.org/
   - Choose LTS version (recommended)
   - Run installer and follow prompts

2. **Install Bun**
   ```powershell
   # PowerShell (Admin)
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```
   
   Or manually:
   - Download from: https://bun.sh/
   - Follow installation instructions

3. **Verify Installation**
   ```bash
   node --version  # Should show v18+ 
   bun --version   # Should show v1.0+
   ```

#### Build Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/TheDemonTuan/all-agent-in-one.git
   cd all-agent-in-one
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Build Application**
   ```bash
   bun run electron:build
   ```

4. **Run Application**
   - Executable will be in `release/win-unpacked/TDT Space.exe`
   - Double-click to run

---

## Configuration

### First Launch

On first launch, you'll see:

1. **Welcome Screen** - Click "Create Workspace"
2. **Layout Selector** - Choose your terminal grid (start with 2x1 or 2x2)
3. **Workspace Name** - Enter a name (e.g., "Default", "Coding")

### Setting Up AI Agents

TDT Space supports multiple AI coding agents. Configure each agent:

1. **Claude Code**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **OpenCode**
   ```bash
   npm install -g opencode-ai
   ```

3. **Droid**
   - Follow installation guide from official Droid repository

### Customizing Settings

Access settings via gear icon (⚙️) in title bar:

- **Terminal**: Font size, theme, scrollback lines
- **Agents**: Configure commands for each agent
- **Workspace**: Auto-save interval, default layout

---

## Troubleshooting

### Common Issues

#### "Application won't start"
- Ensure Windows Defender isn't blocking the app
- Right-click `.exe` → Properties → Check "Unblock"
- Run as Administrator if needed

#### "Terminal doesn't render properly"
- Update graphics drivers
- Try different terminal themes in settings
- Disable GPU acceleration in settings

#### "Agent commands not working"
- Verify agent is installed globally: `claude-code --version`
- Check agent path in Settings → Agents
- Restart TDT Space after installing new agents

#### "Workspaces not saving"
- Check write permissions in installation folder
- Try running as Administrator once
- Check `electron-store` data in `%APPDATA%\TDT Space`

### Logs

Application logs are stored in:
```
%APPDATA%\TDT Space\logs\
```

To enable debug mode:
1. Open Settings
2. Enable "Debug Mode"
3. Restart application

---

## Uninstallation

### Pre-built Version
1. Delete the installation folder
2. Remove desktop shortcut (if created)
3. Clear app data: `%APPDATA%\TDT Space\`

### Source Build
```bash
# Delete project folder
cd ..
rmdir /s all-agent-in-one

# Clear app data
del /s /q %APPDATA%\TDT Space
```

---

## Updates

### Pre-built Version
- Download latest release from GitHub
- Replace old installation folder
- Your workspaces will be preserved in `%APPDATA%`

### Source Build
```bash
git pull origin main
bun install
bun run electron:build
```

---

## Support

Need help? 

- 📖 Read the [README.md](README.md) for usage guide
- 🐛 Report issues on [GitHub Issues](https://github.com/TheDemonTuan/all-agent-in-one/issues)
- 💬 Ask questions in [GitHub Discussions](https://github.com/TheDemonTuan/all-agent-in-one/discussions)

---

**Happy Coding! 🚀**
