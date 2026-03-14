import type { WorkspaceLayout, TerminalPane, WorkspaceCreationConfig, AgentConfig } from '../types/workspace';
import { useTerminalHistoryStore } from './terminalHistoryStore';
import { backendAPI } from '../services/wails-bridge';

const generateId = () => Math.random().toString(36).substring(2, 9);

// Default fallback values - will be updated asynchronously when backendAPI is available
let cachedPlatform = 'win32';
let cachedCwd = './';

// Flag to track if platform/cwd have been initialized from backend
let platformInitialized = false;

// Initialize with default values
const getWorkingDirectory = (): string => cachedCwd;

const getShell = (): string => {
  if (cachedPlatform === 'win32') return 'powershell.exe';
  if (cachedPlatform === 'darwin') return '/bin/zsh';
  return '/bin/bash';
};

/**
 * Lazy initialization - call this when component mounts or on user interaction
 * This avoids calling backendAPI before Wails runtime is ready
 */
export const initializePlatformInfo = async (): Promise<void> => {
  if (platformInitialized) return; // Prevent duplicate initialization

  platformInitialized = true;

  try {
    const platform = await backendAPI.getPlatform();
    cachedPlatform = platform;
  } catch (err) {
    console.warn('[WorkspaceStore] Failed to get platform:', err);
  }

  try {
    const cwd = await backendAPI.getCwd();
    cachedCwd = cwd;
  } catch (err) {
    console.warn('[WorkspaceStore] Failed to get cwd:', err);
  }
};

const createDefaultWorkspace = (config: WorkspaceCreationConfig): WorkspaceLayout => {
  const terminals: TerminalPane[] = [];
  const totalTerminals = config.columns * config.rows;

  for (let i = 0; i < totalTerminals; i++) {
    const terminalId = generateId();
    const agentKey = `term-${i}`;
    const fallbackKey = `terminal-${i}`;

    const agentConfig = config.agentAssignments?.[agentKey] ||
      config.agentAssignments?.[fallbackKey] ||
      { type: 'none', enabled: false };

    terminals.push({
      id: terminalId,
      title: `Terminal ${i + 1}`,
      cwd: config.cwd,
      shell: getShell(),
      status: 'stopped',
      agent: agentConfig,
    });
  }

  return {
    id: generateId(),
    name: config.name,
    columns: config.columns,
    rows: config.rows,
    terminals,
    icon: config.icon,
    createdAt: Date.now(),
    lastUsed: Date.now(),
  };
};

// Debounce helper
const createDebounceSave = () => {
  let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const debounceSave = (fn: () => Promise<void>, delay: number) => {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
    }
    saveDebounceTimer = setTimeout(fn, delay);
  };

  debounceSave.clear = () => {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }
  };

  return debounceSave;
};

class WorkspaceStore {
  // State with runes
  currentWorkspace = $state<WorkspaceLayout | null>(null);
  workspaces = $state<WorkspaceLayout[]>([]);
  activeTerminalId = $state<string | null>(null);
  theme = $state<'dark' | 'light'>('dark');
  isWorkspaceModalOpen = $state(false);
  editingWorkspace = $state<WorkspaceLayout | null>(null);
  restartingTerminals = $state<Set<string>>(new Set());

  // Derived state
  activeTerminal = $derived(
    this.currentWorkspace?.terminals.find(t => t.id === this.activeTerminalId) ?? null
  );

  private debounceSave = createDebounceSave();

  constructor() {
    // Auto-load on init
    this.loadWorkspaces();
  }

  isTerminalRestarting(terminalId: string): boolean {
    return this.restartingTerminals.has(terminalId);
  }

  async loadWorkspaces(): Promise<void> {
    try {
      const workspaces = await backendAPI.getWorkspaces();
      // Filter out null/undefined workspaces and those without id
      const validWorkspaces = (workspaces || []).filter((ws: any) => ws && ws.id);
      if (validWorkspaces.length > 0) {
        this.workspaces = validWorkspaces;
        this.setCurrentWorkspace(validWorkspaces[0] || null);
      } else {
        this.workspaces = [];
        this.setCurrentWorkspace(null);
      }
    } catch (err) {
      console.error('[WorkspaceStore] Failed to load workspaces from backend:', err);
      this.workspaces = [];
      this.setCurrentWorkspace(null);
    }
  }

  saveWorkspaces(): void {
    // No-op: workspaces are saved individually via CRUD methods
    // This method is kept for backward compatibility but does nothing
  }

