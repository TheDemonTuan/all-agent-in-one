# Release Notes - TDT Space v0.1.0

## 🎉 Initial Release

Welcome to TDT Space - Multi-Agent Terminal for TDT Vibe Coding!

### ✨ Key Features

- **🖥️ Grid Terminal Layout**: Split your workspace into multiple terminal panes (1x1, 2x1, 2x2, 3x2, 4x4)
- **🤖 Multi-Agent Support**: Run Claude Code, OpenCode, Droid, and other AI agents in parallel
- **💾 Workspace Management**: Save and switch between multiple workspace configurations
- **🎨 Custom Templates**: Create and reuse custom workspace templates
- **🔍 Terminal Search**: Search through terminal history
- **⌨️ Command History**: Track and reuse previous commands
- **📦 Agent Allocation**: Assign specific agents to each terminal pane

### 📦 Installation

#### Windows (Pre-built)
1. Download `TDT-Space-v0.1.0-win.zip`
2. Extract to your desired location
3. Run `TDT Space.exe`

#### Build from Source
```bash
git clone https://github.com/TheDemonTuan/all-agent-in-one.git
cd all-agent-in-one
bun install
bun run electron:build
```

### 📋 System Requirements

- **OS**: Windows 10/11 (64-bit)
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB free space
- **Node.js**: v18+ (for building from source)
- **Bun**: v1.0+ (package manager)

### 🔧 Tech Stack

- Electron 34.5.8
- React 19.2.4
- TypeScript 5.9.3
- Vite 7.3.1
- xterm.js 6.0.0
- node-pty 1.1.0

### 📝 Documentation

- [README](https://github.com/TheDemonTuan/all-agent-in-one/blob/main/README.md) - Full documentation
- [Installation Guide](https://github.com/TheDemonTuan/all-agent-in-one/blob/main/INSTALLATION.md) - Detailed setup instructions
- [Contributing Guide](https://github.com/TheDemonTuan/all-agent-in-one/blob/main/CONTRIBUTING.md) - How to contribute

### 🐛 Known Issues

- GPU acceleration may cause rendering issues on some systems (disabled by default)
- First launch may take longer due to initial setup

### 📚 What's Next?

Planned for v0.2.0:
- Terminal pane resizing
- Custom themes
- Command palette
- Better agent integration
- Keyboard shortcuts customization

### 🙏 Acknowledgments

Thanks to all the open-source libraries and contributors that made this project possible!

---

**Full Changelog**: https://github.com/TheDemonTuan/all-agent-in-one/blob/main/CHANGELOG.md

**Download**: Click the asset below to download `TDT-Space-v0.1.0-win.zip` (10.6 MB)
