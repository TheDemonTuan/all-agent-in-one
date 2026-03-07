---
name: state-management-fixer
description: Fixes Zustand store issues, IPC optimization, and state management memory leaks
---

# State Management Fixer Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Zustand store cleanup and memory management
- IPC optimization and data transfer efficiency
- Command history limits and eviction
- Store persistence and debounce timer management
- Any feature involving state management optimization

## Work Procedure

### 1. Investigation Phase
- Read the feature description and understand the state management issue
- Trace store operations and IPC calls in the codebase
- Identify memory accumulation points (unbounded arrays, stale references, timer leaks)
- Check persistence logic for efficiency issues

### 2. Test-Driven Development (RED FIRST)
Write failing tests BEFORE implementation:
- Create test that reproduces state accumulation (1000+ operations, measure store size)
- Test for stale references (access deleted items, verify cleanup)
- Test debounce timer cleanup (mount/unmount components rapidly)
- Tests must FAIL initially, proving the issue exists

### 3. Implementation (GREEN)
Fix the state management issues:
- Add cleanup logic in store actions (removeTerminal, deleteWorkspace)
- Implement array limits with FIFO eviction
- Clear debounce timers on unmount
- Optimize IPC payloads (send IDs not objects)
- Ensure atomic state updates

### 4. Verification
**Automated Tests:**
- Run `bun run test` - all tests must pass
- Verify state management tests pass (were failing before fix)
- Check test coverage for store logic

**Manual Verification:**
- Run the app in dev mode
- Perform operations that previously caused accumulation
- Monitor store state in React DevTools
- Verify bounded growth (history limits, stable store size)
- Check electron-store persisted data matches in-memory state

**Performance Checks:**
- Measure IPC call latency (<5ms per call)
- Verify no large objects passed through contextBridge
- Monitor store update frequency (debounced saves)

**Code Quality:**
- Run `bun run lint` - no errors
- Run `bun run typecheck` - no type errors

### 5. Documentation
- Update `.factory/library/state-management.md` with patterns discovered
- Document store cleanup patterns and IPC optimization techniques

## Example Handoff

```json
{
  "salientSummary": "Fixed Zustand store memory accumulation by implementing cleanup in removeTerminal action. Added command history limit (1000 commands) with FIFO eviction. Cleared debounce timers on unmount. Store size now bounded, no stale references.",
  "whatWasImplemented": "Modified workspaceStore.ts removeTerminal to clean up terminal state completely. Added history limit enforcement in terminalHistoryStore with eviction policy. Implemented debounce timer cleanup in useEffect return. Optimized IPC handlers to send primitive IDs instead of terminal objects.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "bun run test -- state-management",
        "exitCode": 0,
        "observation": "6 passing tests, history limit test verifies eviction at 1000 commands"
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
        "action": "Execute 1500+ commands in terminal, check history store size",
        "observed": "History array capped at 1000 commands. Oldest commands evicted. Memory stable at ~5MB for history."
      },
      {
        "action": "Add/remove 50 terminals rapidly, monitor store state",
        "observed": "Store state contains only active terminals. No stale references. useWorkspaceStore.getState() returns current state only."
      },
      {
        "action": "Mount/unmount 20 components with debounced saves, monitor console",
        "observed": "Single save per batch. Debounce timers cleared on unmount. No 'cannot set state on unmounted component' errors."
      },
      {
        "action": "Profile IPC call latency for 100 calls",
        "observed": "Average latency 2.3ms, max 4.1ms. All payloads contain primitives only."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "src/stores/__tests__/workspaceStore.cleanup.test.ts",
        "cases": [
          {
            "name": "removeTerminal cleans up all state",
            "verifies": "No stale terminal references after removal, store size decreases"
          },
          {
            "name": "debounce timers cleared on unmount",
            "verifies": "No setState calls after component unmount"
          }
        ]
      },
      {
        "file": "src/stores/__tests__/terminalHistoryStore.limits.test.ts",
        "cases": [
          {
            "name": "history array capped at max size",
            "verifies": "Array length never exceeds 1000, oldest evicted first"
          },
          {
            "name": "memory stable after 1000+ commands",
            "verifies": "Memory growth plateaus at limit, no unbounded growth"
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- State management issue requires architectural redesign (e.g., switching from Zustand)
- IPC optimization needs SharedArrayBuffer or other complex patterns
- Store cleanup conflicts with existing features
- Persistence logic causes data loss or corruption
- Cannot implement bounds without breaking functionality (need user input on trade-offs)
