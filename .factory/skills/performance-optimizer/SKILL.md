---
name: performance-optimizer
description: Optimizes terminal rendering, process management, and overall application performance
---

# Performance Optimizer Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Terminal rendering optimization (WebGL, canvas, DOM renderer)
- Resize debouncing and throttling
- Process tree management and killing
- xterm.js configuration optimization
- Scrollback buffer management
- Any feature involving performance improvements

## Work Procedure

### 1. Investigation Phase
- Read the feature description and understand the performance issue
- Profile current performance using Chrome DevTools Performance tab
- Identify bottlenecks (excessive re-renders, IPC spam, unbounded buffers)
- Research best practices for the specific optimization area

### 2. Benchmark Phase (BEFORE)
Establish baseline metrics:
- Measure current performance (FPS, memory usage, IPC call count, resize latency)
- Document the problem quantitatively (e.g., "60 IPC calls per resize", "100MB memory growth")
- Take screenshots/recordings of the issue

### 3. Implementation
Apply optimization:
- Implement debouncing/throttling where needed (100-200ms for resize)
- Configure xterm.js with optimal settings (scrollback limits, renderer type)
- Add process tree killing for Windows (taskkill /f /t)
- Enable WebGL renderer if beneficial
- Ensure changes don't break functionality

### 4. Verification
**Performance Benchmarks (AFTER):**
- Measure same metrics as baseline
- Verify improvement meets targets (e.g., <10 IPC calls per resize, <50MB memory growth)
- Test edge cases (rapid operations, extended sessions)

**Automated Tests:**
- Write performance regression tests
- Run `bun run test` - all tests must pass
- Ensure performance thresholds enforced in CI

**Manual Verification:**
- Test in dev mode with real usage patterns
- Verify no visual regression or functionality loss
- Monitor Performance tab for improvements
- Test on target platform (Windows for this app)

**Code Quality:**
- Run `bun run lint` - no errors
- Run `bun run typecheck` - no type errors

### 5. Documentation
- Update `.factory/library/performance-optimization.md` with benchmarks and patterns
- Document configuration choices and trade-offs
- Add performance monitoring guidance

## Example Handoff

```json
{
  "salientSummary": "Implemented resize debouncing (150ms delay), reducing IPC calls from 60+ to 1 per resize gesture. Configured xterm.js with scrollback: 1000 and WebGL renderer. Memory stable during extended sessions, no text loss during rapid resize.",
  "whatWasImplemented": "Added ResizeObserver debouncing in TerminalCell with 150ms delay. Configured xterm.js options: scrollback: 1000, rendererType: 'canvas', load WebglAddon. Implemented Windows-specific process tree killing using taskkill /pid /f /t. Added terminal.clear() for manual buffer management.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "bun run test -- performance",
        "exitCode": 0,
        "observation": "5 passing tests, resize debounce test verifies single IPC call per gesture"
      },
      {
        "command": "bun run lint",
        "exitCode": 0,
        "observation": "No lint errors"
      },
      {
        "command": "bun run typecheck",
        "exitCode": 0,
        "observation": "No type errors"
      }
    ],
    "interactiveChecks": [
      {
        "action": "Rapidly resize window 50+ times in 10 seconds",
        "observed": "Console shows 1-2 IPC calls (debounced). Terminal text preserved, no corruption. Resize completes smoothly without lag."
      },
      {
        "action": "Run terminal for 30 minutes, output 10,000+ lines, monitor memory",
        "observed": "Memory stable at ~80MB ±5%. terminal.clear() reduces memory by 30MB. No performance degradation."
      },
      {
        "action": "Kill terminal running child processes (e.g., node server with children)",
        "observed": "Task Manager shows all child processes terminated. No orphaned conhost.exe. Process count returns to baseline."
      },
      {
        "action": "Check Chrome DevTools > Rendering > WebGL during heavy output",
        "observed": "WebGL active, FPS >50 during 1000+ lines/sec output. No DOM reflow spikes."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "src/components/terminals/__tests__/TerminalCell.resize.test.ts",
        "cases": [
          {
            "name": "resize is debounced to single IPC call",
            "verifies": "50 rapid resize events trigger only 1 IPC call within 200ms window"
          },
          {
            "name": "terminal text preserved during resize",
            "verifies": "Output content matches before and after resize"
          }
        ]
      },
      {
        "file": "src/electron/__tests__/terminal.kill.test.ts",
        "cases": [
          {
            "name": "process tree killed on Windows",
            "verifies": "taskkill /f /t called, all child processes terminated"
          },
          {
            "name": "no orphaned processes after kill",
            "verifies": "Process count returns to baseline within 2 seconds"
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Optimization breaks existing functionality (text corruption, missing output)
- WebGL renderer causes crashes or compatibility issues on target machines
- Performance improvement negligible despite implementation (need architectural change)
- Trade-off required between performance and functionality (need user input)
- Platform-specific optimizations needed (Windows vs macOS vs Linux differences)
