<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
  }

  let { children, content, position = 'top', delay = 300 }: Props = $props();

  let isVisible = $state(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let triggerRef: HTMLElement;

  function handleMouseEnter() {
    timeoutId = setTimeout(() => {
      isVisible = true;
    }, delay);
  }

  function handleMouseLeave() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    isVisible = false;
  }
</script>

<div
  class="tooltip-trigger"
  bind:this={triggerRef}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onfocus={handleMouseEnter}
  onblur={handleMouseLeave}
  role="tooltip"
  aria-describedby={isVisible ? 'tooltip-content' : undefined}
>
  {@render children()}

  {#if isVisible}
    <div
      id="tooltip-content"
      class="tooltip-content"
      class:top={position === 'top'}
      class:bottom={position === 'bottom'}
      class:left={position === 'left'}
      class:right={position === 'right'}
    >
      {content}
      <div class="tooltip-arrow"></div>
    </div>
  {/if}
</div>

<style>
  .tooltip-trigger {
    position: relative;
    display: inline-flex;
  }

  .tooltip-content {
    position: absolute;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--color-text);
    background: var(--color-bg-surface2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    white-space: nowrap;
    z-index: var(--z-tooltip);
    box-shadow: var(--shadow-lg);
    animation: tooltipIn 150ms var(--ease-out);
    pointer-events: none;
  }

  @keyframes tooltipIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .tooltip-content.top {
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip-content.bottom {
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip-content.left {
    right: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
  }

  .tooltip-content.right {
    left: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
  }

  .tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--color-bg-surface2);
    border: 1px solid var(--color-border);
  }

  .tooltip-content.top .tooltip-arrow {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-top: none;
    border-left: none;
  }

  .tooltip-content.bottom .tooltip-arrow {
    top: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-bottom: none;
    border-right: none;
  }

  .tooltip-content.left .tooltip-arrow {
    right: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-bottom: none;
    border-left: none;
  }

  .tooltip-content.right .tooltip-arrow {
    left: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-top: none;
    border-right: none;
  }
</style>
