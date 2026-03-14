<script lang="ts">
  import type { Template } from '../../types/workspace';

  interface Props {
    template: Template;
    isSelected?: boolean;
    onClick: () => void;
  }

  let { template, isSelected = false, onClick }: Props = $props();
</script>

<button
  class="template-card"
  class:selected={isSelected}
  onclick={onClick}
  title={template.description}
>
  <span class="card-icon">{template.icon}</span>
  <span class="card-name">{template.name}</span>
  <span class="card-layout">{template.columns}×{template.rows}</span>
</button>

<style>
  .template-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    min-width: 100px;
  }

  .template-card:hover {
    background: #41435a;
    border-color: #89b4fa;
  }

  .template-card.selected {
    background: rgba(137, 180, 250, 0.1);
    border-color: #89b4fa;
  }

  .card-icon {
    font-size: 32px;
  }

  .card-name {
    color: #cdd6f4;
    font-weight: 500;
    font-size: 14px;
  }

  .card-layout {
    color: #6c7086;
    font-size: 12px;
  }
</style>
