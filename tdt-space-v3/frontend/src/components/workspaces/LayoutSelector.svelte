<script lang="ts">
  interface Props {
    columns: number;
    rows: number;
    onChange: (cols: number, rows: number) => void;
  }

  let { columns, rows, onChange }: Props = $props();

  const presets = [
    { cols: 1, rows: 1, label: '1×1' },
    { cols: 2, rows: 1, label: '2×1' },
    { cols: 2, rows: 2, label: '2×2' },
    { cols: 3, rows: 2, label: '3×2' },
    { cols: 4, rows: 2, label: '4×2' },
  ];

  function selectPreset(cols: number, rows: number) {
    onChange(cols, rows);
  }
</script>

<div class="layout-selector">
  <div class="presets">
    {#each presets as preset}
      <button
        class="preset-btn"
        class:active={columns === preset.cols && rows === preset.rows}
        onclick={() => selectPreset(preset.cols, preset.rows)}
      >
        {preset.label}
      </button>
    {/each}
  </div>

  <div class="preview" style="--cols: {columns}; --rows: {rows};">
    {#each Array(columns * rows) as _, i}
      <div class="preview-cell">{i + 1}</div>
    {/each}
  </div>
</div>

<style>
  .layout-selector {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .preset-btn {
    padding: 8px 16px;
    background: #313244;
    border: 1px solid #45475a;
    color: #cdd6f4;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }

  .preset-btn:hover {
    background: #41435a;
  }

  .preset-btn.active {
    background: #89b4fa;
    border-color: #89b4fa;
    color: #1e1e2e;
  }

  .preview {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), 1fr);
    grid-template-rows: repeat(var(--rows, 2), 1fr);
    gap: 4px;
    background: #313244;
    padding: 12px;
    border-radius: 8px;
    aspect-ratio: var(--cols, 2) / var(--rows, 2);
    max-height: 150px;
  }

  .preview-cell {
    background: #45475a;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6c7086;
    font-size: 12px;
  }
</style>
