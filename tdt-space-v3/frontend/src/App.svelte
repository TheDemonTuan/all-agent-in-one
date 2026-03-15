<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Sidebar,
    StatusBar,
    TitleBar,
    TerminalGrid,
    WorkspaceSwitcherModal,
    SettingsModal,
    WorkspaceCreationModal,
  } from './components';
  import { workspaceStore, initializePlatformInfo } from './stores';
  import { getAppVersion } from './utils/version';
  import { backendAPI } from './services/wails-bridge';
  import { MemoryMonitor } from './lib/memoryMonitor';

  // State
  let workspaceSwitcherOpen = $state(false);
  let settingsModalOpen = $state(false);
  let appVersion = $state('');

  // Hover sidebar state
  let sidebarHoverOpen = $state(false);
  let sidebarHoverTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

  // Derived state
  let theme = $derived(workspaceStore.theme);
  let workspace = $derived(workspaceStore.currentWorkspace);
  let workspaces = $derived(workspaceStore.workspaces);
  let sidebarVisible = $derived(workspaceStore.sidebarVisible);

  // Workspace navigation helpers
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
    if (index < 0 || index >= workspaces.length) {
      return null;
    }
    const ws = workspaceStore.getWorkspaceByIndex(index);
    if (ws) {
      workspaceStore.setCurrentWorkspace(ws);
      return ws;
    }
    return null;
  }

  // Keyboard shortcuts handler
  function handleKeyDown(e: KeyboardEvent) {
    // Don't trigger shortcuts when typing in input fields
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Toggle sidebar with Ctrl+B
    if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      workspaceStore.toggleSidebar();
      return;
    }

    // Alt+F4: Close window (for frameless windows on Windows)
    if (e.altKey && e.key === 'F4') {
      e.preventDefault();
      backendAPI.windowClose();
      return;
    }

    // Ctrl+, (comma): Open Settings
    if (e.ctrlKey && e.key === ',') {
      e.preventDefault();
      settingsModalOpen = true;
      return;
    }

    // Ctrl+Shift+N: New workspace
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      workspaceStore.setWorkspaceModalOpen(true);
      return;
    }

    // Ctrl+Tab: Cycle to next workspace with modal preview
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      nextWorkspace();
      workspaceSwitcherOpen = true;
      return;
    }

    // Ctrl+Shift+Tab: Previous workspace
    if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      previousWorkspace();
      workspaceSwitcherOpen = true;
      return;
    }

    // Ctrl+PageUp: Previous workspace
    if (e.ctrlKey && e.key === 'PageUp') {
      e.preventDefault();
      previousWorkspace();
      return;
    }

    // Ctrl+PageDown: Next workspace
    if (e.ctrlKey && e.key === 'PageDown') {
      e.preventDefault();
      nextWorkspace();
      return;
    }

    // Ctrl+T: Next terminal
    if (e.ctrlKey && !e.shiftKey && e.key === 't') {
      e.preventDefault();
      const nextTerminal = workspaceStore.getNextTerminal();
      if (nextTerminal) {
        workspaceStore.setActiveTerminal(nextTerminal.id);
      }
      return;
    }

    // Ctrl+1 through Ctrl+9: Switch to terminal by index
    if (e.ctrlKey && !e.shiftKey && e.key.match(/^[1-9]$/)) {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      const terminal = workspaceStore.getTerminalByIndex(index);
      if (terminal) {
        workspaceStore.setActiveTerminal(terminal.id);
      }
      return;
    }

    // Ctrl+Shift+T: Previous terminal
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      const prevTerminal = workspaceStore.getPreviousTerminal();
      if (prevTerminal) {
        workspaceStore.setActiveTerminal(prevTerminal.id);
      }
      return;
    }

    // Alt+1 through Alt+9: Switch to workspace by index
    if (e.altKey && e.key.match(/^[1-9]$/)) {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      switchToWorkspaceByIndex(index);
      return;
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Control') {
      workspaceSwitcherOpen = false;
    }
  }

  function handleSelectWorkspace(workspaceId: string) {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      workspaceStore.setCurrentWorkspace(ws);
    }
    workspaceSwitcherOpen = false;
  }

  function handleCreateWorkspace() {
    workspaceStore.setWorkspaceModalOpen(true);
  }

  function handleOpenSettings() {
    settingsModalOpen = true;
  }

  // Lifecycle
  onMount(() => {
    // Load app version
    getAppVersion().then(v => appVersion = v);

    // Initialize platform info from backend
    initializePlatformInfo();

    // Load workspaces from store on mount
    workspaceStore.loadWorkspaces();

    // Enable memory monitoring in production to track startup memory spike
    MemoryMonitor.startMonitoring(10000);

    // Log initial memory stats after 5 seconds
    const initialStatsTimeout = setTimeout(() => {
      const stats = MemoryMonitor.getStats();
      if (stats) {
        console.log('[App] Initial memory stats:', {
          usedMB: (stats.usedJSHeapSize / 1024 / 1024).toFixed(2),
          totalMB: (stats.totalJSHeapSize / 1024 / 1024).toFixed(2),
          limitMB: (stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
          usagePercent: ((stats.usedJSHeapSize / stats.jsHeapSizeLimit) * 100).toFixed(2) + '%',
        });
      }
    }, 5000);

    // Listen for workspace switcher open event from TerminalCell
    const handleOpenWorkspaceSwitcher = () => {
      workspaceSwitcherOpen = true;
    };
    window.addEventListener('open-workspace-switcher', handleOpenWorkspaceSwitcher);

    // Listen for sidebar hover leave to close hover-opened sidebar
    const handleSidebarHoverLeave = () => {
      sidebarHoverOpen = false;
    };
    window.addEventListener('sidebar-hover-leave', handleSidebarHoverLeave);

    return () => {
      MemoryMonitor.stopMonitoring();
      clearTimeout(initialStatsTimeout);
      window.removeEventListener('open-workspace-switcher', handleOpenWorkspaceSwitcher);
      window.removeEventListener('sidebar-hover-leave', handleSidebarHoverLeave);
    };
  });
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<div
  class="app-container"
  class:dark={theme === 'dark'}
  data-theme={theme}
>
  <TitleBar />

  <div class="app-body">
    <!-- Sidebar Navigation -->
    <Sidebar
      onCreateWorkspace={handleCreateWorkspace}
      onOpenSettings={handleOpenSettings}
      sidebarVisible={sidebarVisible || sidebarHoverOpen}
      isHoverOpen={sidebarHoverOpen}
    />
    <!-- Edge Handle / Sidebar Rail (shown when sidebar is hidden) -->
    {#if !sidebarVisible && !sidebarHoverOpen}
      <div
        class="sidebar-edge-handle"
        onclick={() => workspaceStore.toggleSidebar()}
        onkeydown={(e) => e.key === 'Enter' && workspaceStore.toggleSidebar()}
        onmouseenter={() => {
          if (sidebarHoverTimeout) clearTimeout(sidebarHoverTimeout);
          sidebarHoverOpen = true;
        }}
        role="button"
        tabindex="0"
        title="Show Sidebar (Ctrl+B)"
      >
        <div class="edge-handle-bar"></div>
      </div>
    {/if}

    <!-- Main Content Area -->
    <main class="main-content">
      {#if workspaces.length > 0}
        <!-- Header for current workspace -->
        <div class="content-header">
          <div class="header-left">
            <span class="header-icon">{workspace?.icon || '📁'}</span>
            <span class="header-title" title={workspace?.name}>
              {workspace?.name || 'Workspace'}
            </span>
            <div class="header-meta-group" title="{workspace?.columns || 0}×{workspace?.rows || 0} layout • {workspace?.terminals?.length || 0} terminals">
              <span class="header-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                {workspace?.columns || 0}×{workspace?.rows || 0}
              </span>
              <span class="meta-separator">•</span>
              <span class="header-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4 17 10 11 4 5"></polyline>
                  <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
                {workspace?.terminals?.length || 0}
              </span>
            </div>
          </div>

          <div class="header-actions">
            <button
              class="header-btn-icon"
              onclick={() => {
                if (workspace) {
                  workspaceStore.setWorkspaceModalOpenWithEdit(workspace);
                }
              }}
              title="Edit Workspace (Ctrl+Shift+N for new)"
              disabled={!workspace}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              class="header-btn-icon danger"
              onclick={() => workspaceStore.killAllTerminals()}
              title="Kill All Terminals"
              disabled={!workspace || workspace.terminals.length === 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Render all workspaces, show only active one -->
        <div class="workspaces-container">
          {#each workspaces as ws (ws.id)}
            <div 
              class="workspace-container" 
              class:active={ws.id === workspace?.id}
            >
              <div class="terminal-area">
                <TerminalGrid workspace={ws} isWorkspaceActive={ws.id === workspace?.id} />
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-content">
            <div class="empty-icon-wrapper">
              <span class="empty-icon">🚀</span>
            </div>
            <h2 class="empty-title">Welcome to TDT Space</h2>
            <p class="empty-description">
              A multi-agent terminal workspace for AI-powered development.
              <br />
              Create your first workspace to get started.
            </p>
            <button
              class="btn btn-primary btn-lg"
              onclick={handleCreateWorkspace}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Workspace
            </button>

            <div class="empty-shortcuts">
              <div class="shortcut-hint">
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd>
                <span>to create workspace</span>
              </div>
              <div class="shortcut-hint">
                <kbd>Ctrl</kbd> + <kbd>,</kbd>
                <span>for settings</span>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </main>
  </div>

  <!-- Status Bar -->
  <StatusBar {appVersion} onOpenSettings={handleOpenSettings} />

  <!-- Modals -->
  <WorkspaceSwitcherModal
    isOpen={workspaceSwitcherOpen}
    onClose={() => workspaceSwitcherOpen = false}
    onSelectWorkspace={handleSelectWorkspace}
  />

  <SettingsModal
    isOpen={settingsModalOpen}
    onClose={() => settingsModalOpen = false}
  />

  <WorkspaceCreationModal
    isOpen={workspaceStore.isWorkspaceModalOpen}
    onClose={() => workspaceStore.setWorkspaceModalOpen(false)}
  />
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: var(--color-bg-base);
    color: var(--color-text);
  }

  .app-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  /* Content Header - Compact Design */
  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    padding: 0 var(--space-3);
    background-color: var(--color-bg-mantle);
    border-bottom: none;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    flex: 1;
  }

  .header-icon {
    font-size: var(--text-base);
    line-height: 1;
    flex-shrink: 0;
  }

  .header-title {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--color-text);
    margin: 0;
    line-height: var(--leading-tight);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .header-meta-group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 2px 8px;
    background: var(--color-bg-surface0);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .header-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: var(--font-medium);
    color: var(--color-text-subtext0);
    font-family: var(--font-mono);
  }

  .header-meta-item svg {
    opacity: 0.7;
  }

  .meta-separator {
    color: var(--color-border);
    font-size: 10px;
    user-select: none;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
    margin-left: var(--space-2);
  }

  .header-btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--color-text-subtext1);
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .header-btn-icon:hover:not(:disabled) {
    background-color: var(--color-bg-surface0);
    color: var(--color-text);
    border-color: var(--color-border);
  }

  .header-btn-icon:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .header-btn-icon.danger:hover:not(:disabled) {
    color: var(--color-error);
    border-color: var(--color-error);
    background-color: rgba(243, 139, 168, 0.1);
  }

  /* Workspaces Container */
  .workspaces-container {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .workspace-container {
    flex: 1;
    display: none;
    overflow: hidden;
    flex-direction: column;
  }

  .workspace-container.active {
    display: flex;
  }

  /* Terminal Area */
  .terminal-area {
    flex: 1;
    overflow: hidden;
    padding: 2px;
    background-color: var(--color-bg-base);
    display: flex;
  }

  /* Empty State */
  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    background-color: var(--color-bg-base);
  }

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-6);
    max-width: 480px;
  }

  .empty-icon-wrapper {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-bg-surface0), var(--color-bg-surface1));
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
  }

  .empty-icon {
    font-size: 40px;
    filter: drop-shadow(0 0 16px rgba(137, 180, 250, 0.3));
  }

  .empty-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--color-text);
    margin: 0;
  }

  .empty-description {
    font-size: var(--text-base);
    color: var(--color-text-subtext0);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  .empty-shortcuts {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-4);
    padding: var(--space-4);
    background-color: var(--color-bg-surface0);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }

  .shortcut-hint {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text-subtext0);
  }

  .shortcut-hint kbd {
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    background-color: var(--color-bg-surface1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xs);
    color: var(--color-text);
  }

  .shortcut-hint span {
    opacity: 0.8;
  }

  /* Button styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    line-height: var(--leading-tight);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast) var(--ease-default);
    white-space: nowrap;
    user-select: none;
  }

  .btn-primary {
    background-color: var(--color-primary);
    color: var(--color-bg-base);
  }

  .btn-primary:hover {
    background-color: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-lg {
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-base);
  }

  /* Scrollbar styling for the main content */
  .main-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .main-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .main-content::-webkit-scrollbar-thumb {
    background: var(--color-bg-surface1);
    border-radius: var(--radius-full);
  }

  .main-content::-webkit-scrollbar-thumb:hover {
    background: var(--color-bg-surface2);
  }

  /* Edge Handle / Sidebar Rail */
  .sidebar-edge-handle {
    position: fixed;
    top: 0;
    left: 0;
    width: 8px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: var(--z-sticky);
    background: transparent;
    transition: background-color var(--transition-fast), width var(--transition-fast);
  }

  .sidebar-edge-handle:hover {
    background-color: var(--color-bg-surface0);
    width: 12px;
  }

  .edge-handle-bar {
    width: 3px;
    height: 48px;
    background-color: var(--color-border);
    border-radius: var(--radius-full);
    opacity: 0.4;
    transition: opacity var(--transition-fast), background-color var(--transition-fast), height var(--transition-fast);
  }

  .sidebar-edge-handle:hover .edge-handle-bar {
    opacity: 1;
    background-color: var(--color-accent);
    height: 64px;
  }
</style>
