<script lang="ts">
  import type { CommandBlockData } from '../../types/terminal';

  interface Props {
    command?: string;
    isActive?: boolean;
  }

  let { command = '', isActive = false }: Props = $props();
</script>

<div class="command-block" class:active={isActive}>
  <span class="prompt">$</span>
  <span class="command">{command}</span>
</div>

<style>
  .command-block {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #313244;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
  }

  .command-block.active {
    background: #41435a;
  }

  .prompt {
    color: #89b4fa;
  }

  .command {
    color: #cdd6f4;
  }
</style>
