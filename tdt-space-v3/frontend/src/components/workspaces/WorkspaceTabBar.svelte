<script lang="ts">
  import { workspaceStore } from '../../stores';
  import './WorkspaceTabBar.css';

  // Local state
  let contextMenu = $state<{ x: number; y: number; workspaceId: string } | null>(null);
  let deleteModal = $state<{ isOpen: boolean; workspaceId: string; workspaceName: string } | null>(null);
  let renameModal = $state<{ workspaceId: string; currentName: string } | null>(null);
  let renameInputValue = $state('');

  // Derived state from store
  let workspaces = $derived(workspaceStore.workspaces);
  let currentWorkspace = $derived(workspaceStore.currentWorkspace);
  let isWorkspaceModalOpen = $derived(workspaceStore.isWorkspaceModalOpen);
  let editingWorkspace = $derived(workspaceStore.editingWorkspace);

  let isDeleteAll = $derived(deleteModal?.workspaceId === 'ALL');

  function getTerminalCount(workspaceId: string): number {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    return workspace?.terminals?.length || 0;
  }

  let totalTerminals = $derived(
    workspaces.filter(Boolean).reduce((acc, ws) => acc + getTerminalCount(ws.id), 0)
  );

  function handleContextMenu(e: MouseEvent, workspaceId: string) {
    e.preventDefault();
    e.stopPropagation();
    contextMenu = { x: e.clientX, y: e.clientY, workspaceId };
  }

  function requestDelete(id: string, name: string) {
    deleteModal = { isOpen: true, workspaceId: id, workspaceName: name };
    contextMenu = null;
  }

  function confirmDelete() {
    if (deleteModal) {
      workspaceStore.removeWorkspace(deleteModal.workspaceId);
      deleteModal = null;
    }
  }

  function cancelDelete() {
    deleteModal = null;
  }

  function handleRename(id: string) {
    const workspace = workspaces.find(ws => ws.id === id);
    if (!workspace) return;
    renameModal = { workspaceId: id, currentName: workspace.name };
    renameInputValue = workspace.name;
    contextMenu = null;
  }

  function confirmRename() {
    if (renameModal && renameInputValue.trim()) {
      workspaceStore.updateWorkspace(renameModal.workspaceId, { name: renameInputValue.trim() });
      renameModal = null;
    }
  }

  function cancelRename() {
    renameModal = null;
  }

  function handleEditLayout(id: string) {
    const workspace = workspaces.find(ws => ws.id === id);
    if (!workspace) return;
    workspaceStore.setWorkspaceModalOpenWithEdit(workspace);
    contextMenu = null;
  }

  function handleDeleteAll() {
    deleteModal = { isOpen: true, workspaceId: 'ALL', workspaceName: 'all workspaces' };
  }

  function confirmDeleteAll() {
    const idsToDelete = workspaces.map(ws => ws.id);
    idsToDelete.forEach(id => workspaceStore.removeWorkspace(id));
    deleteModal = null;
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  function handleWorkspaceClick(workspaceId: string) {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      workspaceStore.setCurrentWorkspace(ws);
    }
  }

  // Close context menu on click outside
  $effect(() => {
    if (contextMenu) {
      const handleClick = () => {
        closeContextMenu();
        renameModal = null;
      };
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  });
</script>

<div class="workspace-tab-bar">
  <div class="tabs-container" role="tablist" aria-label="Workspaces">
    {#each workspaces.filter(Boolean) as workspace (workspace.id)}
      {@const isActive = currentWorkspace?.id === workspace.id}
      {@const terminalCount = getTerminalCount(workspace.id)}
      <div
        class="workspace-tab"
        class:active={isActive}
        onclick={() => handleWorkspaceClick(workspace.id)}
        oncontextmenu={(e) => handleContextMenu(e, workspace.id)}
        title="{workspace.name} - {terminalCount} terminal{terminalCount !== 1 ? 's' : ''}"
        role="tab"
        aria-selected={isActive}
        tabindex={isActive ? 0 : -1}
      >
        <span class="tab-icon" aria-hidden="true">{workspace.icon || '📁'}</span>
        <span class="tab-name">{workspace.name}</span>
        <span class="terminal-badge" aria-label="{terminalCount} terminal{terminalCount !== 1 ? 's' : ''}">
          {terminalCount}
        </span>
        <button
          class="tab-close-btn"
          onclick={(e) => {
            e.stopPropagation();
            requestDelete(workspace.id, workspace.name);
          }}
          title="Delete workspace"
          aria-label="Delete {workspace.name}"
        >
          ×
        </button>
      </div>
    {/each}

    <button
      class="add-workspace-tab"
      onclick={() => workspaceStore.setWorkspaceModalOpen(true)}
      title="New Workspace"
      aria-label="Create new workspace"
    >
      <span class="add-workspace-icon">+</span>
    </button>
  </div>

  <div class="tab-actions">
    {#if totalTerminals > 0}
      <div class="total-count-badge" title="Total: {totalTerminals} terminal{totalTerminals !== 1 ? 's' : ''}">
        <span class="total-count-icon">📊</span>
        <span class="total-count-number">{totalTerminals}</span>
      </div>
    {/if}

    {#if currentWorkspace}
      <button
        class="action-btn edit-layout-btn"
        onclick={() => workspaceStore.setWorkspaceModalOpenWithEdit(currentWorkspace)}
        title="Edit Current Layout"
        aria-label="Edit current workspace layout"
      >
        <span class="btn-icon-settings">⚙️</span>
      </button>
    {/if}

    {#if workspaces.length > 1}
      <button
        class="action-btn delete-all-btn"
        onclick={handleDeleteAll}
        title="Delete All Workspaces"
        aria-label="Delete all workspaces"
      >
        <span class="btn-icon-delete">🗑️</span>
      </button>
    {/if}
  </div>
</div>

<!-- Context Menu -->
{#if contextMenu}
  <div
    class="context-menu"
    style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
    role="menu"
    aria-label="Workspace actions"
  >
    <div
      class="context-menu-item"
      onclick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (contextMenu) handleEditLayout(contextMenu.workspaceId);
      }}
      role="menuitem"
    >
      <span class="context-menu-icon settings">⚙️</span>
      <span>Edit Layout</span>
    </div>
    <div
      class="context-menu-item"
      onclick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (contextMenu) handleRename(contextMenu.workspaceId);
      }}
      role="menuitem"
    >
      <span class="context-menu-icon edit">✏️</span>
      <span>Rename</span>
    </div>
    <div class="context-menu-divider" />
    <div
      class="context-menu-item danger"
      onclick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (contextMenu) {
          const ws = workspaces.find(w => w.id === contextMenu!.workspaceId);
          if (ws) requestDelete(contextMenu!.workspaceId, ws.name);
        }
      }}
      role="menuitem"
    >
      <span class="context-menu-icon delete">🗑️</span>
      <span>Delete</span>
    </div>
  </div>
{/if}

