# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Start Vite dev server (React + Electron)
bun run build            # Build React app and Electron main process
bun run electron:start   # Run Electron app in development mode
bun run electron:build   # Build and package production app
bun run package          # Package app with ASAR bundling
```

## Architecture

**TDT Space** is an Electron desktop application providing a grid-based terminal workspace for running multiple AI coding agents in parallel.

### Tech Stack
- **Framework**: Electron (main process) + React 19 (renderer)
- **Build**: Vite with `vite-plugin-electron` and `vite-plugin-electron-renderer`
- **State**: Zustand stores
- **Terminal**: node-pty + xterm.js (+addons: fit, search, web-links, webgl)
- **Storage**: electron-store (persistent settings)
- **Package Manager**: Bun
- **Language**: TypeScript (strict mode, path alias `@/` → `src/`)

### Architectural Overview

The codebase follows a **modular, domain-based architecture** with clear separation of concerns:

```
src/
├── electron/
│   ├── main.ts              # Entry point, window creation, app lifecycle
│   ├── preload.cjs          # Context bridge (contextIsolation: true)
│   ├── terminal.ts          # PTY utilities
│   └── ipc/                 # IPC handlers organized by domain
│       ├── terminal.handlers.ts       # Spawn, write, kill, resize
│       ├── workspace.handlers.ts      # CRUD, switch, patch validation
│       ├── template.handlers.ts       # Template CRUD
│       ├── store.handlers.ts          # electron-store access
│       ├── window.handlers.ts         # Minimize, maximize, close
│       ├── system.handlers.ts         # Platform, version, cwd
│       ├── terminal-history.handlers.ts
│       └── vietnamese-ime.handlers.ts # IME patch management
├── components/              # React UI (domain-organized)
│   ├── agents/              # AgentAllocationSlider, AgentInstallGuide, etc.
│   ├── modals/              # SettingsModal, CustomTemplateModal, etc.
│   ├── terminals/           # TerminalCell, TerminalGrid, TerminalSearch, etc.
│   ├── workspaces/          # WorkspaceTabBar, LayoutSelector, etc.
│   ├── ui/                  # TitleBar, ScrollToBottomButton
│   └── index.ts             # Barrel exports
├── config/                  # Centralized configuration
│   ├── agents.ts            # Agent command configs (claude, opencode, droid)
│   ├── templates.ts         # Default layout templates
│   ├── constants.ts         # IPC channels, shortcuts, storage keys
│   └── index.ts
├── hooks/                   # Custom React hooks
│   ├── useTerminal.ts       # Terminal lifecycle, xterm.js setup
│   ├── useTerminalSearch.ts # Search addon integration
│   ├── useWorkspaceNavigation.ts  # Workspace cycling helpers
│   ├── useCommandHistory.ts
│   └── index.ts
├── lib/                     # Low-level utilities
│   ├── logger.ts            # Centralized logging (debug/info/warn/error)
│   ├── debounce.ts          # Debounce helper
│   ├── platform.ts          # Platform detection
│   └── index.ts
├── services/                # Business logic layer (renderer-side)
│   ├── terminal.service.ts  # TerminalService singleton (spawn, write, kill)
│   └── workspace.service.ts
├── stores/                  # Zustand state management
│   ├── workspaceStore.ts    # Workspace CRUD, terminals, agent assignments
│   ├── templateStore.ts     # Layout template management
│   ├── settingsStore.ts     # App settings (theme, terminal options)
│   └── terminalHistoryStore.ts
├── types/                   # TypeScript definitions (domain-specific)
│   ├── agent.ts             # AgentConfig, AgentType, AgentSpawnOptions
│   ├── ipc.ts               # IPC request/response types
│   ├── terminal.ts          # TerminalPane, TerminalStatus
│   ├── workspace.ts         # WorkspaceState, WorkspaceLayout
│   ├── workspace.agents.ts  # Agent-related workspace types
│   └── electron.d.ts        # Electron API type declarations
└── utils/                   # Helper utilities
    ├── storage.ts           # electron-store wrappers
    ├── shortcuts.ts         # Keyboard shortcut utilities
    ├── version.ts           # App version helper
    └── vietnameseImePatch.ts # Vietnamese IME patch for Claude Code
```

### Key Architectural Patterns

**1. Domain-Based Organization**
- Components organized by feature domain (agents, terminals, workspaces, modals)
- Type definitions mirror domain structure
- IPC handlers separated by domain concern

**2. Service Layer Pattern**
- `TerminalService` singleton encapsulates terminal operations
- Business logic separated from UI components
- Service methods handle electronAPI communication

**3. Centralized Configuration**
- All constants in `config/constants.ts` (IPC channels, shortcuts, storage keys)
- Agent commands configured in `config/agents.ts`
- Layout templates in `config/templates.ts`

**4. Centralized Logging**
- `Logger` class with levels (debug, info, warn, error)
- Child loggers with prefix chaining (e.g., `[Main]`, `[IPC:Terminal]`)
- Timestamp-based logging for debugging

**5. Type-Safe IPC**
- All IPC channels defined as constants
- Request/response types in `types/ipc.ts`
- Context isolation enabled for security

### Terminal Lifecycle

**Spawn Flow**:
1. Renderer: `TerminalService.spawnTerminal()` or `spawnTerminalWithAgent()`
2. IPC: `spawn-terminal` or `spawn-terminal-with-agent` handler
3. Main: `pty.spawn()` with PowerShell (Win) or bash (Unix)
4. Data: `ptyProcess.onData()` → `terminal-data` IPC event → xterm.js

**Cleanup Flow**:
1. Workspace switch or app quit triggers cleanup
2. `cleanupAllTerminals()` kills all PTY processes
3. Windows: `taskkill /f /t` for process tree killing
4. Unix: `ptyProcess.kill()`

**Agent Integration**:
- Supported agents: `claude-code`, `opencode`, `droid`, `gemini-cli`, `aider`, etc.
- Agent commands configured per-terminal in workspace state
- Auto-patch system for Vietnamese IME support in Claude Code

### State Management

**Zustand Stores**:
- `workspaceStore`: Active workspace, terminal list, agent assignments, theme
- `templateStore`: User-saved layout templates
- `settingsStore`: Terminal preferences (font, colors, scrollback)
- `terminalHistoryStore`: Command history per terminal

**Persistence**:
- All stores synced to electron-store with debounced saves (300ms)
- Workspace changes trigger immediate save for critical operations (delete)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+N` | Create new workspace |
| `Ctrl+Tab` | Cycle to next workspace (modal preview) |
| `Ctrl+Shift+Tab` | Cycle to previous workspace |
| `Ctrl+PageUp` | Previous workspace |
| `Ctrl+PageDown` | Next workspace |
| `Ctrl+T` | Next terminal (or `Ctrl+1-9` for specific) |
| `Ctrl+Shift+T` | Previous terminal |
| `Alt+1-9` | Switch to workspace by index |
| `Ctrl+,` | Open Settings |

### Build Configuration

**vite.config.ts**:
- Custom plugin copies `preload.cjs` directly (bypasses Vite transform)
- Electron main process: CJS format, outputs to `dist-electron/main/`
- React renderer: ESM, outputs to `dist/`

**package.js**:
- ASAR bundling for production
- Unpacks `node-pty` and `@xterm` (native modules)
- Outputs to `release/win-unpacked-<timestamp>/`

### Platform Notes
- Windows-only (Shell: PowerShell with `-NoLogo -NoExit`)
- GPU features disabled for compatibility
- Vietnamese IME patch system for Claude Code CLI
