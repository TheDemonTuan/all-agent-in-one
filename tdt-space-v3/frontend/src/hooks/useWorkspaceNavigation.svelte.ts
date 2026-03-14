import { workspaceStore } from '../stores';

/**
 * Helper for workspace navigation - returns navigation functions
 * that work with the workspace store.
 */
export function useWorkspaceNavigation() {
  function nextWorkspace() {
    const next = workspaceStore.getNextWorkspace();
    if (next) {
      workspaceStore.setCurrentWorkspace(next);
      return next;
    }
    return null;
  }

  function previousWorkspace() {
    const prev = workspaceStore.getPreviousWorkspace();
    if (prev) {
      workspaceStore.setCurrentWorkspace(prev);
      return prev;
    }
    return null;
  }

  function switchToWorkspaceByIndex(index: number) {
    const workspaces = workspaceStore.workspaces;
    if (index < 0 || index >= workspaces.length) {
      return null;
    }
    const workspace = workspaceStore.getWorkspaceByIndex(index);
    if (workspace) {
      workspaceStore.setCurrentWorkspace(workspace);
      return workspace;
    }
    return null;
  }

  function getCurrentWorkspaceIndex() {
    const currentWorkspace = workspaceStore.currentWorkspace;
    const workspaces = workspaceStore.workspaces;
    if (!currentWorkspace) {
      return -1;
    }
    return workspaces.findIndex(ws => ws.id === currentWorkspace.id);
  }

  return {
    nextWorkspace,
    previousWorkspace,
    switchToWorkspaceByIndex,
    getCurrentWorkspaceIndex,
    get workspaceCount() { return workspaceStore.workspaces.length; },
    get currentWorkspace() { return workspaceStore.currentWorkspace; },
  };
}

// Also export a singleton instance for convenience
export const workspaceNavigation = useWorkspaceNavigation();
export default workspaceNavigation;
