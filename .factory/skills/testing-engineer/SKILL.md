---
name: testing-engineer
description: Sets up testing infrastructure, memory profiling tools, and automated test suites
---

# Testing Engineer Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Setting up test frameworks (Vitest, Playwright, React Testing Library)
- Creating memory profiling utilities
- Writing comprehensive test suites for critical modules
- Setting up CI/CD test pipelines
- Creating test fixtures and seed data

## Work Procedure

### 1. Investigation Phase
- Read the feature description and understand testing requirements
- Check existing test infrastructure (or lack thereof)
- Identify critical modules needing test coverage
- Research best practices for testing Electron + React apps

### 2. Infrastructure Setup
**Install Dependencies:**
- `bun add -d vitest @playwright/test @testing-library/react jsdom`
- `bun add -d @types/node` (if needed)
- `bun add @xterm/addon-webgl` (for WebGL testing)

**Create Configuration:**
- `vitest.config.ts` - Vitest configuration with path aliases
- `playwright.config.ts` - Playwright configuration for Electron
- `src/test/setup.ts` - Test setup and utilities
- Update `package.json` with test scripts

**Directory Structure:**
- `src/**/__tests__/` - Unit and component tests
- `tests/e2e/` - Playwright E2E tests
- `tests/performance/` - Performance and memory tests
- `src/test/` - Test utilities and fixtures

### 3. Implementation
**Memory Profiling Utilities:**
- Create `MemoryProfiler` class for heap snapshots
- Implement IPC handler for memory queries
- Add periodic memory logging in dev mode
- Create memory comparison utilities

**Test Suites:**
- Write tests for critical paths (terminal spawn/dispose, workspace switch)
- Create memory leak detection tests
- Write performance regression tests
- Ensure >80% coverage for critical modules

### 4. Verification
**Test Execution:**
- Run `bun run test` - all tests must pass
- Run `bun run test:coverage` - verify >80% coverage
- Run `bun run test:e2e` - E2E tests pass
- Run memory leak tests - verify detection works

**Manual Verification:**
- Run app in dev mode, verify memory logging works
- Take heap snapshots with MemoryProfiler
- Verify memory comparison shows accurate deltas
- Test E2E flows manually to confirm test accuracy

**Code Quality:**
- Run `bun run lint` - no errors
- Run `bun run typecheck` - no type errors

### 5. Documentation
- Update `.factory/library/testing-infrastructure.md` with setup guide
- Document memory profiling usage
- Add test writing guidelines for future development

## Example Handoff

```json
{
  "salientSummary": "Set up comprehensive testing infrastructure with Vitest (unit/component), Playwright (E2E), and memory profiling utilities. Achieved 85% coverage for critical modules. Memory profiler functional with heap snapshot comparison.",
  "whatWasImplemented": "Installed Vitest, Playwright, React Testing Library. Created vitest.config.ts, playwright.config.ts, test setup utilities. Implemented MemoryProfiler class with takeSnapshot() and compareSnapshots(). Created test suites for workspaceStore, TerminalCell, IPC handlers. Added periodic memory logging in dev mode.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "bun run test",
        "exitCode": 0,
        "observation": "42 passing tests across 8 test files"
      },
      {
        "command": "bun run test:coverage",
        "exitCode": 0,
        "observation": "85% line coverage, 82% branch coverage for critical modules"
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
        "action": "Run app in dev mode, wait 30 seconds, check console for memory logs",
        "observed": "Memory logged every 10 seconds: 'Memory: 125MB, delta: +2.3MB'. MemoryProfiler.takeSnapshot() functional."
      },
      {
        "action": "Take heap snapshot before and after 10 workspace switches, compare",
        "observed": "MemoryProfiler.compareSnapshots() shows +1.8MB delta. Terminal objects properly disposed."
      },
      {
        "action": "Run E2E test: workspace switching stress test",
        "observed": "Playwright test passes, verifies no memory accumulation after 10 switches"
      },
      {
        "action": "Run memory leak detection test",
        "observed": "Test fails when memory growth >20MB per 50 terminals (as designed). Confirms leak detection works."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "src/stores/__tests__/workspaceStore.test.ts",
        "cases": [
          {
            "name": "creates workspace with terminals",
            "verifies": "Workspace created with correct terminal configuration"
          },
          {
            "name": "switches workspace and cleans up old terminals",
            "verifies": "Old terminals killed, new terminals spawned"
          },
          {
            "name": "memory leak detection: 10 workspace switches",
            "verifies": "Memory growth <10MB after 10 switches"
          }
        ]
      },
      {
        "file": "src/components/terminals/__tests__/TerminalCell.test.tsx",
        "cases": [
          {
            "name": "renders terminal and initializes xterm",
            "verifies": "Terminal DOM element created, xterm instance initialized"
          },
          {
            "name": "cleanup disposes all resources",
            "verifies": "dispose() called on terminal, addons, listeners removed"
          },
          {
            "name": "handles rapid spawn/kill cycles",
            "verifies": "No errors when terminal recreated within 100ms"
          }
        ]
      },
      {
        "file": "tests/e2e/workspace-switching.spec.ts",
        "cases": [
          {
            "name": "workspace switching stress test",
            "verifies": "No memory accumulation after 10+ switches, no orphaned processes"
          }
        ]
      },
      {
        "file": "tests/performance/memory-leak-detection.spec.ts",
        "cases": [
          {
            "name": "detects memory leaks in terminal lifecycle",
            "verifies": "Test fails when memory growth >20MB per 50 terminals"
          },
          {
            "name": "extended session stability",
            "verifies": "Memory stable within ±5% over 30-minute session"
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Testing infrastructure conflicts with existing build configuration
- Playwright cannot launch Electron app (need environment setup)
- Memory profiling requires Chrome DevTools protocol changes
- Test coverage target unachievable without major refactoring
- CI/CD pipeline integration needs external services or credentials
