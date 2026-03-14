<script lang="ts">
  interface Props {
    isVisible: boolean;
    onClick: () => void;
    unreadCount?: number;
  }

  let { isVisible, onClick, unreadCount = 0 }: Props = $props();
</script>

{#if isVisible}
  <button
    onclick={onClick}
    class="scroll-to-bottom-btn"
    class:visible={isVisible}
    title="Scroll to bottom"
    aria-label="Scroll to bottom"
  >
    <span class="btn-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </span>
    <span class="btn-label">Scroll to bottom</span>
    {#if unreadCount > 0}
      <span class="unread-badge">{unreadCount}</span>
    {/if}
  </button>
{/if}

<style>
  .scroll-to-bottom-btn {
    position: absolute;
    bottom: var(--space-4);
    right: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--color-primary);
    color: var(--color-bg-base);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    cursor: pointer;
    box-shadow: var(--shadow-lg), var(--shadow-glow-blue);
    z-index: var(--z-fixed);
    opacity: 0;
    transform: translateY(20px) scale(0.95);
    pointer-events: none;
    transition: all var(--transition-normal) var(--ease-spring);
  }

  .scroll-to-bottom-btn.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  .scroll-to-bottom-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl), var(--shadow-glow-blue);
  }

  .scroll-to-bottom-btn:active {
    transform: translateY(0);
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: bounce 2s infinite;
  }

  .btn-label {
    white-space: nowrap;
  }

  .unread-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    color: white;
    background: var(--color-error);
    border-radius: var(--radius-full);
    animation: pulse 1.5s infinite;
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(243, 139, 168, 0.4);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(243, 139, 168, 0);
    }
  }
</style>
