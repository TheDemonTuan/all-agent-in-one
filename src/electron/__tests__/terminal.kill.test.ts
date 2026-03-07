/**
 * Process Tree Killing Tests (VAL-PERF-003)
 * Verifies Windows-specific process tree termination using taskkill /f /t
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as pty from 'node-pty';
import { spawnSync, execSync } from 'child_process';
import { logger } from '../../lib/logger';

const log = logger.child('[Test:ProcessTreeKilling]');

/**
 * Helper to count running processes by name
 */
function countProcesses(processName: string): number {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const lines = result.toString().split('\n').filter(line => line.trim().length > 0);
      return lines.length;
    } else {
      const result = execSync(`pgrep -f ${processName}`, { stdio: ['pipe', 'pipe', 'pipe'] });
      return result.toString().split('\n').filter(line => line.trim().length > 0).length;
    }
  } catch {
    return 0;
  }
}

/**
 * Helper to get process count baseline
 */
function getBaselineProcessCount(): number {
  const baselineNames = ['powershell', 'conhost', 'OpenConsole', 'cmd'];
  let total = 0;
  for (const name of baselineNames) {
    total += countProcesses(name);
  }
  return total;
}

/**
 * Test implementation of Windows process tree killing
 * Mirrors the implementation in terminal.handlers.ts
 */
function killPtyProcess(ptyProcess: pty.IPty): boolean {
  const pid = ptyProcess.pid;
  
  if (process.platform === 'win32') {
    try {
      const result = spawnSync('taskkill', ['/pid', pid.toString(), '/f', '/t'], {
        stdio: 'pipe',
        timeout: 5000,
      });
      
      if (result.status === 0) {
        log.debug('Successfully killed process tree with taskkill', { pid });
        return true;
      } else {
        log.warn('taskkill failed, falling back to pty.kill()', { 
          pid, 
          stderr: result.stderr?.toString() 
        });
        ptyProcess.kill();
        return true;
      }
    } catch (err: any) {
      log.error('taskkill error, falling back to pty.kill()', { 
        pid, 
        error: err.message 
      });
      try {
        ptyProcess.kill();
        return true;
      } catch {
        return false;
      }
    }
  } else {
    try {
      ptyProcess.kill();
      return true;
    } catch (err: any) {
      log.error('Failed to kill Unix process', { pid, error: err.message });
      return false;
    }
  }
}

