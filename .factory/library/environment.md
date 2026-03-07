# Environment

Environment variables, external dependencies, and setup notes for TDT Space optimization mission.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Platform

**Target Platform:** Windows 10/11
- Shell: PowerShell
- Process killing: `taskkill /pid /f /t` for complete process tree termination
- GPU acceleration: Disabled in Electron (per vite.config.ts)

## Dependencies

### Core
- **Electron**: Desktop framework
- **React 19**: UI framework
- **node-pty**: PTY process spawning
- **xterm.js**: Terminal rendering
- **Zustand**: State management
- **electron-store**: Persistent storage

### Testing (to be installed)
- **Vitest**: Unit/component testing
- **Playwright**: E2E testing
- **React Testing Library**: Component testing
- **@xterm/addon-webgl**: WebGL renderer for xterm.js

## Environment Variables

No special environment variables required for this mission.

## External Dependencies

None. This is a standalone desktop application.

## Platform-Specific Notes

### Windows
- Use `taskkill /pid /f /t` instead of `pty.kill()` for complete process tree termination
- PowerShell is the default shell for terminal spawning
- GPU features disabled in Electron for compatibility

### Process Monitoring
- Use Task Manager or Process Monitor (ProcMon) to verify process cleanup
- Look for orphaned `conhost.exe` or `OpenConsole.exe` processes

## Memory Profiling

### Chrome DevTools
1. Open app in dev mode
2. Press F12 or Ctrl+Shift+I
3. Go to Memory panel
4. Take heap snapshots before/after operations
5. Compare retained size and object counts

### Built-in Memory Profiler (to be implemented)
- `MemoryProfiler.takeSnapshot()` - Capture heap state
- `MemoryProfiler.compareSnapshots()` - Compare two snapshots
- Dev mode logging every 10 seconds

## Known Issues (Pre-Mission)

1. **Workspace switch leak** - Terminals not killed when switching
2. **Event listener accumulation** - IPC listeners not removed
3. **xterm.js disposal** - Event handlers not cleaned up
4. **Resize spam** - No debouncing on resize operations
5. **Unbounded scrollback** - Memory grows with terminal output
6. **Process orphaning** - Child processes not killed on Windows

---

**Last Updated:** 2026-03-07
**Mission:** Memory Leak Fixes & Performance Optimization
