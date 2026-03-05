# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Add support for custom terminal themes
- Add command palette with fuzzy search
- Add keyboard shortcuts customization
- Add notifications for long-running commands
- Add split pane resizing
- Add terminal tabs within each pane

---

## [0.1.0] - 2026-03-06

### ✨ Added
- **Multi-Agent Terminal System**
  - Run multiple AI coding agents in parallel
  - Support for Claude Code, OpenCode, Droid, and more
  - Agent allocation per terminal pane

- **Grid Terminal Layout**
  - Configurable grid layouts: 1x1, 2x1, 2x2, 3x2, 4x4
  - Flexible terminal pane arrangement
  - xterm.js-based terminal rendering

- **Workspace Management**
  - Create, save, and switch between workspaces
  - Workspace templates (built-in and custom)
  - Automatic workspace persistence

- **Terminal Features**
  - Full terminal emulation with node-pty
  - Command history tracking
  - Terminal search functionality
  - Scroll-to-bottom button
  - Mouse support for links and selection

- **UI Components**
  - Custom title bar with window controls
  - Workspace tab bar with visual indicators
  - Layout selector with preview
  - Settings modal
  - Template selector
  - Agent allocation slider
  - Context menu for terminal panes

- **State Management**
  - Zustand-based state management
  - Debounced persistence to electron-store
  - Workspace-terminal binding for cleanup

- **Developer Experience**
  - TypeScript strict mode
  - Hot reload in development
  - Vite-based build system
  - Custom electron build pipeline

### 🔧 Technical
- Electron 34.5.8
- React 19.2.4
- TypeScript 5.9.3
- Vite 7.3.1
- xterm.js 6.0.0
- node-pty 1.1.0
- Zustand 4.5.0
- electron-store 8.2.0

### 📦 Build
- Custom packaging script for Windows
- electron-builder integration
- Automated build process with `bun run electron:build`

### 📝 Documentation
- Comprehensive README.md
- Installation guide
- Release guide
- Changelog

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2026-03-06 | Initial Release |

---

## Upcoming Releases

### v0.2.0 (Planned)
- Terminal pane resizing
- Custom themes
- Command palette
- Better agent integration

### v1.0.0 (Planned)
- Stable release
- Cross-platform support (macOS, Linux)
- Plugin system
- Cloud sync for workspaces

---

## Contributing

To contribute to this changelog:
1. Add your changes under [Unreleased] section
2. Use appropriate categories: Added, Changed, Deprecated, Removed, Fixed, Security
3. Keep descriptions concise but informative

For more info, see [Keep a Changelog](https://keepachangelog.com/).
