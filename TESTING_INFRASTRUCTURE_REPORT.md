# Testing Infrastructure Verification Report

**Date:** 2026-03-07  
**Project:** TDT Space (Electron + React Terminal App)

---

## 1. Current Testing Setup Status

### ❌ No Existing Test Files
- **Search Pattern:** `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.test.js`, `**/*.spec.js`
- **Result:** Zero test files found in the codebase
- **Implication:** No unit, integration, or E2E tests currently exist

### ❌ No Test Scripts in package.json
**Current scripts:**
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "build:electron": "tsc && vite build",
  "preview": "vite preview",
  "electron:start": "cross-env ELECTRON_IS_DEV=0 electron .",
  "electron:build": "bun run build && bun run package",
  "electron:only": "electron .",
  "package": "node scripts/package.js",
  "postinstall": "electron-builder install-app-deps"
}
```
**Missing:** `test`, `test:unit`, `test:e2e`, `test:coverage` scripts

### ❌ No Testing Libraries Installed
**Searched for:** vitest, jest, playwright, cypress, testing-library, mocha, chai, ava  
**Result:** None found in `node_modules` or `package.json`

**Current devDependencies:**
```json
{
  "@types/node": "^25.3.5",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^5.1.4",
  "concurrently": "^9.2.1",
  "cross-env": "^10.1.0",
  "electron": "^40.8.0",
  "electron-builder": "^26.8.1",
  "typescript": "~5.9.3",
  "vite": "^7.3.1",
  "vite-plugin-electron": "^0.29.0",
  "vite-plugin-electron-renderer": "^0.14.6",
  "wait-on": "^9.0.4"
}
```

### ✅ Build System Verified
**Build Status:** ✅ Working
```bash
$ bun run build
✓ 80 modules transformed (React app)
✓ 273 modules transformed (Electron main)
✓ 5 modules transformed (Electron preload)
✓ built in 2.77s
```

**Dev Mode:** Can be started with `bun run dev` (Vite dev server on port 5173)

### ❌ No Memory Profiling Tools
**Searched for:**
- `performance.memory` API usage
- `process.memoryUsage()` calls
- `console.profile()` / `console.profileEnd()`
- Heap snapshot scripts
- Memory profiling utilities

**Result:** No memory profiling infrastructure found

**Note:** The research document (`XTERM_OPTIMIZATION_RESEARCH.md`) contains extensive memory optimization best practices, but no implementation exists yet.

---

## 2. Recommended Testing Approach for Optimization Mission

### 🎯 Primary Recommendation: **Vitest + Playwright**

#### Why This Stack?
1. **Vitest** - Best for React + Vite projects
   - Native Vite integration (uses same config)
   - Fast HMR-powered tests
   - ESM support out-of-the-box
   - Built-in coverage reporting
   - Compatible with React 19

2. **Playwright** - Best for Electron E2E testing
   - Official Electron support
   - Cross-browser testing capability
   - Built-in tracing and performance profiling
   - Memory leak detection via traces
   - Can test IPC, PTY processes, terminal rendering

3. **@testing-library/react** - For component testing
   - Best practices for React component testing
   - Accessibility-focused queries
   - Works seamlessly with Vitest

---

### 📋 Testing Strategy Breakdown

#### **Layer 1: Unit Tests (Vitest)**
**Target:** Utilities, stores, services, IPC handlers

**Example Structure:**
```typescript
// src/stores/__tests__/workspaceStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { workspaceStore } from '../workspaceStore';