  setCurrentWorkspace(workspace: WorkspaceLayout | null): void {
    const previousWorkspaceId = this.currentWorkspace?.id ?? null;
    this.currentWorkspace = workspace;

    if (previousWorkspaceId && previousWorkspaceId !== workspace?.id) {
      backendAPI.setWorkspaceActive(previousWorkspaceId, false).catch((err: any) => {
        console.error('[WorkspaceStore] Failed to set previous workspace inactive:', err);
      });
    }

    if (workspace?.id && workspace.id !== previousWorkspaceId) {
      backendAPI.setWorkspaceActive(workspace.id, true).catch((err: any) => {
        console.error('[WorkspaceStore] Failed to set workspace active:', err);
      });
    }

    // Validate Vietnamese IME patch when switching to workspace with Claude Code terminals
    backendAPI.validatePatchForWorkspace(workspace).catch((err: any) => {
      console.error('[WorkspaceStore] Patch validation failed:', err);
    });
  }

  async addWorkspace(config: WorkspaceCreationConfig): Promise<WorkspaceLayout> {
    const newWorkspace = createDefaultWorkspace(config);
    console.log('[WorkspaceStore] addWorkspace: created default workspace with', newWorkspace.terminals.length, 'terminals');

    // Convert to backend Workspace format (they should be compatible)
    try {
      console.log('[WorkspaceStore] addWorkspace: calling backendAPI.createWorkspace...');
      const created = await backendAPI.createWorkspace(newWorkspace);
      console.log('[WorkspaceStore] addWorkspace: backend returned:', created);
      if (!created) {
        console.error('[WorkspaceStore] addWorkspace: backend returned null/undefined');
        throw new Error('Backend returned null');
      }
      if (!created.id) {
        console.error('[WorkspaceStore] addWorkspace: backend returned workspace without id');
        throw new Error('Backend returned workspace without id');
      }
      if (!created.terminals || created.terminals.length === 0) {
        console.error('[WorkspaceStore] addWorkspace: backend returned workspace without terminals');
        throw new Error('Backend returned workspace without terminals');
      }
      this.workspaces = [...this.workspaces, created];
      this.setCurrentWorkspace(created);
      return created;
    } catch (err) {
      console.error('[WorkspaceStore] Failed to create workspace in backend:', err);
      // Fallback: add locally only
      this.workspaces = [...this.workspaces, newWorkspace];
      this.setCurrentWorkspace(newWorkspace);
      return newWorkspace;
    }
  }

  async removeWorkspace(id: string): Promise<void> {
    // Kill all terminals in this workspace first
    const workspace = this.workspaces.find(ws => ws.id === id);
    if (workspace?.terminals) {
      await Promise.all(
        workspace.terminals.map(t =>
          backendAPI.terminalKill(t.id).catch(err =>
            console.error(`[WorkspaceStore] Failed to kill terminal ${t.id}:`, err)
          )
        )
      );
    }

    // Delete from backend first
    try {
      await backendAPI.deleteWorkspace(id);
    } catch (err) {
      console.error('[WorkspaceStore] Failed to delete workspace in backend:', err);
    }

    // Update local state
    const updatedWorkspaces = this.workspaces.filter((ws) => ws.id !== id);
    this.workspaces = updatedWorkspaces;
    if (this.currentWorkspace?.id === id) {
      this.setCurrentWorkspace(updatedWorkspaces[0] || null);
    }
  }

  async updateWorkspace(id: string, updates: Partial<WorkspaceLayout>): Promise<void> {
    const updatedWorkspaces = this.workspaces.map(ws =>
      ws.id === id ? { ...ws, ...updates, lastUsed: Date.now() } : ws
    );

    const updatedCurrentWorkspace = this.currentWorkspace?.id === id
      ? { ...this.currentWorkspace, ...updates, lastUsed: Date.now() }
      : this.currentWorkspace;

    this.workspaces = updatedWorkspaces;
    this.currentWorkspace = updatedCurrentWorkspace as WorkspaceLayout | null;

    // Update backend asynchronously
    backendAPI.updateWorkspace(updatedWorkspaces.find(ws => ws.id === id)!)
      .catch((err) => {
        console.error('[WorkspaceStore] Failed to update workspace in backend:', err);
      });
  }

