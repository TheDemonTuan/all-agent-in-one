<script lang="ts">
  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
  }

  let { isOpen = false, onClose = () => {} }: Props = $props();

  const agents = [
    { name: 'Claude Code', command: 'npm install -g @anthropic-ai/claude-code' },
    { name: 'OpenCode', command: 'npm install -g opencode' },
    { name: 'Droid', command: 'npm install -g @droid/cli' },
  ];
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="guide-overlay" onclick={onClose} role="presentation">
    <div class="guide-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="guide-title" tabindex="-1">
      <div class="guide-header">
        <h3 id="guide-title">📦 AI Agents Installation Guide</h3>
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <button class="close-btn" onclick={onClose} aria-label="Close">×</button>
      </div>

      <div class="guide-content">
        {#each agents as agent}
          <div class="agent-item">
            <span class="agent-name">{agent.name}</span>
            <code class="agent-command">{agent.command}</code>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .guide-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .guide-modal {
    background: #1e1e2e;
    border-radius: 12px;
    width: 600px;
    max-width: 90vw;
    border: 1px solid #45475a;
  }

  .guide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #45475a;
  }

  .guide-header h3 {
    margin: 0;
    color: #cdd6f4;
  }

  .close-btn {
    background: none;
    border: none;
    color: #6c7086;
    font-size: 24px;
    cursor: pointer;
  }

  .guide-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .agent-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #313244;
    border-radius: 8px;
  }

  .agent-name {
    color: #cdd6f4;
    font-weight: 500;
  }

  .agent-command {
    background: #1e1e2e;
    padding: 8px 12px;
    border-radius: 4px;
    color: #89b4fa;
    font-family: monospace;
    font-size: 13px;
  }
</style>
