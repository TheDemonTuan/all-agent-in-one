/**
 * Wails API Wrapper
 * Provides compatibility layer between Electron API and Wails bindings
 */

import * as app from '../../bindings/tdt-space-wails/app';

// Import Wails runtime
const WailsRuntime = (window as any).Wails?.Runtime;

// Events helper
const EventsOn = (eventName: string, callback: (...args: any[]) => void) => {
  if (WailsRuntime) {
    WailsRuntime.EventsOn(eventName, callback);
  }
};

const EventsOff = (eventName: string) => {
  if (WailsRuntime) {
    WailsRuntime.EventsOff(eventName);
  }
};

// WailsAPI provides the same interface as electronAPI
export const wailsAPI = {
  // App info
  getAppVersion: async () => {
    return await app.GetAppVersion();
  },
  getPlatform: async () => {
    const platform = await app.GetPlatform();
    return platform;
  },
  getCwd: async () => {
    return await app.GetCwd();
  },

  // Window controls
  windowMinimize: async () => {
    // Use Wails Runtime API directly
    const runtime = (window as any).Wails?.Runtime;
    if (runtime) {
      // Try multiple method names for compatibility
      if (runtime.WindowMinimise) {
        runtime.WindowMinimise();
      } else if (runtime.Minimise) {
        runtime.Minimise();
      } else {
        // Fallback to Go method (logs only in v3 alpha)
        await app.WindowMinimize();
      }
    }
  },
  windowMaximize: async () => {
    const runtime = (window as any).Wails?.Runtime;
    if (runtime) {
      // Try multiple method names for compatibility
      if (runtime.WindowToggleMaximise) {
        runtime.WindowToggleMaximise();
      } else if (runtime.ToggleMaximise) {
        runtime.ToggleMaximise();
      } else if (runtime.WindowMaximise) {
        runtime.WindowMaximise();
      } else {
        await app.WindowMaximize();
      }
    }
  },
  windowClose: async () => {
    const runtime = (window as any).Wails?.Runtime;
    if (runtime && runtime.Quit) {
      runtime.Quit();
    } else {
      await app.WindowClose();
    }
  },

  // Store management
  getStoreValue: async (key: string) => {
    return await app.GetStoreValue(key);
  },
  setStoreValue: async (key: string, value: any) => {
    await app.SetStoreValue(key, value);
  },

  // File dialogs
  showOpenDialog: async (options: any) => {
    // Use Wails Runtime API directly for file dialogs
    const runtime = (window as any).Wails?.Runtime;
    if (runtime) {
      try {
        // Check if opening directory
        const properties = options?.properties || ['openFile'];
        const openDirectory = properties.includes('openDirectory') || properties.includes('openFolder');

        if (openDirectory && runtime.OpenDirectoryDialog) {
          const result = await runtime.OpenDirectoryDialog({
            title: options?.title || 'Select Folder',
            defaultPath: options?.defaultPath || '',
          });
          if (result) {
            return { canceled: false, filePaths: [result] };
          }
          return { canceled: true, filePaths: [] };
        }

        if (runtime.OpenFileDialog) {
          const result = await runtime.OpenFileDialog({
            title: options?.title || 'Select File',
            defaultPath: options?.defaultPath || '',
          });
          if (result) {
            return { canceled: false, filePaths: [result] };
          }
          return { canceled: true, filePaths: [] };
        }
      } catch (e) {
        console.warn('Wails Runtime dialog failed, using fallback:', e);
      }
    }
    // Fallback to Go method
    return await app.ShowOpenDialog(options);
  },

  // DevTools toggle (Wails specific)
  toggleDevTools: async () => {
    const runtime = (window as any).Wails?.Runtime;
    if (runtime && runtime.ToggleDevTools) {
      runtime.ToggleDevTools();
    }
  },

  // Workspace management
  createWorkspace: async (config: any) => {
    return await app.CreateWorkspace(config);
  },
  deleteWorkspace: async (id: string) => {
    await app.DeleteWorkspace(id);
  },
  switchWorkspace: async (id: string) => {
    await app.SwitchWorkspace(id);
  },
  getWorkspaces: async () => {
    return await app.GetWorkspaces();
  },
  validatePatchForWorkspace: async (workspace: any) => {
    return await app.ValidatePatchForWorkspace(workspace);
  },

  // Terminal management
  spawnTerminal: async (params: { id: string; cwd: string; workspaceId?: string }) => {
    const [success, pid, error] = await app.SpawnTerminal(params.id, params.cwd, params.workspaceId || '');
    return { success, pid, error: error || undefined };
  },
  spawnTerminalWithAgent: async (params: { id: string; cwd: string; agentConfig: any; workspaceId?: string }) => {
    const [success, pid, error] = await app.SpawnTerminalWithAgent(params.id, params.cwd, params.workspaceId || '', params.agentConfig);
    return { success, pid, error: error || undefined };
  },
  terminalWrite: async (id: string, data: string) => {
    await app.WriteToTerminal(id, data);
  },
  terminalKill: async (id: string) => {
    const [success, error] = await app.KillTerminal(id);
    return { success, error: error || undefined };
  },
  terminalResize: async (id: string, cols: number, rows: number) => {
    await app.ResizeTerminal(id, cols, rows);
  },
  cleanupWorkspaceTerminals: async (workspaceId: string) => {
    // Handled in Go on app shutdown
    return { success: true, cleaned: 0 };
  },

  // Template management
  getTemplates: async () => {
    return await app.GetTemplates();
  },
  saveTemplate: async (template: any) => {
    await app.SaveTemplate(template);
  },
  deleteTemplate: async (id: string) => {
    await app.DeleteTemplate(id);
  },

  // Terminal command history
  getTerminalHistory: async (terminalId: string) => {
    return await app.GetTerminalHistory(terminalId);
  },
  saveTerminalHistory: async (terminalId: string, history: any[]) => {
    await app.SaveTerminalHistory(terminalId, history);
  },
  clearTerminalHistory: async (terminalId: string) => {
    await app.ClearTerminalHistory(terminalId);
  },

  // Vietnamese IME patch
  applyVietnameseImePatch: async () => {
    return await app.ApplyVietnameseImePatch();
  },
  checkVietnameseImePatchStatus: async () => {
    return await app.CheckVietnameseImePatchStatus();
  },
  getVietnameseImeSettings: async () => {
    return await app.GetVietnameseImeSettings();
  },
  setVietnameseImeSettings: async (settings: any) => {
    await app.SetVietnameseImeSettings(settings);
  },
  restartClaudeTerminals: async (workspaceId: string, terminals: any[]) => {
    // Will be implemented if needed
    return { success: true };
  },
  restoreVietnameseImePatch: async () => {
    return await app.RestoreVietnameseImePatch();
  },
  validateVietnameseImePatch: async () => {
    return await app.ValidateVietnameseImePatch();
  },
  onVietnameseImePatchApplied: (callback: (result: any) => void) => {
    const eventName = 'vietnamese-ime-patch-applied';
    EventsOn(eventName, callback);
    return () => EventsOff(eventName);
  },

  // Terminal events
  onTerminalData: (callback: (data: { id: string; data: string }) => void) => {
    const eventName = 'terminal-data';
    EventsOn(eventName, callback);
    return () => EventsOff(eventName);
  },
  onTerminalStarted: (callback: (data: { id: string }) => void) => {
    const eventName = 'terminal-started';
    EventsOn(eventName, callback);
    return () => EventsOff(eventName);
  },
  onTerminalExit: (callback: (data: { id: string; code?: number; signal?: string }) => void) => {
    const eventName = 'terminal-exit';
    EventsOn(eventName, callback);
    return () => EventsOff(eventName);
  },
  onTerminalError: (callback: (data: { id: string; error: string }) => void) => {
    const eventName = 'terminal-error';
    EventsOn(eventName, callback);
    return () => EventsOff(eventName);
  },
};

// Export as window.electronAPI for compatibility
declare global {
  interface Window {
    electronAPI: typeof wailsAPI;
  }
}

// Initialize
if (typeof window !== 'undefined') {
  window.electronAPI = wailsAPI;
}
