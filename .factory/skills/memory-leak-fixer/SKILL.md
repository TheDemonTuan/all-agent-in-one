---
name: memory-leak-fixer
description: Fixes critical and high-severity memory leaks in Electron + xterm.js application
---

# Memory Leak Fixer Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Fixing terminal lifecycle cleanup issues (workspace switch, component unmount)
- Fixing event listener leaks (IPC, xterm.js, ResizeObserver)
- Fixing resource disposal issues (PTY processes, xterm instances)
- Any feature involving memory leak prevention and cleanup

## Work Procedure

### 1. Investigation Phase
- Read the feature description and understand the specific leak
- Trace the terminal/component lifecycle in the codebase
- Identify all resources that need cleanup (PTY processes, xterm instances, event listeners, timers)
- Check existing cleanup code for gaps or race conditions

### 2. Test-Driven Development (RED FIRST)
Write failing tests BEFORE implementation:
- Create test that reproduces the memory leak (spawn 20+ terminals, switch workspaces, measure memory)
- Test cleanup completeness (verify all resources disposed after unmount)
- Test for race conditions (rapid spawn/kill cycles)
- Tests must FAIL initially, proving the leak exists

### 3. Implementation (GREEN)
Fix the memory leak:
- Add cleanup calls in appropriate lifecycle hooks (useEffect return, componentWillUnmount)
- Ensure proper disposal order (addons before terminal, listeners before dispose)
- Handle race conditions (await async operations, add guards)
- Use defensive coding (null checks, cleanup guards)

### 4. Verification
**Automated Tests:**
- Run `bun run test` - all tests must pass
- Verify memory leak test now passes (was failing before fix)
- Check test coverage for cleanup code

**Manual Verification:**
- Run the app in dev mode
- Perform the leak-inducing operation 20+ times
- Monitor memory in Chrome DevTools Memory panel
- Verify no accumulation (heap snapshots before/after)
- Check Task Manager for orphaned processes
- Console should show no "MaxListenersExceededWarning"

**Code Quality:**
- Run `bun run lint` - no errors
- Run `bun run typecheck` - no type errors
- Verify cleanup code follows xterm.js and Electron best practices

### 5. Documentation
- Update `.factory/library/memory-optimization.md` with patterns discovered
- Document any gotchas or platform-specific considerations (Windows taskkill)

## Example Handoff

```json
{
  "salientSummary": "Fixed workspace switch memory leak by adding cleanupWorkspaceTerminals IPC call before switching. Implemented proper terminal disposal sequence (addons → terminal → listeners). Memory growth reduced from 50MB to <2MB after 10 switches.",
  "whatWasImplemented": "Modified workspaceStore.ts setCurrentWorkspace to call cleanupWorkspaceTerminals before switching. Added cleanup sequence in TerminalCell: dispose addons, dispose terminal, disconnect ResizeObserver, unsubscribe IPC listeners, clear timers. All resources properly disposed on unmount.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "bun run test -- memory-leak",
        "exitCode": 0,
        "observation": "8 passing tests, memory leak test now passes (was failing before)"
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
        "action": "Switch workspaces 10 times rapidly in dev mode",
        "observed": "Memory stable at ~120MB, no growth. Task Manager shows no orphaned conhost.exe processes. Console shows cleanup logs for each switch."
      },
      {
        "action": "Open Chrome DevTools Memory panel, take heap snapshot before and after 10 workspace switches",
        "observed": "Heap growth <2MB, no Terminal or PTY process objects retained"
      },
      {
        "action": "Check console for MaxListenersExceededWarning after 20 terminal spawns",
        "observed": "No warnings, IPC listener count matches active terminal count"
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "src/stores/__tests__/workspaceStore.memory.test.ts",
        "cases": [
          {
            "name": "workspace switch does not leak memory",
            "verifies": "Memory growth <5MB after 10 workspace switches, all terminals cleaned up"
          },
          {
            "name": "cleanupWorkspaceTerminals kills all PTY processes",
            "verifies": "Process count returns to baseline after workspace cleanup"
          }
        ]
      },
      {
        "file": "src/components/terminals/__tests__/TerminalCell.cleanup.test.ts",
        "cases": [
          {
            "name": "TerminalCell cleanup disposes all resources",
            "verifies": "terminal.dispose() called, addons disposed, listeners removed, timers cleared"
          },
          {
            "name": "cleanup handles race conditions",
            "verifies": "No errors when component unmounts during async operations"
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Memory leak requires architectural changes (e.g., redesigning terminal lifecycle)
- Fix conflicts with existing features or breaks functionality
- Cannot reproduce the reported leak (need clarification on steps)
- Platform-specific issues (Windows vs macOS process killing differences)
- Leak traced to third-party library (xterm.js, node-pty) - need to decide workaround vs upstream fix