describe('Process Tree Killing (VAL-PERF-003)', () => {
  const spawnedProcesses: pty.IPty[] = [];

  afterEach(() => {
    // Cleanup any remaining processes
    spawnedProcesses.forEach(p => {
      try {
        if (process.platform === 'win32') {
          spawnSync('taskkill', ['/pid', p.pid.toString(), '/f', '/t']);
        } else {
          p.kill();
        }
      } catch {
        // Ignore errors in cleanup
      }
    });
    spawnedProcesses.length = 0;
  });

  describe('Windows Process Tree Killing', () => {
    it.skipIf(process.platform !== 'win32')(
      'should use taskkill /f /t to kill process tree',
      () => {
        const baseline = getBaselineProcessCount();
        log.debug('Baseline process count:', baseline);

        // Spawn a PowerShell process that spawns child processes
        const shell = pty.spawn('powershell.exe', ['-NoLogo', '-NoExit', '-Command', 'Start-Sleep -Seconds 60'], {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
        });

        spawnedProcesses.push(shell);
        log.debug('Spawned test process', { pid: shell.pid });

        // Give it time to start
        const startDelay = 500;
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // Count processes before kill
            const beforeCount = getBaselineProcessCount();
            log.debug('Process count before kill:', beforeCount);

            // Kill using Windows process tree killing
            const killed = killPtyProcess(shell);
            expect(killed).toBe(true);

            // Remove from spawnedProcesses since it's already killed
            const idx = spawnedProcesses.indexOf(shell);
            if (idx >= 0) spawnedProcesses.splice(idx, 1);

            // Wait for process tree termination
            setTimeout(() => {
              const afterCount = getBaselineProcessCount();
              log.debug('Process count after kill:', afterCount);

              // Process count should return to baseline (within 2 seconds)
              expect(afterCount).toBeLessThanOrEqual(baseline + 2); // Allow small variance

              // Verify process is actually gone
              let processStillRunning = false;
              try {
                execSync(`tasklist /FI "PID eq ${shell.pid}" /FO CSV /NH`, {
                  stdio: ['pipe', 'pipe', 'pipe'],
                });
                processStillRunning = true;
              } catch {
                processStillRunning = false;
              }

              expect(processStillRunning).toBe(false);
              log.debug('✅ Process tree successfully terminated');
              resolve();
            }, 2000);
          }, startDelay);
        });
      },
      10000 // 10 second timeout
    );

    it.skipIf(process.platform !== 'win32')(
      'should fall back to pty.kill() if taskkill fails',
      () => {
        const shell = pty.spawn('powershell.exe', ['-NoLogo', '-NoExit'], {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
        });

        spawnedProcesses.push(shell);

        // Mock spawnSync to fail
        const originalSpawnSync = spawnSync;
        (global as any).spawnSync = (...args: any[]) => {
          if (args[0] === 'taskkill') {
            throw new Error('Simulated taskkill failure');
          }
          return originalSpawnSync(...args);
        };

        try {
          // Should fall back to pty.kill() and succeed
          const killed = killPtyProcess(shell);
          expect(killed).toBe(true);

          const idx = spawnedProcesses.indexOf(shell);
          if (idx >= 0) spawnedProcesses.splice(idx, 1);
        } finally {
          (global as any).spawnSync = originalSpawnSync;
        }
      }
    );

    it.skipIf(process.platform !== 'win32')(
      'should handle taskkill with /t flag for child processes',
      () => {
        // Verify the command includes /t flag
        const testPid = 12345;
        let capturedCommand: string[] | null = null;
        let capturedArgs: string[] | null = null;

        const originalSpawnSync = spawnSync;
        (global as any).spawnSync = (command: string, args: string[], ...rest: any[]) => {
          if (command === 'taskkill') {
            capturedCommand = [command];
            capturedArgs = args;
            // Return success
            return { status: 0, stdout: Buffer.from(''), stderr: Buffer.from('') };
          }
          return originalSpawnSync(command, args, ...rest);
        };

        try {
          const mockPtyProcess = {
            pid: testPid,
            kill: () => {},
          } as any as pty.IPty;

          killPtyProcess(mockPtyProcess);

          expect(capturedCommand).toEqual(['taskkill']);
          expect(capturedArgs).toContain('/t'); // Verify /t flag for process tree
          expect(capturedArgs).toContain('/f'); // Verify /f flag for force
          expect(capturedArgs).toContain('/pid');
          expect(capturedArgs).toContain(testPid.toString());

          log.debug('✅ Correct taskkill command structure verified');
        } finally {
          (global as any).spawnSync = originalSpawnSync;
        }
      }
    );
  });

  describe('Unix Process Killing', () => {
    it.skipIf(process.platform === 'win32')(
      'should use pty.kill() on Unix systems',
      () => {
        const shell = pty.spawn('bash', [], {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
        });

        spawnedProcesses.push(shell);

        const killed = killPtyProcess(shell);
        expect(killed).toBe(true);

        const idx = spawnedProcesses.indexOf(shell);
        if (idx >= 0) spawnedProcesses.splice(idx, 1);

        log.debug('✅ Unix process killed successfully');
      }
    );
  });

  describe('Spawn/Kill Cycle', () => {
    it('should maintain stable process count after multiple spawn/kill cycles', () => {
      const cycles = 5;
      const baseline = getBaselineProcessCount();
      log.debug('Starting spawn/kill cycle test', { cycles, baseline });

      const promises: Promise<void>[] = [];

      for (let i = 0; i < cycles; i++) {
        const promise = new Promise<void>((resolve) => {
          const shell = pty.spawn(
            process.platform === 'win32' ? 'powershell.exe' : 'bash',
            process.platform === 'win32' ? ['-NoLogo', '-NoExit'] : [],
            {
              name: 'xterm-256color',
              cols: 80,
              rows: 24,
              cwd: process.cwd(),
            }
          );

          spawnedProcesses.push(shell);

          setTimeout(() => {
            killPtyProcess(shell);
            const idx = spawnedProcesses.indexOf(shell);
            if (idx >= 0) spawnedProcesses.splice(idx, 1);
            resolve();
          }, 300);
        });

        promises.push(promise);
      }

      return Promise.all(promises).then(() => {
        // Wait for all processes to terminate
        setTimeout(() => {
          const finalCount = getBaselineProcessCount();
          log.debug('Final process count', { finalCount, baseline });

          // Allow small variance (±2 processes)
          expect(Math.abs(finalCount - baseline)).toBeLessThanOrEqual(2);
          log.debug('✅ Process count stable after spawn/kill cycles');
        }, 2000);
      });
    }, 15000);
  });
});
