# TDT Space Optimization Mission - Validation Contract

**Document Version:** 1.0  
**Created:** 2026-03-07  
**Mission:** Fix 6 memory leaks and performance issues, optimize terminal rendering, establish testing infrastructure

---

## Overview

This validation contract defines testable assertions for the TDT Space optimization mission. Each assertion includes stable ID, behavioral description with pass/fail criteria, and evidence requirements.

---

## Area 1: Memory-Leak-Fixes

### VAL-MEM-001: Workspace Switch Cleanup

**Title:** Verify complete cleanup of workspace terminals on switch

**Behavioral Description:**
When switching from Workspace A to Workspace B:
- All PTY processes associated with Workspace A must be killed
- All xterm.js terminal instances for Workspace A must be disposed
- All IPC event listeners registered for Workspace A terminals must be removed
- All ResizeObserver instances for Workspace A must be disconnected
- Memory usage must not increase by more than 5MB after 10 workspace switches

**Pass Criteria:**
- ✅ PTY process count returns to baseline after switch
- ✅ No orphaned processes visible in task manager
- ✅ No "MaxListenersExceededWarning" warnings in console
- ✅ Heap snapshot comparison shows < 5MB growth after 10 switches

**Fail Criteria:**
- ❌ PTY processes remain active after workspace switch
- ❌ Console shows memory leak warnings
- ❌ Heap growth exceeds 5MB per 10 workspace switches

**Evidence Requirements:**
1. Console output showing terminal cleanup logs
2. Task Manager/Process Monitor screenshot before and after switch
3. Chrome DevTools Memory panel heap snapshot comparison
4. IPC handler logs showing `cleanupAllTerminals` execution

---

### VAL-MEM-002: TerminalCell Component Cleanup

**Title:** Verify TerminalCell useEffect cleanup disposes all resources

**Behavioral Description:**
When TerminalCell component unmounts (terminal removed or workspace switched):
- `terminal.dispose()` must be called on the xterm.js instance
- All addons (FitAddon, WebLinksAddon, SearchAddon) must be disposed
- ResizeObserver must be disconnected
- All IPC event listener subscriptions must be unsubscribed
- Debounce timers must be cleared
- All refs must be nullified

**Pass Criteria:**
- ✅ Console logs `[TerminalCell {id}] Cleaning up terminal` on unmount
- ✅ Terminal instance is nullified after cleanup
- ✅ No "Cannot read property of null" errors after unmount
- ✅ No lingering event listeners in Chrome DevTools Performance tab

**Fail Criteria:**
- ❌ Terminal dispose not called before component unmount
- ❌ ResizeObserver continues firing after unmount
- ❌ IPC listeners remain active (memory leak)

**Evidence Requirements:**
1. Console log output showing cleanup sequence
2. React DevTools component tree before/after unmount
3. Chrome DevTools Performance tab showing no orphaned listeners
4. Code review screenshot of useEffect cleanup function

---

### VAL-MEM-003: IPC Event Listener Cleanup

**Title:** Verify IPC event listeners are properly removed on terminal disposal

**Behavioral Description:**
When a terminal is disposed or workspace is switched:
- `onTerminalData` listener must be unsubscribed
- `onTerminalStarted` listener must be unsubscribed
- `onTerminalExit` listener must be unsubscribed
- `onTerminalError` listener must be unsubscribed
- `removeListener` must be called for each IPC channel

**Pass Criteria:**
- ✅ `listenersRef.current` is empty object after cleanup
- ✅ No duplicate event handlers registered after terminal recreation
- ✅ Console shows no "MaxListenersExceededWarning" after 20 terminal spawns
- ✅ IPC listener count matches active terminal count

**Fail Criteria:**
- ❌ IPC listeners accumulate across terminal lifecycles
- ❌ Event handlers fire for disposed terminals
- ❌ Memory profiler shows listener closure references retained

**Evidence Requirements:**
1. Console output showing unsubscribe calls
2. Chrome DevTools Memory panel showing listener count
3. Code screenshot of `listenersRef.current` cleanup in TerminalCell
4. Test output from 20+ terminal spawn/dispose cycle

---

### VAL-MEM-004: xterm.js Event Disposal

**Title:** Verify xterm.js event handlers are disposed with terminal

