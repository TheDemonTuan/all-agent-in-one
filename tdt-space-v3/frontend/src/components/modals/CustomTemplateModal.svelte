<script lang="ts">
  import type { WorkspaceLayout } from '../../types/workspace';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: { name: string; description: string; columns: number; rows: number; icon: string }) => void;
    existingLayout?: WorkspaceLayout | null;
  }

  let { isOpen, onClose, onSave, existingLayout = null }: Props = $props();

  const emojis = ['📁', '📂', '💼', '🗂️', '📊', '📈', '💻', '⚡', '🔥', '🚀', '🎯', '⭐', '🔷', '🔶', '💎', '🎨'];

  let templateName = $state('My Template');
  let templateDescription = $state('Custom workspace layout');
  let selectedIcon = $state(emojis[0]);
  let columns = $state(2);
  let rows = $state(2);

  // Sync with existingLayout when modal opens
  $effect(() => {
    if (isOpen) {
      columns = existingLayout?.columns || 2;
      rows = existingLayout?.rows || 2;
    }
  });

  function handleSave() {
    onSave({
      name: templateName,
      description: templateDescription,
      columns,
      rows,
      icon: selectedIcon,
    });
    onClose();
  }
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={onClose}>
    <div class="custom-template-modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3>Save Custom Template</h3>
        <button class="close-btn" onclick={onClose}>×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Template Name</label>
          <input type="text" bind:value={templateName} placeholder="My Template" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <input type="text" bind:value={templateDescription} placeholder="Custom workspace layout" />
        </div>

        <div class="form-group">
          <label>Icon</label>
          <div class="icon-grid">
            {#each emojis as emoji}
              <button
                class="icon-btn"
                class:selected={selectedIcon === emoji}
                onclick={() => selectedIcon = emoji}
              >
                {emoji}
              </button>
            {/each}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Columns</label>
            <input type="number" min="1" max="8" bind:value={columns} />
          </div>
          <div class="form-group">
            <label>Rows</label>
            <input type="number" min="1" max="8" bind:value={rows} />
          </div>
        </div>

        <div class="preview">
          <label>Preview</label>
          <div class="grid-preview" style="--cols: {columns}; --rows: {rows};">
            {#each Array(columns * rows) as _, i}
              <div class="grid-cell">{i + 1}</div>
            {/each}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" onclick={onClose}>Cancel</button>
        <button class="btn-save" onclick={handleSave} disabled={!templateName.trim()}>Save Template</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .custom-template-modal {
    background: #1e1e2e;
    border-radius: 12px;
    width: 480px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    border: 1px solid #45475a;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #45475a;
  }

  .modal-header h3 {
    margin: 0;
    color: #cdd6f4;
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    color: #6c7086;
    font-size: 24px;
    cursor: pointer;
  }

  .modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    color: #cdd6f4;
    font-size: 13px;
    font-weight: 500;
  }

  .form-group input {
    background: #313244;
    border: 1px solid #45475a;
    color: #cdd6f4;
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 14px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
  }

  .icon-btn {
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 6px;
    padding: 8px;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    background: #41435a;
  }

  .icon-btn.selected {
    background: #89b4fa;
    border-color: #89b4fa;
  }

  .preview label {
    color: #cdd6f4;
    font-size: 13px;
    font-weight: 500;
  }

  .grid-preview {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), 1fr);
    grid-template-rows: repeat(var(--rows, 2), 1fr);
    gap: 4px;
    background: #313244;
    padding: 12px;
    border-radius: 8px;
    aspect-ratio: var(--cols, 2) / var(--rows, 2);
  }

  .grid-cell {
    background: #45475a;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6c7086;
    font-size: 12px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #45475a;
  }

  .btn-cancel,
  .btn-save {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .btn-cancel {
    background: #313244;
    color: #cdd6f4;
  }

  .btn-save {
    background: #89b4fa;
    color: #1e1e2e;
  }

  .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
