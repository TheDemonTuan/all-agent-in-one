<script lang="ts">
  import { workspaceStore } from '../../stores';
  import type { AgentType } from '../../types/agent';

  // Props
  interface Props {
    appVersion: string;
    onOpenSettings: () => void;
  }

  let { appVersion, onOpenSettings }: Props = $props();

  // Derived state
  let currentWorkspace = $derived(workspaceStore.currentWorkspace);
  let workspaces = $derived(workspaceStore.workspaces);
  let theme = $derived(workspaceStore.theme);

  let totalTerminals = $derived(
    workspaces.reduce((acc, ws) => acc + (ws.terminals?.length || 0), 0)
  );

  let runningTerminals = $derived(
    workspaces.reduce((acc, ws) => {
      const running = ws.terminals?.filter(t => t.status === 'running').length || 0;
      return acc + running;
    }, 0)
  );

  // Get unique agents in current workspace
  let activeAgents = $derived(() => {
    if (!currentWorkspace?.terminals) return [];
    const agents = new Set<AgentType>();
    currentWorkspace.terminals.forEach(t => {
      if (t.agent?.type && t.agent.type !== 'none') {
        agents.add(t.agent.type);
      }
    });
    return Array.from(agents);
  });

  function toggleTheme() {
    workspaceStore.setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function getAgentIcon(agentType: AgentType): string {
    const icons: Record<AgentType | string, string> = {
      claude: '🟣',
      opencode: '🔵',
      droid: '🟢',
      aider: '🟠',
      cursor: '🔷',
      none: '⚪'
    };
    return icons[agentType] || '⚪';
  }

  function getAgentLabel(agentType: AgentType): string {
    const labels: Record<AgentType | string, string> = {
      claude: 'Claude',
      opencode: 'OpenCode',
      droid: 'Droid',
      aider: 'Aider',
      cursor: 'Cursor',
      none: 'None'
    };
    return labels[agentType] || agentType;
  }
</script>

<footer class="status-bar">
  <!-- Left Section: App info & Workspace -->
  <div class="status-section left">
    <div class="status-group">
      <span class="app-info">
        <span class="app-name">TDT Space</span>
        <span class="version">v{appVersion}</span>
      </span>

      {#if currentWorkspace}
        <span class="divider"></span>

        <div class="workspace-info">
          <span class="workspace-icon">{currentWorkspace.icon || '📁'}</span>
          <span class="workspace-name truncate">{currentWorkspace.name}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Center Section: Stats & Agents -->
  <div class="status-section center">
    {#if totalTerminals > 0}
      <div class="status-group">
        <div class="stat-item" title="{runningTerminals} of {totalTerminals} terminals running">
          <span class="stat-icon running">●</span>
          <span class="stat-value">{runningTerminals}/{totalTerminals}</span>
          <span class="stat-label">Terminals</span>
        </div>

        {#if currentWorkspace && activeAgents().length > 0}
          <span class="divider"></span>

          <div class="agents-list">
            {#each activeAgents() as agent}
              <span class="agent-tag" title={getAgentLabel(agent)}>
                <span class="agent-icon">{getAgentIcon(agent)}</span>
                <span class="agent-name">{getAgentLabel(agent)}</span>
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <span class="hint-text">Create a workspace to get started</span>
    {/if}
  </div>

  <!-- Right Section: Actions & Shortcuts -->
  <div class="status-section right">
    <div class="status-group">
      <!-- Theme Toggle -->
      <button
        class="status-btn"
        onclick={toggleTheme}
        title="Switch to {theme === 'dark' ? 'light' : 'dark'} theme"
      >
        <span class="status-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
      </button>

      <span class="divider"></span>

      <!-- Keyboard Shortcuts Hint -->
      <div class="shortcuts-hint">
        <span class="shortcut">
          <kbd>Ctrl</kbd>+<kbd>Tab</kbd>
          <span class="shortcut-label">Switch</span>
        </span>
      </div>

      <span class="divider"></span>

      <!-- Settings Button -->
      <button
        class="status-btn"
        onclick={onOpenSettings}
        title="Settings (Ctrl+,)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>
  </div>
</footer>

<style>
  .status-bar {
    height: var(--statusbar-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4);
    background-color: var(--color-bg-crust);
    border-top: 1px solid var(--color-border);
    font-size: var(--text-xs);
    color: var(--color-text-subtext0);
  }

  .status-section {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex: 1;
  }

  .status-section.left {
    justify-content: flex-start;
  }

  .status-section.center {
    justify-content: center;
  }

  .status-section.right {
    justify-content: flex-end;
  }

  .status-group {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .divider {
    width: 1px;
    height: 16px;
    background-color: var(--color-border);
  }

  /* App Info */
  .app-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .app-name {
    font-weight: var(--font-semibold);
    color: var(--color-text);
  }

  .version {
    font-family: var(--font-mono);
    color: var(--color-text-overlay0);
  }

  /* Workspace Info */
  .workspace-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .workspace-icon {
    font-size: var(--text-sm);
  }

  .workspace-name {
    max-width: 150px;
    font-weight: var(--font-medium);
    color: var(--color-text);
  }

  /* Stats */
  .stat-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background-color: var(--color-bg-surface0);
    border-radius: var(--radius-md);
  }

  .stat-icon {
    font-size: 8px;
  }

  .stat-icon.running {
    color: var(--color-success);
    animation: pulse 2s infinite;
  }

  .stat-value {
    font-family: var(--font-mono);
    font-weight: var(--font-semibold);
    color: var(--color-text);
  }

  .stat-label {
    color: var(--color-text-subtext0);
  }

  /* Agents */
  .agents-list {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .agent-tag {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background-color: var(--color-bg-surface0);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    transition: background-color var(--transition-fast);
  }

  .agent-tag:hover {
    background-color: var(--color-bg-surface1);
  }

  .agent-icon {
    font-size: var(--text-xs);
  }

  .agent-name {
    font-weight: var(--font-medium);
    color: var(--color-text);
  }

  /* Hint Text */
  .hint-text {
    font-style: italic;
    opacity: 0.7;
  }

  /* Status Buttons */
  .status-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-subtext0);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .status-btn:hover {
    background-color: var(--color-bg-surface0);
    color: var(--color-text);
  }

  .status-icon {
    font-size: var(--text-sm);
  }

  /* Shortcuts */
  .shortcuts-hint {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .shortcut {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
  }

  .shortcut kbd {
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    background-color: var(--color-bg-surface0);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xs);
    color: var(--color-text-subtext0);
  }

  .shortcut-label {
    color: var(--color-text-overlay0);
  }

  /* Animations */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .agent-name {
      display: none;
    }

    .stat-label {
      display: none;
    }
  }

  @media (max-width: 900px) {
    .workspace-name {
      max-width: 100px;
    }

    .shortcuts-hint {
      display: none;
    }
  }
</style>