**Behavioral Description:**
When xterm.js terminal is disposed:
- `terminal.onData` handlers must be removed
- `terminal.onScroll` handlers must be removed
- Custom key event handlers must be detached
- Texture atlas must be cleared
- WebGL context (if used) must be released

**Pass Criteria:**
- ✅ `term.dispose()` called before terminal ref nullification
- ✅ No event handlers attached to disposed terminal instance
- ✅ WebGL renderer context released (verified via DevTools)
- ✅ No "write to disposed terminal" errors

**Fail Criteria:**
- ❌ Terminal dispose skipped in cleanup sequence
- ❌ Event handlers reference disposed terminal (closure leak)
- ❌ WebGL context remains active after terminal disposal

**Evidence Requirements:**
1. Console log showing dispose call sequence
2. Chrome DevTools Performance > Event Listeners panel
3. WebGL context count before/after terminal disposal
4. Memory heap snapshot showing no terminal references

---

## Area 2: Performance-Optimization

### VAL-PERF-001: Resize Debouncing

**Title:** Verify terminal resize operations are debounced to prevent excessive IPC calls

**Behavioral Description:**
When window is resized rapidly (e.g., dragging window edge):
- ResizeObserver fires must be debounced with 100-200ms delay
- Only the final resize dimensions should trigger IPC call
- Intermediate resize events must be cancelled
- `terminal.resize()` and `ptyProcess.resize()` called once per resize sequence

**Pass Criteria:**
- ✅ Console shows single `terminalResize` IPC call per resize gesture
- ✅ Debounce delay between 100-200ms (verified via Performance tab)
- ✅ No "text loss" during rapid resize operations
- ✅ PTY process receives correct final dimensions

**Fail Criteria:**
- ❌ Multiple IPC calls fired during single resize gesture
- ❌ Resize called on every ResizeObserver callback (60fps spam)
- ❌ Text output corrupted or lost during resize

**Evidence Requirements:**
1. Chrome DevTools Performance tab showing resize event timeline
2. Console log count of `terminalResize` IPC calls during resize
3. Network/IPC monitor showing debounced call pattern
4. Visual verification of text preservation during resize

---

### VAL-PERF-002: Scrollback Buffer Limits

**Title:** Verify xterm.js scrollback buffer is limited to prevent memory bloat

**Behavioral Description:**
Terminal configuration must enforce reasonable scrollback limits:
- `scrollback` option set to 1000-5000 lines (not unlimited)
- `terminal.clear()` available for manual buffer clearing
- Memory usage remains stable during long-running sessions
- No "out of memory" errors during extended terminal output

**Pass Criteria:**
- ✅ xterm.js options show `scrollback: 1000` (or reasonable value)
- ✅ Memory usage stable after outputting 10,000+ lines
- ✅ `terminal.clear()` successfully frees memory
- ✅ No performance degradation during long sessions

**Fail Criteria:**
- ❌ Scrollback set to excessive value (>10000)
- ❌ Memory grows linearly with terminal output
- ❌ Terminal becomes unresponsive after extended use

**Evidence Requirements:**
1. Code screenshot showing xterm.js configuration
2. Chrome DevTools Memory panel during extended output test
3. Memory usage graph over 30-minute terminal session
4. `terminal.clear()` before/after memory comparison

---

### VAL-PERF-003: Process Tree Killing (Windows)

**Title:** Verify Windows process tree termination uses taskkill /f /t

**Behavioral Description:**
On Windows platform, when killing PTY processes:
- Must use `taskkill /pid <pid> /f /t` to kill entire process tree
- Child processes must not remain orphaned
- Process count must return to baseline after kill
- No "zombie" processes visible in Task Manager

**Pass Criteria:**
- ✅ Code uses `spawnSync('taskkill', ['/pid', pid, '/f', '/t'])`
- ✅ Child processes terminated with parent
- ✅ Task Manager shows no orphaned OpenConsole/conhost processes
- ✅ Process count returns to baseline within 2 seconds of kill

**Fail Criteria:**
- ❌ Uses only `pty.kill()` without taskkill fallback
- ❌ Child processes remain after parent killed
- ❌ Orphaned conhost.exe processes visible in Task Manager

**Evidence Requirements:**
1. Code screenshot of Windows-specific kill logic
2. Task Manager screenshot before/after terminal kill
3. Process Monitor (ProcMon) output showing process tree termination
4. Test output from spawn/kill cycle with process count verification

