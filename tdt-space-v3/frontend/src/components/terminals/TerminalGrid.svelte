<script lang="ts">
  import { workspaceStore } from '../../stores';
  import TerminalCell from './TerminalCell.svelte';
  import type { WorkspaceLayout } from '../../types/workspace';

  interface Props {
    workspace: WorkspaceLayout;
    isWorkspaceActive: boolean;
  }

  let { workspace, isWorkspaceActive }: Props = $props();

  // Derived state from props
  let terminals = $derived(workspace.terminals ?? []);
  let activeTerminalId = $derived(workspaceStore.activeTerminalId);

  function getEffectiveGridDimensions(count: number, preferredColumns: number, preferredRows: number) {
    if (count <= 1) {
      return { columns: 1, rows: 1 };
    }

    const safeColumns = Math.max(1, preferredColumns || 1);
    const safeRows = Math.max(1, preferredRows || 1);
    const aspectRatio = safeColumns / safeRows;

    let rows = Math.ceil(Math.sqrt(count / aspectRatio));
    let columns = Math.ceil(count / rows);

    if (columns * rows < count) {
      rows += 1;
      columns = Math.ceil(count / rows);
    }

    return { columns, rows };
  }

  let gridDimensions = $derived(
    getEffectiveGridDimensions(terminals.length, workspace.columns ?? 1, workspace.rows ?? 1)
  );
  let columns = $derived(gridDimensions.columns);
  let rows = $derived(gridDimensions.rows);

  function handleActivate(terminalId: string) {
    workspaceStore.setActiveTerminal(terminalId);
  }
</script>

<div 
  class="terminal-grid" 
  style="--columns: {columns}; --rows: {rows};"
  class:workspace-active={isWorkspaceActive}
  role="tablist"
  aria-label="Terminal grid"
>
  {#each terminals as terminal (terminal.id)}
    <div class="grid-cell">
      <TerminalCell
        {terminal}
        workspaceId={workspace.id}
        isActive={terminal.id === activeTerminalId}
        {isWorkspaceActive}
        gridColumns={columns}
        gridRows={rows}
        onActivate={() => handleActivate(terminal.id)}
      />
    </div>
  {/each}
</div>

<style>
  .terminal-grid {
    display: grid;
    grid-template-columns: repeat(var(--columns, 1), 1fr);
    grid-template-rows: repeat(var(--rows, 1), minmax(0, 1fr));
    gap: 2px;
    height: 100%;
    width: 100%;
    padding: 0;
    overflow: hidden;
  }

  .grid-cell {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .terminal-grid {
      gap: 2px;
    }
  }

  @media (max-width: 900px) {
    .terminal-grid {
      gap: 1px;
    }
  }
</style>
