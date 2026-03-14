<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    icon?: string;
    title: string;
    description?: string;
    action?: Snippet;
  }

  let { icon = '📦', title, description, action }: Props = $props();
</script>

<div class="empty-state">
  <div class="icon-wrapper">
    <span class="icon">{icon}</span>
  </div>
  <h3 class="title">{title}</h3>
  {#if description}
    <p class="description">{description}</p>
  {/if}
  {#if action}
    <div class="action">
      {@render action()}
    </div>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-12);
    text-align: center;
    color: var(--color-text-subtext0);
    animation: fadeInUp 400ms var(--ease-out);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .icon-wrapper {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-bg-surface0), var(--color-bg-surface1));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
  }

  .icon {
    font-size: 36px;
    opacity: 0.8;
  }

  .title {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--color-text);
    margin: 0;
  }

  .description {
    font-size: var(--text-sm);
    color: var(--color-text-subtext0);
    max-width: 300px;
    margin: 0;
    line-height: var(--leading-relaxed);
  }

  .action {
    margin-top: var(--space-2);
  }
</style>