  setActiveTerminal(id: string | null): void {
    this.activeTerminalId = id;
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.theme = theme;
    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  setWorkspaceModalOpen(isOpen: boolean): void {
    if (!isOpen) {
      this.editingWorkspace = null;
    }
    this.isWorkspaceModalOpen = isOpen;
  }

  setWorkspaceModalOpenWithEdit(workspace: WorkspaceLayout): void {
    this.editingWorkspace = workspace;
    this.isWorkspaceModalOpen = true;
  }

  updateTerminalAgent(terminalId: string, agentConfig: AgentConfig): void {
    if (!this.currentWorkspace) return;

    const updatedTerminals = this.currentWorkspace.terminals.map(term =>
      term.id === terminalId ? { ...term, agent: agentConfig } : term
    );

    const updatedWorkspace = {
      ...this.currentWorkspace,
      terminals: updatedTerminals,
    };

    const updatedWorkspaces = this.workspaces.map(ws =>
      ws.id === this.currentWorkspace!.id ? updatedWorkspace : ws
    );

    this.currentWorkspace = updatedWorkspace;
    this.workspaces = updatedWorkspaces;

    // Update backend asynchronously
    backendAPI.updateWorkspace(updatedWorkspace)
      .catch((err) => {
        console.error('[WorkspaceStore] Failed to save after agent update:', err);
      });
  }

  updateTerminalStatus(terminalId: string, status: TerminalPane['status']): void {
    console.log('[WorkspaceStore] updateTerminalStatus called:', terminalId, status);
    if (!this.currentWorkspace) {
      console.warn('[WorkspaceStore] No currentWorkspace, cannot update status');
      return;
    }

    const updatedTerminals = this.currentWorkspace.terminals.map(term =>
      term.id === terminalId ? { ...term, status } : term
    );

    const updatedWorkspace = {
      ...this.currentWorkspace,
      terminals: updatedTerminals,
    };

    const updatedWorkspaces = this.workspaces.map(ws =>
      ws.id === this.currentWorkspace!.id ? updatedWorkspace : ws
    );

    console.log('[WorkspaceStore] Status updated successfully');
    this.currentWorkspace = updatedWorkspace;
    this.workspaces = updatedWorkspaces;
  }

  setTerminalProcessId(terminalId: string, pid: number): void {
    if (!this.currentWorkspace) return;

    const updatedTerminals = this.currentWorkspace.terminals.map(term =>
      term.id === terminalId ? { ...term, processId: pid } : term
    );

    const updatedWorkspace = {
      ...this.currentWorkspace,
      terminals: updatedTerminals,
    };

    const updatedWorkspaces = this.workspaces.map(ws =>
      ws.id === this.currentWorkspace!.id ? updatedWorkspace : ws
    );

    this.currentWorkspace = updatedWorkspace;
    this.workspaces = updatedWorkspaces;
  }

  async removeTerminal(terminalId: string): Promise<void> {
    if (!this.currentWorkspace) return;

    const terminals = this.currentWorkspace.terminals;
    if (terminals.length <= 1) {
      return;
    }

    // Kill terminal process in backend
    try {
      await backendAPI.terminalKill(terminalId);
    } catch (err) {
      console.error('[WorkspaceStore] Failed to kill terminal:', err);
    }

    const updatedTerminals = terminals.filter(t => t.id !== terminalId);

    // Clean up terminal history
    useTerminalHistoryStore.getState().removeTerminalHistory(terminalId);

    // Calculate new grid dimensions
    const totalTerminals = updatedTerminals.length;
    let newColumns = this.currentWorkspace.columns;
    let newRows = this.currentWorkspace.rows;

    const aspectRatio = newColumns / newRows;
    newRows = Math.ceil(Math.sqrt(totalTerminals / aspectRatio));
    newColumns = Math.ceil(totalTerminals / newRows);

    const retitledTerminals = updatedTerminals.map((term, index) => ({
      ...term,
      title: `Terminal ${index + 1}`,
    }));

    const updatedWorkspace = {
      ...this.currentWorkspace,
      terminals: retitledTerminals,
      columns: newColumns,
      rows: newRows,
    };

    const updatedWorkspaces = this.workspaces.map(ws =>
      ws.id === this.currentWorkspace!.id ? updatedWorkspace : ws
    );

    const terminalIndex = terminals.findIndex(t => t.id === terminalId);
    const nextTerminal = retitledTerminals[Math.min(terminalIndex, retitledTerminals.length - 1)];

    this.currentWorkspace = updatedWorkspace;
    this.workspaces = updatedWorkspaces;
    this.activeTerminalId = nextTerminal?.id || null;

    // Update backend asynchronously
    backendAPI.updateWorkspace(updatedWorkspace)
      .catch((err) => {
        console.error('[WorkspaceStore] Failed to save after remove terminal:', err);
      });
  }

  splitTerminal(terminalId: string, direction: 'horizontal' | 'vertical'): void {
    if (!this.currentWorkspace) return;

    const terminals = this.currentWorkspace.terminals;
    const terminalIndex = terminals.findIndex(t => t.id === terminalId);

    if (terminalIndex === -1) return;

    const sourceTerminal = terminals[terminalIndex];
    const newTerminal: TerminalPane = {
      id: generateId(),
      title: `Terminal ${terminals.length + 1}`,
      cwd: sourceTerminal.cwd,
      shell: sourceTerminal.shell,
      status: 'stopped',
      agent: sourceTerminal.agent ? { ...sourceTerminal.agent } : { type: 'none', enabled: false },
    };

    const updatedTerminals = [
      ...terminals.slice(0, terminalIndex + 1),
      newTerminal,
      ...terminals.slice(terminalIndex + 1),
    ];

    let newColumns = this.currentWorkspace.columns;
    let newRows = this.currentWorkspace.rows;

    if (direction === 'vertical') {
      newColumns = Math.min(newColumns + 1, 4);
    } else {
      newRows = Math.min(newRows + 1, 4);
    }

    const updatedWorkspace = {
      ...this.currentWorkspace,
      terminals: updatedTerminals,
      columns: newColumns,
      rows: newRows,
    };

    const updatedWorkspaces = this.workspaces.map(ws =>
      ws.id === this.currentWorkspace!.id ? updatedWorkspace : ws
    );

    this.currentWorkspace = updatedWorkspace;
    this.workspaces = updatedWorkspaces;
    this.activeTerminalId = newTerminal.id;

    // Update backend asynchronously
    backendAPI.updateWorkspace(updatedWorkspace)
      .catch((err) => {
        console.error('[WorkspaceStore] Failed to save after split terminal:', err);
      });
  }

  // Helper methods for keyboard navigation
  getNextWorkspace(): WorkspaceLayout | null {
    if (!this.currentWorkspace || this.workspaces.length <= 1) return null;
    const currentIndex = this.workspaces.findIndex(ws => ws.id === this.currentWorkspace!.id);
    const nextIndex = (currentIndex + 1) % this.workspaces.length;
    return this.workspaces[nextIndex];
  }

  getPreviousWorkspace(): WorkspaceLayout | null {
    if (!this.currentWorkspace || this.workspaces.length <= 1) return null;
    const currentIndex = this.workspaces.findIndex(ws => ws.id === this.currentWorkspace!.id);
    const previousIndex = (currentIndex - 1 + this.workspaces.length) % this.workspaces.length;
    return this.workspaces[previousIndex];
  }

  getNextTerminal(): TerminalPane | null {
    if (!this.currentWorkspace || !this.activeTerminalId) return null;
    const currentIndex = this.currentWorkspace.terminals.findIndex(t => t.id === this.activeTerminalId);
    const nextIndex = (currentIndex + 1) % this.currentWorkspace.terminals.length;
    return this.currentWorkspace.terminals[nextIndex];
  }

  getPreviousTerminal(): TerminalPane | null {
    if (!this.currentWorkspace || !this.activeTerminalId) return null;
    const currentIndex = this.currentWorkspace.terminals.findIndex(t => t.id === this.activeTerminalId);
    const previousIndex = (currentIndex - 1 + this.currentWorkspace.terminals.length) % this.currentWorkspace.terminals.length;
    return this.currentWorkspace.terminals[previousIndex];
  }

  getWorkspaceByIndex(index: number): WorkspaceLayout | null {
    if (index < 0 || index >= this.workspaces.length) return null;
    return this.workspaces[index];
  }

  getTerminalByIndex(terminalIndex: number): TerminalPane | null {
    if (!this.currentWorkspace) return null;
    if (terminalIndex < 0 || terminalIndex >= this.currentWorkspace.terminals.length) return null;
    return this.currentWorkspace.terminals[terminalIndex];
  }

  async restartTerminal(terminalId: string): Promise<void> {
    if (!this.currentWorkspace) return;

    const terminal = this.currentWorkspace.terminals.find(t => t.id === terminalId);
    if (!terminal) return;

    // Add to restarting set to suppress exit events
    const newSet = new Set(this.restartingTerminals);
    newSet.add(terminalId);
    this.restartingTerminals = newSet;

    try {
      await backendAPI.terminalKill(terminalId);
    } catch (err) {
      console.error('[WorkspaceStore] Failed to kill terminal for restart:', err);
    }

    this.updateTerminalStatus(terminalId, 'stopped');
    // Increase delay from 100ms to 200ms for consistency with switchTerminalAgent
    // This ensures batcher flushes all pending data before respawning
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      let result;
      if (terminal.agent?.enabled && terminal.agent.type !== 'none') {
        result = await backendAPI.spawnTerminalWithAgent(
          terminalId,
          terminal.cwd,
          terminal.agent,
          this.currentWorkspace.id,
          0,
          0
        );
      } else {
        result = await backendAPI.spawnTerminal(
          terminalId,
          terminal.cwd,
          this.currentWorkspace.id,
          0,
          0
        );
      }

      if (result.success) {
        this.updateTerminalStatus(terminalId, 'running');
        if (result.pid) {
          this.setTerminalProcessId(terminalId, result.pid);
        }
      }
    } catch (err) {
      console.error('[WorkspaceStore] Failed to restart terminal:', err);
      this.updateTerminalStatus(terminalId, 'error');
    } finally {
      setTimeout(() => {
        const cleanupSet = new Set(this.restartingTerminals);
        cleanupSet.delete(terminalId);
        this.restartingTerminals = cleanupSet;
      }, 500);
    }
  }

