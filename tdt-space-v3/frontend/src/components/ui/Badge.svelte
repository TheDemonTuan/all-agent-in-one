<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md';
    dot?: boolean;
    pulse?: boolean;
  }

  let { 
    children, 
    variant = 'default', 
    size = 'md',
    dot = false,
    pulse = false
  }: Props = $props();
</script>

<span 
  class="badge"
  class:variant-default={variant === 'default'}
  class:variant-primary={variant === 'primary'}
  class:variant-secondary={variant === 'secondary'}
  class:variant-success={variant === 'success'}
  class:variant-warning={variant === 'warning'}
  class:variant-error={variant === 'error'}
  class:variant-info={variant === 'info'}
  class:size-sm={size === 'sm'}
  class:size-md={size === 'md'}
  class:with-dot={dot}
  class:pulse={pulse}
>
  {#if dot}
    <span class="dot"></span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-weight: var(--font-semibold);
    line-height: var(--leading-none);
    border-radius: var(--radius-full);
    white-space: nowrap;
    transition: all var(--transition-fast);
  }

  .size-sm {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
  }

  .size-md {
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-xs);
  }

  .variant-default {
    background: var(--color-bg-surface0);
    color: var(--color-text-subtext0);
  }

  .variant-primary {
    background: var(--color-primary);
    color: var(--color-bg-base);
  }

  .variant-secondary {
    background: var(--color-secondary);
    color: white;
  }

  .variant-success {
    background: var(--color-success);
    color: var(--color-bg-base);
  }

  .variant-warning {
    background: var(--color-warning);
    color: var(--color-bg-base);
  }

  .variant-error {
    background: var(--color-error);
    color: white;
  }

  .variant-info {
    background: var(--color-info);
    color: var(--color-bg-base);
  }

  .with-dot {
    padding-left: var(--space-2);
  }

  .dot {
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: var(--radius-full);
  }

  .pulse .dot {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      box-shadow: 0 0 0 0 currentColor;
    }
    50% {
      opacity: 0.8;
    }
    70% {
      box-shadow: 0 0 0 4px transparent;
    }
  }
</style>
