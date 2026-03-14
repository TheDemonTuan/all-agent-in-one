<script lang="ts">
  interface Props {
    x: number;
    y: number;
    onClose: () => void;
    onAction?: (action: string) => void;
  }

  let { x, y, onClose, onAction = () => {} }: Props = $props();

  const menuItems = [
    { id: 'copy', label: 'Copy', icon: '📋' },
    { id: 'paste', label: 'Paste', icon: '📄' },
    { id: 'clear', label: 'Clear', icon: '🗑️' },
    { id: 'restart', label: 'Restart', icon: '🔄' },
  ];

  function handleAction(action: string) {
    onAction(action);
    onClose();
  }
</script>

<svelte:window onclick={onClose} />

<div class="context-menu" style="top: {y}px; left: {x}px;">
  {#each menuItems as item}
    <button class="menu-item" onclick={() => handleAction(item.id)}>
      <span class="icon">{item.icon}</span>
      <span class="label">{item.label}</span>
    </button>
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 6px;
    padding: 4px;
    min-width: 150px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: #cdd6f4;
    cursor: pointer;
    border-radius: 4px;
    font-size: 13px;
  }

  .menu-item:hover {
    background: #41435a;
  }

  .icon {
    font-size: 14px;
  }
</style>
