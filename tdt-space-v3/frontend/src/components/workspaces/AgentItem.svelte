<script lang="ts">
  import type { AgentType } from '../../types/agent';

  interface Props {
    type: AgentType;
    name: string;
    count: number;
    icon?: string;
    max?: number;
    draggable?: boolean;
    onChange?: (count: number) => void;
    onDragStart?: (e: DragEvent, agentType: AgentType) => void;
    onIncrement?: () => void;
    onDecrement?: () => void;
  }

  let {
    type,
    name,
    count,
    icon = '🤖',
    max = 8,
    draggable = true,
    onChange = () => {},
    onDragStart = () => {},
    onIncrement = () => {},
    onDecrement = () => {},
  }: Props = $props();

  let inputValue = $state(count.toString());
  let isEditing = $state(false);
  let isDragging = $state(false);

  // Sync inputValue when count changes externally
  $effect(() => {
    if (!isEditing) {
      inputValue = count.toString();
    }
  });

  function handleBlur() {
    isEditing = false;
    const num = parseInt(inputValue);
    if (!isNaN(num) && num >= 0 && num <= max) {
      onChange(num);
    } else {
      inputValue = count.toString();
    }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;
    const num = parseInt(target.value);
    if (!isNaN(num) && num >= 0 && num <= max) {
      onChange(num);
    }
  }

  function increment() {
    if (count < max) {
      onIncrement();
      inputValue = (count + 1).toString();
    }
  }

  function decrement() {
    if (count > 0) {
      onDecrement();
      inputValue = (count - 1).toString();
    }
  }

  function handleDragStart(e: DragEvent) {
    isDragging = true;
    onDragStart(e, type);
    // Set drag data
    e.dataTransfer?.setData('application/json', JSON.stringify({ type, name, icon }));
    e.dataTransfer!.effectAllowed = 'copy';
  }

  function handleDragEnd() {
    isDragging = false;
  }
</script>

<div
  class="agent-item"
  class:dragging={isDragging}
  {draggable}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  role="listitem"
>
  <span class="agent-icon">{icon}</span>
  <span class="agent-name">{name}</span>
  <div class="agent-controls">
    <button class="btn-decrement" onclick={decrement} disabled={count <= 0}>−</button>
    <input
      type="text"
      class="count-input"
      bind:value={inputValue}
      oninput={handleInput}
      onblur={handleBlur}
      onfocus={() => isEditing = true}
    />
    <button class="btn-increment" onclick={increment} disabled={count >= max}>+</button>
  </div>
</div>

<style>
  .agent-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border, #313244);
    cursor: grab;
    transition: all 0.15s ease;
    background: var(--color-bg-surface0, #1e1e2e);
    border-radius: 6px;
    margin-bottom: 4px;
  }

  .agent-item:hover {
    background: var(--color-bg-surface1, #313244);
  }

  .agent-item.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .agent-icon {
    font-size: 16px;
    width: 24px;
    text-align: center;
  }

  .agent-name {
    flex: 1;
    color: var(--color-text, #cdd6f4);
    font-size: 14px;
  }

  .agent-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .count-input {
    width: 36px;
    text-align: center;
    background: var(--color-bg-base, #1e1e2e);
    border: 1px solid var(--color-border, #45475a);
    color: var(--color-text, #cdd6f4);
    padding: 4px;
    border-radius: 4px;
    font-size: 13px;
    font-family: var(--font-mono, monospace);
  }

  .count-input:focus {
    outline: none;
    border-color: var(--color-primary, #89b4fa);
  }

  .btn-increment,
  .btn-decrement {
    width: 22px;
    height: 22px;
    background: var(--color-bg-surface1, #313244);
    border: 1px solid var(--color-border, #45475a);
    color: var(--color-text, #cdd6f4);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 1;
    transition: all 0.15s ease;
  }

  .btn-increment:hover,
  .btn-decrement:hover:not(:disabled) {
    background: var(--color-bg-surface2, #41435a);
    border-color: var(--color-border-hover, #585b70);
  }

  .btn-increment:disabled,
  .btn-decrement:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