---

### VAL-PERF-004: xterm.js Renderer Configuration

**Title:** Verify WebGL renderer is used for optimal terminal rendering

**Behavioral Description:**
Terminal rendering configuration must use hardware acceleration:
- WebGL addon (`@xterm/addon-webgl`) loaded and active
- `rendererType: 'canvas'` configured (uses WebGL if available)
- DOM renderer NOT used as primary renderer (slower)
- FPS remains above 50fps during rapid output

**Pass Criteria:**
- ✅ `WebglAddon` loaded via `term.loadAddon(webglAddon)`
- ✅ Chrome DevTools > Rendering > WebGL inspected shows active context
- ✅ Rendering FPS > 50 during rapid terminal output (1000+ lines/sec)
- ✅ No DOM reflow/repaint spikes in Performance tab

**Fail Criteria:**
- ❌ DOM renderer used instead of WebGL/Canvas
- ❌ WebGL addon not loaded
- ❌ Rendering FPS drops below 30 during heavy output

**Evidence Requirements:**
1. Code screenshot showing WebGL addon configuration
2. Chrome DevTools Rendering panel showing WebGL active
3. Performance tab FPS graph during heavy output test
4. Comparison test: DOM vs WebGL rendering performance

---

## Area 3: State-Management

### VAL-STATE-001: Zustand Store Cleanup

**Title:** Verify Zustand store state is properly managed and doesn't retain stale references

**Behavioral Description:**
Zustand workspace store must:
- Clear terminal state when workspace is deleted
- Not retain references to disposed terminal components
- Update workspace state atomically (no partial updates)
- Debounce persistence writes to electron-store (300ms delay)

**Pass Criteria:**
- ✅ `useWorkspaceStore.getState()` returns current state only
- ✅ No stale terminal references in store after deletion
- ✅ Console shows debounced save logs (single save per operation batch)
- ✅ Store state matches electron-store persisted data

**Fail Criteria:**
- ❌ Store retains references to deleted terminals
- ❌ Multiple rapid saves triggered for single operation
- ❌ Store state diverges from persisted state

**Evidence Requirements:**
1. Console log showing debounced save operations
2. Code review of Zustand store cleanup logic
3. electron-store data inspection before/after operations
4. Memory heap snapshot showing no stale store references

---

### VAL-STATE-002: Command History Limits

**Title:** Verify terminal command history has bounds to prevent memory growth

**Behavioral Description:**
Terminal history store must enforce limits:
- Command history array capped at reasonable size (e.g., 1000 commands)
- Old commands evicted when limit exceeded (FIFO)
- History storage size monitored and bounded
- No unbounded array growth in terminal history store

**Pass Criteria:**
- ✅ History array length never exceeds configured max
- ✅ Memory usage stable after 1000+ command executions
- ✅ Oldest commands evicted when limit reached
- ✅ No "array size exceeded" warnings

**Fail Criteria:**
- ❌ History array grows without bound
- ❌ Memory grows linearly with command count
- ❌ No eviction policy implemented

**Evidence Requirements:**
1. Code screenshot showing history limit enforcement
2. Memory usage graph during 1000+ command test
3. Terminal history store state inspection
4. Console log showing eviction events

---

### VAL-STATE-003: IPC Optimization

**Title:** Verify IPC calls use minimal data transfer and batching

**Behavioral Description:**
IPC communication must follow optimization patterns:
- Send terminal IDs instead of full terminal objects
- Batch frequent operations (e.g., multiple writes)
- Use `ipcRenderer.invoke` for request-response (not send/on)
- Large data transferred via SharedArrayBuffer (if applicable)

**Pass Criteria:**
- ✅ IPC payloads contain only primitive types and IDs
- ✅ No large objects passed through contextBridge
- ✅ IPC call count matches expected operation count (no duplicates)
- ✅ Performance monitor shows low IPC overhead (<5ms per call)

**Fail Criteria:**
- ❌ Large terminal state objects passed through IPC
- ❌ Duplicate IPC calls for single operation
- ❌ IPC overhead exceeds 10ms per call

**Evidence Requirements:**
1. Code screenshot of IPC handler signatures
2. Chrome DevTools Performance > IPC timeline
3. IPC payload inspection showing minimal data
4. Benchmark results for IPC call latency

