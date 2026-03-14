<script lang="ts">
  import { onMount } from 'svelte';
  import { workspaceStore } from '../../stores';
  import { backendAPI } from '../../services/wails-bridge';

  let isMac = $state(false);
  let theme = $derived(workspaceStore.theme);
  let currentWorkspace = $derived(workspaceStore.currentWorkspace);

  onMount(() => {
    // Detect platform to conditionally show/hide custom window controls
    backendAPI.getPlatform().then((p: string) => isMac = p === 'darwin').catch(() => { });
  });

  function handleMinimize() {
    backendAPI.windowMinimize();
  }

  function handleMaximize() {
    backendAPI.windowMaximize();
  }

  function handleClose() {
    backendAPI.windowClose();
  }

  function toggleTheme() {
    workspaceStore.setTheme(theme === 'dark' ? 'light' : 'dark');
  }
</script>

<div class="title-bar" class:macos={isMac}>
  <div class="title-left">
    <div class="app-brand">
      <span class="brand-icon">🚀</span>
      <span class="brand-name">TDT Space</span>
    </div>

    {#if currentWorkspace}
      <div class="workspace-breadcrumb">
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-icon">{currentWorkspace.icon || '📁'}</span>
        <span class="breadcrumb-name">{currentWorkspace.name}</span>
      </div>
    {/if}
  </div>

  <div class="title-right">
    <button
      class="theme-toggle"
      onclick={toggleTheme}
      title="Switch to {theme === 'dark' ? 'light' : 'dark'} mode"
      aria-label="Toggle theme"
    >
      {#if theme === 'dark'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      {/if}
    </button>

    <!-- Hide custom window controls on macOS — native traffic lights handle them -->
    {#if !isMac}
      <div class="window-controls">
        <button class="win-btn minimize" onclick={handleMinimize} title="Minimize" aria-label="Minimize window">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button class="win-btn maximize" onclick={handleMaximize} title="Maximize" aria-label="Maximize window">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        </button>
        <button class="win-btn close" onclick={handleClose} title="Close" aria-label="Close window">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .title-bar {
    height: var(--titlebar-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4);
    background: var(--color-bg-mantle);
    border-bottom: 1px solid var(--color-border);
    -webkit-app-region: drag;
    user-select: none;
  }

  .title-bar.macos {
    padding-left: 80px; /* Space for traffic lights */
  }

  .title-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .app-brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .brand-icon {
    font-size: var(--text-lg);
    filter: drop-shadow(0 0 8px rgba(137, 180, 250, 0.3));
  }

  .brand-name {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--color-text);
  }

  .workspace-breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text-subtext0);
  }

  .breadcrumb-separator {
    color: var(--color-border-active);
  }

  .breadcrumb-icon {
    font-size: var(--text-sm);
  }

  .breadcrumb-name {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  /* Theme Toggle */
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-subtext0);
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition: all var(--transition-fast);
  }

  .theme-toggle:hover {
    background: var(--color-bg-surface0);
    color: var(--color-text);
  }

  /* Window Controls */
  .window-controls {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    margin-left: var(--space-2);
  }

  .win-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-subtext0);
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition: all var(--transition-fast);
  }

  .win-btn:hover {
    background: var(--color-bg-surface0);
  }

  .win-btn.minimize:hover {
    color: var(--color-primary);
  }

  .win-btn.maximize:hover {
    color: var(--color-success);
  }

  .win-btn.close:hover {
    background: var(--color-error);
    color: white;
  }
</style>
