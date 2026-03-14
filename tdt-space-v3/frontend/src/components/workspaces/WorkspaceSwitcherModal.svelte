<script lang="ts">
  import { workspaceStore } from '../../stores';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelectWorkspace: (workspaceId: string) => void;
  }

  let { isOpen, onClose, onSelectWorkspace }: Props = $props();

  let workspaces = $derived(workspaceStore.workspaces);
  let currentWorkspace = $derived(workspaceStore.currentWorkspace);

  function handleSelect(workspaceId: string) {
    onSelectWorkspace(workspaceId);
    onClose();
  }

  function getTerminalCount(workspaceId: string): number {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    return workspace?.terminals?.length || 0;
  }
</script>

{#if isOpen}
  <div class="switcher-overlay" onclick={onClose} role="dialog" aria-modal="true" aria-labelledby="switcher-title">
    <div class="switcher-container" onclick={(e) => e.stopPropagation()}>
      <!-- Header -->
      <div class="switcher-header">
        <div class="header-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        </div>
        <div class="header-info">
          <h3 id="switcher-title">Switch Workspace</h3>
          <span class="header-hint">Release Ctrl to select</span>
        </div>
      </div>

      <!-- Workspace List -->
      <div class="workspace-list" role="listbox">
        {#each workspaces as workspace, index (workspace.id)}
          {@const isActive = workspace.id === currentWorkspace?.id}
          {@const terminalCount = getTerminalCount(workspace.id)}

          <button
            class="workspace-item"
            class:active={isActive}
            onclick={() => handleSelect(workspace.id)}
            role="option"
            aria-selected={isActive}
            tabindex={isActive ? 0 : -1}
          >
            <!-- Index shortcut -->
            <span class="item-shortcut">
              <kbd>Alt</kbd>+<kbd>{index + 1}</kbd>
            </span>

            <!-- Icon -->
            <span class="item-icon">{workspace.icon || '📁'}</span>

            <!-- Info -->
            <div class="item-info">
              <span class="item-name">{workspace.name}</span>
              <span class="item-meta">
                {workspace.columns}×{workspace.rows} layout • {terminalCount} terminal{terminalCount !== 1 ? 's' : ''}
              </span>
            </div>

            <!-- Active indicator -->
            {#if isActive}
              <span class="item-status">
                <span class="status-dot"></span>
                Active
              </span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Footer -->
      <div class="switcher-footer">
        <div class="footer-hints">
          <span class="hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
            Ctrl+Tab: Next
          </span>
          <span class="hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
            Ctrl+Shift+Tab: Prev
          </span>
          <span class="hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
            Ctrl+PgUp/PgDn: Quick
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .switcher-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    animation: fadeIn 200ms var(--ease-out);
    padding: var(--space-4);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .switcher-container {
    background: var(--color-bg-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl), 0 0 0 1px rgba(137, 180, 250, 0.1);
    width: 480px;
    max-width: 100%;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    animation: scaleIn 250ms var(--ease-spring);
    overflow: hidden;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Header */
  .switcher-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-mantle);
  }

  .header-icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-surface0);
    border-radius: var(--radius-lg);
    color: var(--color-primary);
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .switcher-header h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--color-text);
    margin: 0;
  }

  .header-hint {
    font-size: var(--text-sm);
    color: var(--color-text-subtext0);
  }

  /* Workspace List */
  .workspace-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3);
  }

  .workspace-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    color: var(--color-text);
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .workspace-item:hover {
    background: var(--color-bg-surface0);
    border-color: var(--color-border);
  }

  .workspace-item.active {
    background: rgba(137, 180, 250, 0.1);
    border-color: rgba(137, 180, 250, 0.3);
  }

  .workspace-item:focus {
    outline: none;
    background: var(--color-bg-surface0);
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.15);
  }

  .item-shortcut {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    color: var(--color-text-overlay0);
  }

  .item-shortcut kbd {
    padding: 2px 4px;
    font-family: var(--font-mono);
    background: var(--color-bg-surface1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xs);
    color: var(--color-text-subtext0);
  }

  .item-icon {
    font-size: var(--text-lg);
    width: 32px;
    text-align: center;
  }

  .item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .item-name {
    font-weight: var(--font-medium);
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-meta {
    font-size: var(--text-xs);
    color: var(--color-text-subtext0);
  }

  .item-status {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--color-success);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background: var(--color-success);
    border-radius: var(--radius-full);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Footer */
  .switcher-footer {
    padding: var(--space-3) var(--space-6);
    background: var(--color-bg-mantle);
    border-top: 1px solid var(--color-border);
  }

  .footer-hints {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
  }

  .hint {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-subtext0);
  }

  .hint svg {
    opacity: 0.7;
  }

  /* Scrollbar */
  .workspace-list::-webkit-scrollbar {
    width: 6px;
  }

  .workspace-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .workspace-list::-webkit-scrollbar-thumb {
    background: var(--color-bg-surface1);
    border-radius: var(--radius-full);
  }

  .workspace-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-bg-surface2);
  }
</style>