  async switchTerminalAgent(terminalId: string, newAgentType: string): Promise<void> {
    if (!this.currentWorkspace) return;

    const terminal = this.currentWorkspace.terminals.find(t => t.id === terminalId);
    if (!terminal) return;

    const wasRunning = terminal.status === 'running';

    // Add to restarting set
    const newSet = new Set(this.restartingTerminals);
    newSet.add(terminalId);
    this.restartingTerminals = newSet;

    // Kill current process
    if (wasRunning) {
      try {
        await backendAPI.terminalKill(terminalId);
      } catch (err) {
        console.error('[WorkspaceStore] Failed to kill terminal for agent switch:', err);
      }
    }

    // Update agent config
    const newAgentConfig: AgentConfig = {
      type: newAgentType as any,
      enabled: newAgentType !== 'none',
    };
    this.updateTerminalAgent(terminalId, newAgentConfig);

    // Wait for batcher to flush
    await new Promise(resolve => setTimeout(resolve, 200));

    // Spawn with new agent if it was running
    if (wasRunning) {
      try {
        const result = await backendAPI.spawnTerminalWithAgent(
          terminalId,
          terminal.cwd,
          newAgentConfig,
          this.currentWorkspace.id,
          0,
          0
        );

        if (result.success) {
          this.updateTerminalStatus(terminalId, 'running');
          if (result.pid) {
            this.setTerminalProcessId(terminalId, result.pid);
          }
        } else {
          this.updateTerminalStatus(terminalId, 'error');
        }
      } catch (err) {
        console.error('[WorkspaceStore] Failed to spawn with new agent:', err);
        this.updateTerminalStatus(terminalId, 'error');
      }
    } else {
      this.updateTerminalStatus(terminalId, 'stopped');
    }

    // Remove from restarting set
    setTimeout(() => {
      const cleanupSet = new Set(this.restartingTerminals);
      cleanupSet.delete(terminalId);
      this.restartingTerminals = cleanupSet;
    }, 500);
  }

  swapTerminals(sourceId: string, targetId: string): void {
    if (!this.currentWorkspace) return;

    const sourceIndex = this.currentWorkspace.terminals.findIndex(t => t.id === sourceId);
    const targetIndex = this.currentWorkspace.terminals.findIndex(t => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const terminals = [...this.currentWorkspace.terminals];
    const [sourceTerminal] = terminals.splice(sourceIndex, 1);
    terminals.splice(targetIndex, 0, sourceTerminal);

    const updatedWorkspace = {
      ...this.currentWorkspace,
      terminals,
    };

    const updatedWorkspaces = this.workspaces.map(ws =>
      ws.id === this.currentWorkspace!.id ? updatedWorkspace : ws
    );

    this.currentWorkspace = updatedWorkspace;
    this.workspaces = updatedWorkspaces;

    // Update backend asynchronously
    backendAPI.updateWorkspace(updatedWorkspace)
      .catch((err) => {
        console.error('[WorkspaceStore] Failed to save after swap terminals:', err);
      });
  }
}

// Export singleton instance
export const workspaceStore = new WorkspaceStore();
export default workspaceStore;