describe('workspaceStore', () => {
  beforeEach(() => {
    workspaceStore.clear(); // Reset state
  });

  it('should create new workspace with correct layout', () => {
    workspaceStore.createWorkspace('2x2', 'Test Workspace');
    const state = workspaceStore.getState();
    expect(state.workspaces).toHaveLength(1);
    expect(state.currentWorkspace).toEqual(expect.objectContaining({
      name: 'Test Workspace',
      layout: '2x2'
    }));
  });

  it('should assign agent to terminal', () => {
    // Test agent assignment logic
  });
});
```

**Files to Test:**
- `src/stores/*.ts` - Zustand stores (workspace, template, settings, terminalHistory)
- `src/services/*.ts` - Business logic (terminal.service.ts, workspace.service.ts)
- `src/utils/*.ts` - Utility functions
- `src/lib/*.ts` - Low-level utilities (logger, debounce, platform)
- `src/electron/ipc/*.ts` - IPC handlers (mock IPC layer)

---

#### **Layer 2: Component Tests (Vitest + React Testing Library)**
**Target:** React components (TerminalGrid, TerminalCell, WorkspaceTabBar, etc.)

**Example Structure:**
```typescript
// src/components/terminals/__tests__/TerminalCell.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TerminalCell from '../TerminalCell';

describe('TerminalCell', () => {
  it('should render terminal container', () => {
    const mockTerminal = { id: 1, agent: 'claude-code' };
    render(<TerminalCell terminal={mockTerminal} />);
    expect(screen.getByTestId('terminal-container')).toBeInTheDocument();
  });

  it('should call onAgentChange when dropdown changes', () => {
    const mockOnChange = vi.fn();
    render(<TerminalCell terminal={{ id: 1 }} onAgentChange={mockOnChange} />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'opencode' }
    });
    expect(mockOnChange).toHaveBeenCalledWith(1, 'opencode');
  });
});
```

**Files to Test:**
- `src/components/terminals/*.tsx` - Terminal rendering components
- `src/components/workspaces/*.tsx` - Workspace UI components
- `src/components/agents/*.tsx` - Agent selection components
- `src/components/modals/*.tsx` - Modal dialogs

---

#### **Layer 3: E2E Tests (Playwright for Electron)**
**Target:** Full application workflows, IPC communication, PTY spawning

**Example Structure:**
```typescript
// tests/e2e/workspace-creation.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';

test('should create new workspace with 2x2 layout', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  
  // Click "New Workspace" button
  await window.click('[data-testid="new-workspace-btn"]');
  
  // Select 2x2 layout
  await window.click('[data-testid="layout-2x2"]');
  
  // Verify 4 terminal panes created
  const terminals = await window.locator('[data-testid="terminal-cell"]').all();
  expect(terminals).toHaveLength(4);
  
  await app.close();
});

test('should spawn PTY process when agent is allocated', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  
  // Allocate Claude Code agent
  await window.selectOption('[data-testid="agent-select-0"]', 'claude-code');
  
  // Verify PTY process spawned (check via IPC or process list)
  const processInfo = await window.evaluate(() => {
    return window.electronAPI.getProcessInfo(0);
  });
  expect(processInfo.pid).toBeDefined();
  
  await app.close();
});
```

**Test Scenarios:**
1. Workspace creation and switching
2. Terminal spawning and disposal
3. Agent allocation and command execution
4. Resize operations (debounced)
5. Memory leak detection (long-running sessions)
6. PTY process cleanup on app quit

---

#### **Layer 4: Performance & Memory Tests**
**Target:** xterm.js rendering, PTY process management, IPC performance

**Implementation:**
```typescript
// tests/performance/memory-leak.spec.ts
import { test, expect } from 'vitest';
import { workspaceStore } from '../../src/stores/workspaceStore';

test('should not leak memory when creating/destroying terminals', async () => {
  const initialMemory = process.memoryUsage();
  
  // Create and destroy 100 terminals
  for (let i = 0; i < 100; i++) {
    const terminal = createTerminal();
    await terminal.dispose();
  }
  
  // Force garbage collection
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage();
  const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  
  // Memory growth should be < 10MB
  expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
});

test('should cleanup PTY processes on app quit', async () => {
  // Spawn multiple terminals
  // Close app
  // Verify no orphaned processes remain
});
```

---

### 📦 Required Dependencies

Add to `package.json`:

```json
{
  "devDependencies": {
    // Testing Framework
    "vitest": "^2.0.0",
    "@playwright/test": "^1.45.0",
    
    // React Testing
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    
    // Type Definitions
    "@types/testing-library__react": "^10.2.0",
    "@types/testing-library__jest-dom": "^6.0.0"
  }
}
```

---

### ⚙️ Configuration Files Needed

#### 1. `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    },
    clearMocks: true,
    restoreMocks: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### 2. `playwright.config.ts`
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    electronApp: {
      args: ['.'],
      env: { ELECTRON_IS_DEV: '0' }
    }
  },
  reporter: [['html'], ['json', { outputFile: 'test-results.json' }]]
});
```

#### 3. `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IPC calls
vi.mock('../electron/ipc', () => ({
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn()
  }
}));

// Mock node-pty
vi.mock('node-pty', () => ({
  spawn: vi.fn(() => ({
    pid: 12345,
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    onExit: vi.fn(),
    onData: vi.fn()
  }))
}));
```

---

### 📝 Updated package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "vitest && playwright test",
    "electron:start": "cross-env ELECTRON_IS_DEV=0 electron ."
  }
}
```

---

## 3. Setup Needed Before Starting Implementation

### ✅ Phase 1: Testing Infrastructure Setup (Priority: HIGH)

**Step 1: Install Dependencies**
```bash
bun add -d vitest @playwright/test @testing-library/react @testing-library/jest-dom @testing-library/user-event
bunx playwright install  # Install browser binaries
bunx playwright install-deps  # Install system dependencies (Linux only)
```

**Step 2: Create Configuration Files**
- `vitest.config.ts`
- `playwright.config.ts`
- `src/test/setup.ts`
- `.gitignore` update (add `test-results/`, `coverage/`)

**Step 3: Update package.json**
- Add test scripts (see above)
- Add `"test: true"` to tsconfig.json compilerOptions (if needed)

**Step 4: Create Test Directory Structure**
```
src/
  components/
    terminals/__tests__/
    workspaces/__tests__/
    agents/__tests__/
  stores/__tests__/
  services/__tests__/
  utils/__tests__/
tests/
  e2e/
    workspace.spec.ts
    terminal.spec.ts
    agent.spec.ts
  performance/
    memory.spec.ts
    rendering.spec.ts
```

**Estimated Time:** 2-3 hours

---

### ✅ Phase 2: Memory Profiling Setup (Priority: MEDIUM)

**Step 1: Add Memory Monitoring Utilities**

Create `src/lib/memoryProfiler.ts`:
```typescript
import { ipcMain, BrowserWindow } from 'electron';

export class MemoryProfiler {
  private static snapshots: MemorySnapshot[] = [];
  
  static takeSnapshot(label: string) {
    const snapshot: MemorySnapshot = {
      label,
      timestamp: Date.now(),
      ...process.getProcessMemoryInfo(),
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal
    };
    
    this.snapshots.push(snapshot);
    console.log(`[Memory] ${label}: ${Math.round(snapshot.heapUsed / 1024 / 1024)}MB`);
    
    return snapshot;
  }
  
  static compareSnapshots(label1: string, label2: string) {
    const s1 = this.snapshots.find(s => s.label === label1);
    const s2 = this.snapshots.find(s => s.label === label2);
    
    if (!s1 || !s2) return null;
    
    return {
      heapGrowth: s2.heapUsed - s1.heapUsed,
      timeDiff: s2.timestamp - s1.timestamp
    };
  }
  
  static async getRendererMemory(window: BrowserWindow) {
    return window.webContents.getProcessMemoryInfo();
  }
}

interface MemorySnapshot {
  label: string;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  private: number;
  shared: number;
}

// IPC handlers for renderer memory queries
ipcMain.handle('get-memory-info', () => {
  return {
    main: process.memoryUsage(),
    process: process.getProcessMemoryInfo()
  };
});
```

**Step 2: Add Memory Profiling to Dev Mode**

Update `src/electron/main.ts`:
```typescript
// Enable memory profiling in dev mode
if (process.env.MEMORY_PROFILING === 'true') {
  setInterval(() => {
    const mem = process.memoryUsage();
    console.log('[Memory]', {
      rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
      heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB'
    });
  }, 10000); // Log every 10 seconds
}
```

**Step 3: Create Performance Test Suite**

Create `tests/performance/memory-leak.spec.ts`:
```typescript
import { test, expect } from 'vitest';

test('terminal disposal should not leak memory', async () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Create and dispose 50 terminals
  for (let i = 0; i < 50; i++) {
    const terminal = await createTestTerminal();
    await terminal.dispose();
  }
  
  // Force GC
  if (global.gc) global.gc();
  
  const finalMemory = process.memoryUsage().heapUsed;
  const growthMB = (finalMemory - initialMemory) / 1024 / 1024;
  
  // Should not grow more than 20MB
  expect(growthMB).toBeLessThan(20);
});
```

**Step 4: Add Playwright Tracing for E2E**

Update `playwright.config.ts`:
```typescript
use: {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure'
}
```

**Estimated Time:** 3-4 hours

---

### ✅ Phase 3: Write Core Tests (Priority: HIGH)

**Critical Tests to Write First:**

1. **Terminal Lifecycle Tests**
   - Terminal creation and disposal
   - PTY process spawning and cleanup
   - Event listener cleanup (no memory leaks)

2. **Workspace Management Tests**
   - Workspace CRUD operations
   - Layout template management
   - Agent assignment persistence

3. **IPC Handler Tests**
   - Terminal write/resize/kill commands
   - Workspace switching
   - Error handling

4. **Component Tests**
   - TerminalCell rendering
   - WorkspaceTabBar switching
   - SettingsModal updates

**Estimated Time:** 8-12 hours for comprehensive coverage

---

## 4. Summary & Next Steps

### Current State
- ❌ No existing tests
- ❌ No test infrastructure
- ❌ No test scripts
- ❌ No memory profiling tools
- ✅ Build system working
- ✅ Dev mode functional

### Recommended Stack
- **Unit/Component Tests:** Vitest + React Testing Library
- **E2E Tests:** Playwright for Electron
- **Memory Profiling:** Custom utilities + Playwright traces

### Setup Steps
1. Install testing dependencies (vitest, playwright, testing-library)
2. Create config files (vitest.config.ts, playwright.config.ts)
3. Add test scripts to package.json
4. Create test directory structure
5. Write core tests for terminal lifecycle and workspace management
6. Implement memory profiling utilities
7. Add performance regression tests

### Estimated Total Setup Time
- **Infrastructure:** 2-3 hours
- **Memory Profiling:** 3-4 hours
- **Core Tests:** 8-12 hours
- **Total:** ~15-20 hours

---

**Files to Create:**
1. `vitest.config.ts`
2. `playwright.config.ts`
3. `src/test/setup.ts`
4. `src/lib/memoryProfiler.ts`
5. `tests/e2e/*.spec.ts`
6. `tests/performance/*.spec.ts`
7. Multiple `**/__tests__/*.test.{ts,tsx}` files

**Files to Modify:**
1. `package.json` - Add test scripts and dependencies
2. `src/electron/main.ts` - Add memory profiling hooks
3. `.gitignore` - Add test output directories

---

**Report Generated:** 2026-03-07  
**By:** Worker Droid (Factory AI Agent)
