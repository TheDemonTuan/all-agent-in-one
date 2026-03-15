/**
 * Terminal Renderer Hook
 *
 * Manages xterm.js terminal instance with WebGL renderer and adaptive FPS capping.
 * Provides optimized rendering for high-frequency terminal output.
 */

import { Terminal, type ITerminalOptions } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';

export interface TerminalRendererOptions {
  fontSize?: number;
  fontFamily?: string;
  theme?: ITerminalOptions['theme'];
  scrollback?: number;
  cursorBlink?: boolean;
  cursorStyle?: 'block' | 'bar' | 'underline';
}

export interface Disposable {
  dispose(): void;
}

/**
 * Manages disposables in reverse order of registration for safe cleanup
 */
export class DisposableManager implements Disposable {
  private disposables: Disposable[] = [];

  add(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  addCallback(callback: () => void): void {
    this.disposables.push({ dispose: callback });
  }

  dispose(): void {
    // Dispose in reverse order to avoid dependency issues
    for (let i = this.disposables.length - 1; i >= 0; i--) {
      try {
        this.disposables[i].dispose();
      } catch (e) {
        console.error('[DisposableManager] Dispose error:', e);
      }
    }
    this.disposables = [];
  }
}

/**
 * Adaptive writer with FPS capping for high-frequency terminal output
 */
export class AdaptiveWriter implements Disposable {
  private buffer = '';
  private scheduled = false;
  private rafId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastWriteTime = 0;
  private targetFps = 30;
  private bufferPressureHistory: number[] = [];

  private readonly MIN_FPS = 15;
  private readonly MAX_FPS = 60;
  private readonly MAX_CHUNK_SIZE = 8192;
  private readonly PRESSURE_WINDOW = 10;

  constructor(private terminal: Terminal) {}

  private adjustFps(bufferPressure: number): void {
    this.bufferPressureHistory.push(bufferPressure);
    if (this.bufferPressureHistory.length > this.PRESSURE_WINDOW) {
      this.bufferPressureHistory.shift();
    }

    const avgPressure =
      this.bufferPressureHistory.reduce((a, b) => a + b, 0) /
      this.bufferPressureHistory.length;

    if (avgPressure > 0.8 && this.targetFps > this.MIN_FPS) {
      this.targetFps = Math.max(this.MIN_FPS, this.targetFps - 5);
    } else if (avgPressure < 0.3 && this.targetFps < this.MAX_FPS) {
      this.targetFps = Math.min(this.MAX_FPS, this.targetFps + 5);
    }
  }

  flush(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.buffer.length > 0) {
      this.terminal.write(this.buffer);
      this.buffer = '';
    }
    this.scheduled = false;
    this.lastWriteTime = performance.now();
  }

  schedule(data: string): void {
    this.buffer += data;

    const bufferPressure = Math.min(1, this.buffer.length / this.MAX_CHUNK_SIZE);
    this.adjustFps(bufferPressure);

    const now = performance.now();
    const elapsed = now - this.lastWriteTime;
    const frameTime = 1000 / this.targetFps;

    // Flush immediately if buffer is large or enough time has passed
    if (this.buffer.length >= this.MAX_CHUNK_SIZE || elapsed >= frameTime) {
      this.flush();
      return;
    }

    if (!this.scheduled) {
      this.scheduled = true;
      this.timeoutId = setTimeout(() => {
        this.rafId = requestAnimationFrame(() => {
          this.flush();
        });
      }, frameTime - elapsed);
    }
  }

  dispose(): void {
    this.flush();
  }

  getStats() {
    return {
      targetFps: this.targetFps,
      bufferSize: this.buffer.length,
      avgPressure:
        this.bufferPressureHistory.length > 0
          ? this.bufferPressureHistory.reduce((a, b) => a + b, 0) /
            this.bufferPressureHistory.length
          : 0,
    };
  }
}

/**
 * Creates an optimized xterm.js terminal instance with WebGL renderer
 */
export function createOptimizedTerminal(
  container: HTMLElement,
  options: TerminalRendererOptions = {}
): {
  terminal: Terminal;
  fitAddon: FitAddon;
  searchAddon: SearchAddon;
  writer: AdaptiveWriter;
  disposables: DisposableManager;
  webglActive: boolean;
} {
  const disposables = new DisposableManager();

  const terminal = new Terminal({
    fontSize: options.fontSize ?? 14,
    fontFamily:
      options.fontFamily ??
      '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
    cursorBlink: options.cursorBlink ?? true,
    scrollback: options.scrollback ?? 10000,
    theme: options.theme,
    allowProposedApi: true,
    cursorStyle: options.cursorStyle ?? 'block',
    drawBoldTextInBrightColors: true,
    letterSpacing: 0,
    lineHeight: 1.2,
  });

  const fitAddon = new FitAddon();
  const searchAddon = new SearchAddon();
  const webLinksAddon = new WebLinksAddon();
  const writer = new AdaptiveWriter(terminal);

  terminal.loadAddon(fitAddon);
  terminal.loadAddon(searchAddon);
  terminal.loadAddon(webLinksAddon);

  // Try WebGL renderer first, fallback to canvas if it fails
  let webglActive = false;
  try {
    const webglAddon = new WebglAddon();
    webglAddon.onContextLoss(() => {
      console.warn('[TerminalRenderer] WebGL context lost, falling back to canvas');
    });
    terminal.loadAddon(webglAddon);
    disposables.add(webglAddon);
    webglActive = true;
  } catch (e) {
    console.warn('[TerminalRenderer] WebGL not available, using canvas renderer:', e);
  }

  terminal.open(container);

  // Register all disposables for cleanup
  disposables.add(terminal);
  disposables.add(writer);
  disposables.addCallback(() => {
    // Additional cleanup if needed
  });

  return {
    terminal,
    fitAddon,
    searchAddon,
    writer,
    disposables,
    webglActive,
  };
}
