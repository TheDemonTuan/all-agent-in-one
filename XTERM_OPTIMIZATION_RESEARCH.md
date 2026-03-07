# Electron + xterm.js Optimization Research

## Executive Summary

This document compiles best practices for optimizing Electron applications using xterm.js and node-pty, based on official documentation, GitHub issues, and community resources as of 2025-2026.

---

## 1. xterm.js Optimization

### 1.1 Proper Disposal Patterns

**Key Findings:**
- **`.dispose()` is a trapdoor function** - Once called, it detaches from DOM, removes event listeners, AND overwrites the `.write()` method, rendering terminal unusable (Issue #3939)
- **Event disposal improvements** (PR #3919, merged v5.0.0): Register disposables for all terminal components including WebGL cursor blinking
- **Memory leak prevention** (PR #3916): Replace terminal references with immutable IDs in atlas cache to enable garbage collection
- **API facades leak memory** (Issue #4645, fixed Aug 2023): `BufferNamespaceApi` must be disposable to prevent persistent event listeners

**Best Practices:**
```typescript
// ✅ CORRECT: Store terminal ref and dispose properly
const terminalRef = useRef<Terminal | null>(null);

useEffect(() => {
  const term = new Terminal(options);
  terminalRef.current = term;
  
  return () => {
    // Dispose all addons first
    fitAddon?.dispose();
    webglAddon?.dispose();
    // Then dispose terminal
    term.dispose();
    terminalRef.current = null;
  };
}, []);

// ❌ WRONG: Don't call dispose() if you need to reuse terminal
```

### 1.2 Buffer Management (Scrollback Limits)

**Configuration:**
```typescript
const options: ITerminalOptions = {
  scrollback: 1000,  // Limit scrollback to prevent memory bloat
  // Avoid: scrollback: 9999999 (causes excessive memory usage)
}
```

**Best Practices:**
- Set reasonable scrollback limits (1000-5000 lines typical)
- Avoid "infinite" scrollback which causes memory issues
- Use `terminal.clear()` to clear buffer when needed
- Consider clearing texture atlas periodically: `terminal.clearTextureAtlas()`

### 1.3 Renderer Optimization (Canvas vs DOM vs WebGL)

**Renderer Comparison (2025):**

| Renderer | Performance | Memory | Browser Support | Status |
|----------|-------------|--------|-----------------|--------|
| **WebGL2** (@xterm/addon-webgl) | ⭐⭐⭐⭐⭐ | Low | All modern browsers | **Recommended** |
| **Canvas** (@xterm/addon-canvas) | ⭐⭐⭐ | Medium | Universal | Fallback only |
| **DOM** | ⭐⭐ | High | Universal | Default, but slower |

**Key Points:**
- **WebGL2 is now default in VS Code** - Best performance, especially for large outputs
- **Canvas renderer being removed** in xterm.js v6.0.0 (Issue #4779) - WebGL2 supported everywhere including Safari
- **DOM renderer** made default temporarily (v5.0.0) but slower due to reflows/repaints
- **Faster DOM renderer** improvements merged (PR #4605) but still not matching WebGL

**Recommended Configuration:**
```typescript
import { Terminal } from '@xterm/xterm';
import { WebglAddon } from '@xterm/addon-webgl';

const term = new Terminal({
  rendererType: 'canvas', // Will use WebGL addon if loaded
  scrollback: 1000,
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4'
  }
});

// Load WebGL addon for hardware acceleration
const webglAddon = new WebglAddon();
term.loadAddon(webglAddon);
```

### 1.4 Memory-Efficient Themes and Styling

**Optimization Tips:**
- Use simple solid colors instead of complex gradients
- Avoid frequent theme changes (triggers renderer redraws)
- When changing theme, use object spread to trigger reactivity:
```typescript
// ✅ CORRECT
terminal.options.theme = { ...terminal.options.theme, background: '#000000' };

// ❌ WRONG - Won't trigger update due to reference comparison
const newTheme = terminal.options.theme;
newTheme.background = '#000000';
terminal.options.theme = newTheme;
```

### 1.5 Debouncing Resize Operations

**Official Recommendation** (xterm.js API docs):
> "It's best practice to debounce calls to resize, this will help ensure that the pty can respond to the resize event before another one occurs."

**Implementation:**
```typescript
// ✅ CORRECT: Debounced resize
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedResize = debounce((cols: number, rows: number) => {
  terminal.resize(cols, rows);
  ptyProcess?.resize({ cols, rows });
}, 150);

window.addEventListener('resize', () => {
  const dims = fitAddon.proposeDimensions();
  if (dims) {
    debouncedResize(dims.cols, dims.rows);
  }
});

// ✅ Alternative: Use ResizeObserver with debounce
const resizeObserver = new ResizeObserver(debounce(() => {
  fitAddon.fit();
}, 150));
resizeObserver.observe(containerElement);
```

**Key Points:**
- Debounce delay: 100-200ms recommended
- Prevents text loss during rapid resizing (Issue #3178)
- Ensures pty process can keep up with resize events
- `fitAddon.fit()` only works on visible terminals (Issue #3118)

---

## 2. node-pty Best Practices

### 2.1 Process Lifecycle Management

**Critical Update (2025):**
- **PR #755** (merged Jan 2025): Proper cleanup using `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` on Windows
- Automatically kills all associated processes when hosting process tears down
- Prevents leaked OpenConsole processes waiting on I/O

**Best Practices:**
```typescript
// ✅ CORRECT: Track and cleanup PTY processes
const ptyProcesses = new Map<number, IPty>();

const spawnTerminal = () => {
  const ptyProcess = pty.spawn({
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env as { [key: string]: string },
    useConpty: true  // Use modern ConPTY on Windows
  });
  
  ptyProcesses.set(ptyProcess.pid, ptyProcess);
  
  // Handle process exit
  ptyProcess.onExit(({ exitCode }) => {
    console.log(`Process exited with code ${exitCode}`);
    ptyProcesses.delete(ptyProcess.pid);
  });
  
  return ptyProcess;
};

// Cleanup on app quit
app.on('will-quit', () => {
  ptyProcesses.forEach((pty, pid) => {
    pty.kill();
  });
  ptyProcesses.clear();
});
```

### 2.2 Kill Signal Handling

**Windows-Specific Issues:**
- **Issue #437**: `pty.kill()` fails on Windows, leaving processes hanging
- **Issue #781** (May 2025): Use `taskkill.exe` for graceful termination
- **Issue #333**: Parent processes (winpty-agent.exe) don't exit automatically

**Recommended Pattern:**
```typescript
// ✅ CORRECT: Cross-platform kill with fallback
const killProcess = (ptyProcess: IPty) => {
  if (process.platform === 'win32') {
    // Use taskkill for complete process tree termination
    const { spawnSync } = require('child_process');
    spawnSync('taskkill', ['/pid', ptyProcess.pid.toString(), '/f', '/t']);
  } else {
    // Unix: Send SIGTERM then SIGKILL
    ptyProcess.kill('SIGTERM');
    setTimeout(() => {
      if (ptyProcess) {
        ptyProcess.kill('SIGKILL');
      }
    }, 1000);
  }
};
```

### 2.3 PTY Cleanup Patterns

**Avoiding Orphaned Processes:**
```typescript
// ✅ CORRECT: Comprehensive cleanup
class TerminalManager {
  private pty: IPty | null = null;
  
  async cleanup() {
    if (this.pty) {
      // 1. Remove all listeners first
      this.pty.removeAllListeners();
      
      // 2. Kill process
      this.killProcess(this.pty);
      
      // 3. Clear references
      this.pty = null;
    }
  }
  
  private killProcess(pty: IPty) {
    try {
      if (process.platform === 'win32') {
        const { spawnSync } = require('child_process');
        spawnSync('taskkill', ['/pid', pty.pid.toString(), '/f', '/t']);
      } else {
        pty.kill();
      }
    } catch (error) {
      console.error('Error killing pty:', error);
    }
  }
}
```

### 2.4 Avoiding Orphaned Processes

**Critical Issue (March 2026):**
- **Issue #20941**: Gemini CLI bug - orphaned nested background processes cause OS resource exhaustion
- Current `pty.kill()` on Windows doesn't terminate descendant processes
- **Solution**: Use `taskkill /pid /f /t` to kill entire process tree

**Prevention:**
```typescript
// ✅ CORRECT: Kill entire process tree on Windows
const killProcessTree = (pid: number) => {
  if (process.platform === 'win32') {
    const { spawnSync } = require('child_process');
    // /t = terminate child processes, /f = force
    const result = spawnSync('taskkill', ['/pid', pid.toString(), '/f', '/t']);
    return result.status === 0;
  } else {
    // Unix: Process group killing
    try {
      process.kill(-pid, 'SIGKILL');
      return true;
    } catch (e) {
      return false;
    }
  }
};
```

---

## 3. Electron-Specific Optimizations

### 3.1 IPC Performance Patterns

**Critical Issues:**
- **Issue #41511** (Mar 2024): contextBridge copies large data sets instead of referencing
- **Issue #27039**: Memory leak when passing IPC events over contextBridge
- **PR #45229** (Jan 2025): New `contextBridge.executeInMainWorld` for secure, efficient execution

**Best Practices:**
```typescript
// ✅ CORRECT: Minimize data transfer through IPC
// Send IDs/references instead of full objects

// Renderer process
ipcRenderer.invoke('get-terminal-data', terminalId);

// Main process
ipcMain.handle('get-terminal-data', async (event, terminalId) => {
  // Return only necessary data, not entire terminal state
  return store.get(`terminals.${terminalId}.recentOutput`);
});

// ✅ Use shared buffers for large binary data (Issue #45034)
// Main process
const sharedBuffer = new SharedArrayBuffer(size);
ipcRenderer.postMessage('large-data', null, [sharedBuffer]);
```

**Performance Tips:**
- Avoid passing large objects through contextBridge
- Use primitive types directly (optimized in PR #24551)
- Batch IPC calls when possible
- Use `ipcRenderer.invoke` with async handlers instead of send/on for request-response

### 3.2 Context Bridge Efficiency

**Optimization:**
```typescript
// ✅ CORRECT: Expose minimal API surface
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Primitives pass directly (no copying)
  platform: process.platform,
  
  // Functions instead of data
  spawnTerminal: (config) => ipcRenderer.invoke('spawn-terminal', config),
  writeToTerminal: (id, data) => ipcRenderer.invoke('terminal-write', { id, data }),
  
  // Use callbacks for events
  onTerminalData: (id, callback) => {
    const channel = `terminal-data-${id}`;
    ipcRenderer.on(channel, (event, data) => callback(data));
    return () => ipcRenderer.removeListener(channel, callback);
  }
});

// ❌ WRONG: Exposing large data structures
contextBridge.exposeInMainWorld('state', {
  allTerminals: terminalList,  // Copied on every access!
});
```

### 3.3 Memory Management in Main Process

**Key Patterns:**
```typescript
// ✅ CORRECT: Use WeakRef for object tracking
class TerminalRegistry {
  private terminals = new Map<number, WeakRef<IPty>>();
  private registry = new FinalizationRegistry((pid: number) => {
    console.log(`Terminal ${pid} garbage collected`);
    this.terminals.delete(pid);
  });
  
  register(pid: number, pty: IPty) {
    this.terminals.set(pid, new WeakRef(pty));
    this.registry.register(pty, pid);
  }
}

// ✅ Use AbortController for event cleanup
const controller = new AbortController();
ipcMain.on('some-event', { signal: controller.signal }, (event, arg) => {
  // Handler
});

// Cleanup
controller.abort();

// ❌ WRONG: Global variables and unbounded collections
global.terminals = [];  // Never cleaned up!
```

### 3.4 Event Emitter Cleanup Patterns

**Critical:**
- **Issue #139**: MaxListenersExceededWarning from @electron/remote
- **Best Practice**: Always remove listeners explicitly

```typescript
// ✅ CORRECT: Remove listeners on cleanup
class TerminalWindow {
  private listeners: Array<() => void> = [];
  
  setup() {
    const onDataHandler = (data: string) => {
      // Handle data
    };
    
    pty.onData(onDataHandler);
    
    // Track for cleanup
    this.listeners.push(() => {
      pty.off('data', onDataHandler);
    });
  }
  
  cleanup() {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
  }
}

// ✅ Use once() for single-use events
pty.once('exit', (code) => {
  console.log(`Exited with ${code}`);
  // Automatically removed after firing
});

// ✅ Set max listeners appropriately
emitter.setMaxListeners(20);  // If you need many listeners
```

---

## 4. React + xterm.js Patterns

### 4.1 useEffect Cleanup for Terminal Components

**Critical Issues:**
- **Issue #32946** (Apr 2025): React 19.1.0 bug - useEffect cleanup timing with ResizeObserver
- **Issue #20875**: DOM refs nullified during cleanup in React 17+
- **Issue #26315**: useRef cleanup issues in StrictMode

**Best Practice Pattern:**
```typescript
// ✅ CORRECT: Comprehensive cleanup
function TerminalComponent({ terminalId }: { terminalId: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create terminal and addons
    const term = new Terminal(options);
    const fitAddon = new FitAddon();
    const webglAddon = new WebglAddon();
    
    // Store refs
    terminalRef.current = term;
    fitAddonRef.current = fitAddon;
    webglAddonRef.current = webglAddon;
    
    // Load addons
    term.loadAddon(fitAddon);
    term.loadAddon(webglAddon);
    
    // Open in DOM
    term.open(containerRef.current);
    fitAddon.fit();
    
    // Setup resize observer with cleanup
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(containerRef.current);
    
    // Setup IPC listeners
    const unsubscribeData = setupTerminalDataListener(terminalId, (data) => {
      term.write(data);
    });
    
    // Cleanup function
    return () => {
      // 1. Stop observing
      resizeObserver.disconnect();
      
      2. Remove IPC listeners
      unsubscribeData();
      
      // 3. Dispose addons
      webglAddon.dispose();
      fitAddon.dispose();
      
      // 4. Dispose terminal (trapdoor - can't reuse after)
      term.dispose();
      
      // 5. Clear refs
      terminalRef.current = null;
      fitAddonRef.current = null;
      webglAddonRef.current = null;
    };
  }, [terminalId]);
  
  return <div ref={containerRef} className="terminal-container" />;
}
```

### 4.2 Ref Management for xterm Instances

**Key Points:**
- Store terminal instance in `useRef`, not state (avoid re-renders)
- Don't access `ref.current` during cleanup in React 17+ (may be null)
- Store DOM element in local variable within useEffect

```typescript
// ✅ CORRECT: Store DOM element locally
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  
  const term = new Terminal();
  term.open(container);
  
  return () => {
    // Use local variable, not ref.current (may be null in React 17+)
    term.dispose();
  };
}, []);

// ❌ WRONG: Accessing ref.current in cleanup
return () => {
  terminalRef.current?.dispose();  // May be null!
};
```

### 4.3 Avoiding Re-renders During Terminal Operations

**Pattern:**
```typescript
// ✅ CORRECT: Use refs for terminal state, not React state
const TerminalComponent = () => {
  const terminalRef = useRef<Terminal | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Don't store terminal output in state - write directly to terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.write('data');  // Direct write, no re-render
    }
  }, [data]);
  
  return <div ref={containerRef} />;
};

// ❌ WRONG: Storing terminal output in state
const [output, setOutput] = useState('');  // Causes re-render on every write!
```

### 4.4 Lazy Loading Strategies

**Implementation:**
```typescript
// ✅ CORRECT: Lazy load xterm.js and addons
import { lazy, Suspense } from 'react';

const TerminalWrapper = lazy(() => import('./TerminalWrapper'));

function App() {
  return (
    <Suspense fallback={<div>Loading terminal...</div>}>
      <TerminalWrapper />
    </Suspense>
  );
}

// ✅ Dynamic import for addons (reduce initial bundle)
const loadTerminal = async () => {
  const { Terminal } = await import('@xterm/xterm');
  const { FitAddon } = await import('@xterm/addon-fit');
  const { WebglAddon } = await import('@xterm/addon-webgl');
  
  // Initialize...
};
```

---

## 5. Common Anti-Patterns to Avoid

### ❌ Memory Leaks

```typescript
// 1. Not disposing terminals
terminals.push(new Terminal());  // Never cleaned up!

// 2. Lingering event listeners
ipcRenderer.on('data', handler);  // Never removed

// 3. Unbounded collections
outputBuffer.push(data);  // Grows forever

// 4. Closures capturing terminal references
const write = (data: string) => {
  terminal.write(data);  // terminal captured, can't be GC'd
};
```

### ❌ Performance Issues

```typescript
// 1. No resize debouncing
window.addEventListener('resize', () => {
  terminal.resize(cols, rows);  // Called 60fps during resize!
});

// 2. Excessive scrollback
scrollback: 9999999  // Memory bloat

// 3. Using DOM renderer for heavy output
rendererType: 'dom'  // Slow for large outputs

// 4. Passing large objects through IPC
ipcRenderer.send('data', largeObject);  // Copied, not referenced
```

### ❌ Process Management

```typescript
// 1. Not killing process tree on Windows
pty.kill();  // Leaves child processes

// 2. No cleanup on app quit
// App exits, pty processes remain orphaned

// 3. Ignoring exit events
// Don't know when process actually exits
```

---

## 6. Recommended Configuration Summary

### Optimal xterm.js Setup (2025-2026)

```typescript
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';

const term = new Terminal({
  // Performance
  rendererType: 'canvas',  // Will use WebGL if addon loaded
  scrollback: 1000,        // Reasonable limit
  tabStopWidth: 4,
  
  // Visual
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#d4d4d4',
    selection: 'rgba(255, 255, 255, 0.3)'
  },
  
  // Behavior
  cursorBlink: true,
  convertEol: true,
  termName: 'xterm-256color'
});

// Load WebGL for hardware acceleration
const webglAddon = new WebglAddon();
webglAddon.onContextLoss(() => {
  webglAddon.dispose();
});
term.loadAddon(webglAddon);

// Load fit addon
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
```

### Optimal node-pty Setup

```typescript
import * as pty from 'node-pty';

const ptyProcess = pty.spawn({
  name: 'xterm-color',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME,
  env: process.env as { [key: string]: string },
  useConpty: true,  // Modern Windows backend
});

// Handle exit
ptyProcess.onExit(({ exitCode, signal }) => {
  console.log(`Process exited: code=${exitCode}, signal=${signal}`);
});

// Proper cleanup
const cleanup = () => {
  if (process.platform === 'win32') {
    const { spawnSync } = require('child_process');
    spawnSync('taskkill', ['/pid', ptyProcess.pid.toString(), '/f', '/t']);
  } else {
    ptyProcess.kill('SIGKILL');
  }
};
```

### Optimal Electron IPC Setup

```typescript
// preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Minimal API surface
  spawnTerminal: (config) => ipcRenderer.invoke('spawn-terminal', config),
  writeToTerminal: (id, data) => ipcRenderer.invoke('terminal-write', { id, data }),
  resizeTerminal: (id, cols, rows) => ipcRenderer.invoke('terminal-resize', { id, cols, rows }),
  killTerminal: (id) => ipcRenderer.invoke('terminal-kill', id),
  
  // Event subscription with cleanup
  onTerminalData: (id, callback) => {
    const channel = `terminal-data-${id}`;
    const listener = (event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});

// main.ts
ipcMain.handle('spawn-terminal', async (event, config) => {
  const ptyProcess = pty.spawn(config);
  // Store in registry with cleanup tracking
  terminalRegistry.register(ptyProcess);
  return { pid: ptyProcess.pid };
});
```

---

## 7. Key Resources

### Official Documentation
- xterm.js API: https://xtermjs.org/docs/api/terminal/classes/terminal/
- FitAddon: https://github.com/xtermjs/xterm.js/tree/master/addons/addon-fit
- WebGLAddon: https://www.npmjs.com/package/@xterm/addon-webgl
- Electron Performance: https://electronjs.org/docs/latest/tutorial/performance

### Critical GitHub Issues/PRs
- xterm.js disposal improvements: PR #3919
- xterm.js memory leak fix: PR #3916
- node-pty process cleanup: PR #755
- Electron contextBridge performance: Issue #41511
- React useEffect cleanup timing: Issue #32946

### Community Resources
- VS Code Terminal Performance: https://github.com/microsoft/vscode/issues
- xterm.js Best Practices: https://github.com/xtermjs/xterm.js/issues

---

## 8. Summary Checklist

### ✅ xterm.js Optimization
- [ ] Dispose terminals properly in cleanup
- [ ] Limit scrollback to 1000-5000 lines
- [ ] Use WebGL renderer (@xterm/addon-webgl)
- [ ] Debounce resize operations (150ms)
- [ ] Use simple theme colors
- [ ] Clear texture atlas periodically

### ✅ node-pty Best Practices
- [ ] Track all PTY processes in registry
- [ ] Use taskkill /f /t on Windows
- [ ] Handle onExit events
- [ ] Cleanup on app quit
- [ ] Use useConpty: true on Windows

### ✅ Electron Optimizations
- [ ] Minimize IPC data transfer
- [ ] Use contextBridge efficiently
- [ ] Remove event listeners explicitly
- [ ] Use WeakRef for object tracking
- [ ] Use AbortController for cleanup

### ✅ React Patterns
- [ ] Store terminal in useRef, not state
- [ ] Comprehensive useEffect cleanup
- [ ] Don't access ref.current in cleanup (React 17+)
- [ ] Lazy load terminal components
- [ ] Write directly to terminal, don't use state

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-07  
**Based on:** xterm.js v6.0.0, node-pty v1.0.0+, Electron v35+