<!-- Rename Modal -->
{#if renameModal}
  <div class="modal-overlay" onclick={cancelRename}>
    <div class="rename-modal" onclick={(e) => e.stopPropagation()}>
      <div class="rename-modal-header">
        <span class="rename-modal-icon">✏️</span>
        <h3 class="rename-modal-title">Rename Workspace</h3>
      </div>
      <form onsubmit={(e) => { e.preventDefault(); confirmRename(); }}>
        <input
          type="text"
          class="rename-input"
          bind:value={renameInputValue}
          placeholder="Enter workspace name"
          maxlength={50}
          autofocus
        />
        <div class="rename-modal-actions">
          <button type="button" class="btn-cancel" onclick={cancelRename}>
            Cancel
          </button>
          <button type="submit" class="btn-rename" disabled={!renameInputValue.trim()}>
            Rename
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Delete Modal -->
{#if deleteModal}
  <div class="modal-overlay" onclick={cancelDelete}>
    <div class="delete-modal" onclick={(e) => e.stopPropagation()}>
      <div class="delete-modal-icon-wrapper">
        <span class="delete-modal-icon">{isDeleteAll ? '⚠️' : '🗑️'}</span>
      </div>
      <h3 class="delete-modal-title">{isDeleteAll ? 'Delete All Workspaces' : 'Delete Workspace'}</h3>
      <p class="delete-modal-description">
        {#if isDeleteAll}
          Are you sure you want to delete <strong>all {workspaces.length} workspaces</strong>?<br />
          This will remove <strong>{totalTerminals} terminals</strong> and cannot be undone.
        {:else}
          Are you sure you want to delete <strong>"{deleteModal.workspaceName}"</strong>?<br />
          This action cannot be undone.
        {/if}
      </p>
      <div class="delete-modal-actions">
        <button class="btn-cancel" onclick={cancelDelete}>
          Cancel
        </button>
        <button class="btn-delete" onclick={isDeleteAll ? confirmDeleteAll : confirmDelete}>
          {isDeleteAll ? 'Delete All' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}