---

## Area 4: Testing-Infrastructure

### VAL-TEST-001: Test Coverage Requirements

**Title:** Verify comprehensive test coverage for critical modules

**Behavioral Description:**
Testing infrastructure must achieve coverage targets:
- Unit tests: >80% coverage for stores, services, utilities
- Component tests: >70% coverage for TerminalCell, WorkspaceTabBar
- E2E tests: All critical user workflows covered
- Performance tests: Memory leak detection tests included

**Pass Criteria:**
- ✅ `bun run test:coverage` shows >80% line coverage
- ✅ All critical paths tested (terminal spawn, dispose, workspace switch)
- ✅ No "untested" warnings for memory-critical code
- ✅ CI pipeline includes test execution

**Fail Criteria:**
- ❌ Coverage below 80% for critical modules
- ❌ Memory cleanup code untested
- ❌ IPC handlers lack unit tests

**Evidence Requirements:**
1. Coverage report HTML/terminal output
2. Test file structure showing organized test suites
3. CI pipeline configuration showing test execution
4. Sample test output for critical path tests

---

### VAL-TEST-002: Memory Profiling Tools

**Title:** Verify memory profiling utilities are implemented and functional

**Behavioral Description:**
Memory profiling infrastructure must include:
- `MemoryProfiler` class for heap snapshots
- IPC handler for renderer memory queries
- Periodic memory logging in dev mode
- Memory comparison utilities for leak detection

**Pass Criteria:**
- ✅ `MemoryProfiler.takeSnapshot()` functional
- ✅ `MemoryProfiler.compareSnapshots()` shows memory delta
- ✅ Dev mode logs memory every 10 seconds
- ✅ Renderer memory accessible via IPC

**Fail Criteria:**
- ❌ Memory profiling utilities missing
- ❌ Heap snapshots not comparable
- ❌ No memory logging in dev mode

**Evidence Requirements:**
1. Code screenshot of MemoryProfiler implementation
2. Console output showing periodic memory logs
3. Memory snapshot comparison output
4. IPC handler for memory queries

---

### VAL-TEST-003: Auto-Cleanup Tests

**Title:** Verify automated tests detect memory leaks and cleanup failures

**Behavioral Description:**
Automated test suite must include:
- Terminal spawn/dispose leak detection test
- Workspace switch memory accumulation test
- Long-running session stability test
- Process orphan detection test

**Pass Criteria:**
- ✅ Memory leak test fails if growth >20MB per 50 terminals
- ✅ Workspace switch test fails if memory accumulates
- ✅ Process count verified after terminal kill
- ✅ Tests run in CI pipeline

**Fail Criteria:**
- ❌ No automated memory leak detection
- ❌ Tests don't verify process cleanup
- ❌ Long-running stability not tested

**Evidence Requirements:**
1. Test code for memory leak detection
2. Test output showing pass/fail criteria
3. CI pipeline showing test execution
4. Memory growth graph from automated test

---

## Cross-Area Flow Tests

### VAL-FLOW-001: Workspace Switching Stress Test

**Title:** Verify no memory accumulation during rapid workspace switching

**Behavioral Description:**
Execute 10+ workspace switches in rapid succession:
- Switch from Workspace 1 → 2 → 3 → ... → 10 → 1
- Monitor memory after each switch
- Verify PTY process count remains stable
- Verify no event listener accumulation

**Pass Criteria:**
- ✅ Memory growth < 10MB after 10 complete switch cycles
- ✅ PTY process count matches active workspace terminal count
- ✅ No MaxListenersExceededWarning in console
- ✅ Switch latency remains <100ms throughout test

**Fail Criteria:**
- ❌ Memory grows linearly with switch count
- ❌ Orphaned PTY processes accumulate
- ❌ Switch latency degrades over time

**Evidence Requirements:**
1. Memory usage graph during 10+ switch cycles
2. PTY process count before/after test
3. Console log showing switch operations
4. Performance timeline showing switch latency

---

### VAL-FLOW-002: Extended Terminal Session Stability

**Title:** Verify stable memory during 30-minute terminal session

**Behavioral Description:**
Run continuous terminal session for 30 minutes:
- Execute commands producing varied output
- Perform periodic resize operations
- Monitor memory every 5 minutes
- Verify no memory drift or degradation

