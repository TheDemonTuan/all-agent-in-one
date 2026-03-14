<script lang="ts">
  import { templateStore } from '../../stores';

  interface Props {
    selectedId?: string;
    onSelect: (templateId: string) => void;
  }

  let { selectedId = '', onSelect }: Props = $props();

  let templates = $derived(templateStore.templates);
  let activeTab = $state<'builtin' | 'custom'>('builtin');
  let builtInTemplates = $derived(templates.filter(t => t.isBuiltIn));
  let customTemplates = $derived(templates.filter(t => !t.isBuiltIn));
</script>

<div class="template-selector">
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'builtin'}
      onclick={() => activeTab = 'builtin'}
    >
      Built-in
    </button>
    <button
      class="tab"
      class:active={activeTab === 'custom'}
      onclick={() => activeTab = 'custom'}
    >
      Custom
    </button>
  </div>

  <div class="template-list">
    {#if activeTab === 'builtin'}
      {#each builtInTemplates as template}
        <button
          class="template-item"
          class:selected={selectedId === template.id}
          onclick={() => onSelect(template.id)}
        >
          <span class="template-icon">{template.icon}</span>
          <span class="template-name">{template.name}</span>
          <span class="template-desc">{template.description}</span>
        </button>
      {/each}
    {:else}
      {#each customTemplates as template}
        <button
          class="template-item"
          class:selected={selectedId === template.id}
          onclick={() => onSelect(template.id)}
        >
          <span class="template-icon">{template.icon || '📁'}</span>
          <span class="template-name">{template.name}</span>
          <span class="template-desc">{template.description}</span>
        </button>
      {:else}
        <div class="empty-state">No custom templates yet</div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .template-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tabs {
    display: flex;
    gap: 4px;
  }

  .tab {
    flex: 1;
    padding: 10px;
    background: #313244;
    border: 1px solid #45475a;
    color: #6c7086;
    cursor: pointer;
    border-radius: 6px;
    font-size: 13px;
    transition: all 0.2s;
  }

  .tab.active {
    background: #89b4fa;
    border-color: #89b4fa;
    color: #1e1e2e;
  }

  .template-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }

  .template-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .template-item:hover {
    background: #41435a;
  }

  .template-item.selected {
    border-color: #89b4fa;
    background: rgba(137, 180, 250, 0.1);
  }

  .template-icon {
    font-size: 24px;
  }

  .template-name {
    color: #cdd6f4;
    font-weight: 500;
  }

  .template-desc {
    color: #6c7086;
    font-size: 12px;
    margin-left: auto;
  }

  .empty-state {
    text-align: center;
    color: #6c7086;
    padding: 24px;
    font-size: 14px;
  }
</style>