**Pass Criteria:**
- ✅ Memory stable within ±5% throughout session
- ✅ No memory "sawtooth" pattern (indicates leak)
- ✅ Terminal remains responsive after 30 minutes
- ✅ No GC pressure warnings in console

**Fail Criteria:**
- ❌ Memory drift >10% during session
- ❌ Terminal becomes unresponsive
- ❌ GC runs excessively (sign of leak)

**Evidence Requirements:**
1. Memory usage graph over 30-minute session
2. Terminal responsiveness test results
3. Console log showing GC activity
4. Screenshot of terminal after 30 minutes

---

### VAL-FLOW-003: Rapid Resize Stress Test

**Title:** Verify no lag or text loss during rapid resize operations

**Behavioral Description:**
Perform rapid resize operations (50+ resizes in 10 seconds):
- Resize window continuously
- Monitor terminal text integrity
- Verify debouncing prevents IPC spam
- Check for text corruption or loss

**Pass Criteria:**
- ✅ No text loss or corruption during resize
- ✅ Single IPC call per resize sequence (debounced)
- ✅ Terminal renders correctly after final resize
- ✅ Resize completes without lag or stutter

**Fail Criteria:**
- ❌ Text output corrupted during resize
- ❌ Multiple IPC calls per resize (debounce failed)
- ❌ Visible lag or stutter during resize

**Evidence Requirements:**
1. Video/screenshot sequence of rapid resize
2. IPC call count during resize test
3. Terminal output comparison before/after resize
4. Performance timeline showing resize events

---

## Verification Checklist

### Pre-Verification Setup
- [ ] Node.js v18+ installed
- [ ] Bun package manager installed
- [ ] Chrome DevTools available
- [ ] Task Manager / Process Monitor available
- [ ] Test infrastructure set up (vitest, playwright)

### Memory Leak Verification
- [ ] VAL-MEM-001: Workspace switch cleanup
- [ ] VAL-MEM-002: TerminalCell component cleanup
- [ ] VAL-MEM-003: IPC event listener cleanup
- [ ] VAL-MEM-004: xterm.js event disposal

### Performance Verification
- [ ] VAL-PERF-001: Resize debouncing
- [ ] VAL-PERF-002: Scrollback buffer limits
- [ ] VAL-PERF-003: Process tree killing
- [ ] VAL-PERF-004: xterm.js renderer config

### State Management Verification
- [ ] VAL-STATE-001: Zustand store cleanup
- [ ] VAL-STATE-002: Command history limits
- [ ] VAL-STATE-003: IPC optimization

### Testing Infrastructure Verification
- [ ] VAL-TEST-001: Test coverage requirements
- [ ] VAL-TEST-002: Memory profiling tools
- [ ] VAL-TEST-003: Auto-cleanup tests

### Cross-Area Flow Verification
- [ ] VAL-FLOW-001: Workspace switching stress test
- [ ] VAL-FLOW-002: Extended terminal session
- [ ] VAL-FLOW-003: Rapid resize stress test

---

## Evidence Collection Guide

### Console Logs
- Enable verbose logging in dev mode
- Capture cleanup sequence logs
- Record IPC call logs

### Memory Snapshots
- Use Chrome DevTools Memory panel
- Take heap snapshots before/after operations
- Compare retained size and object counts

### Process Monitoring
- Windows: Task Manager, Process Monitor (ProcMon)
- Monitor PTY process count
- Verify process tree termination

### Performance Timelines
- Chrome DevTools Performance tab
- Record during stress tests
- Analyze event timing and frequency

### Code Review
- Screenshot critical cleanup code
- Verify dispose/disconnect calls
- Confirm debounce implementation

---

## Sign-Off Criteria

**Mission Complete** when:
- ✅ All 6 memory leaks fixed (2 critical, 2 high, 1 medium, 1 low)
- ✅ All 17 assertions pass verification
- ✅ Test coverage >80% for critical modules
- ✅ Memory profiling infrastructure operational
- ✅ No memory accumulation in flow tests
- ✅ Documentation complete

**Document Approval:**
- [ ] Technical Lead Review
- [ ] QA Verification
- [ ] Performance Benchmark Complete

---

**Generated:** 2026-03-07  
**Version:** 1.0  
**Status:** Ready for Verification
