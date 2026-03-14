<script lang="ts">
  import type { SearchAddon } from '@xterm/addon-search';

  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
    searchAddon?: SearchAddon | null;
  }

  let { isOpen = false, onClose = () => {}, searchAddon = null }: Props = $props();

  let query = $state('');
  let matchCount = $state(0);
  let currentMatch = $state(0);
  let caseSensitive = $state(false);
  let wholeWord = $state(false);
  let regex = $state(false);

  // Update search when query or options change
  $effect(() => {
    if (!searchAddon || !isOpen) return;
    
    const options = {
      caseSensitive,
      wholeWord,
      regex,
    };
    
    // @ts-ignore - searchAddon has findNext but types may not match
    const result = searchAddon.findNext(query, options);
    updateMatchCount();
  });

  function updateMatchCount() {
    // Note: xterm.js SearchAddon doesn't expose match count directly
    // We'll track as we navigate
    if (!query) {
      matchCount = 0;
      currentMatch = 0;
    }
  }

  function findPrevious() {
    if (!searchAddon || !query) return;
    // @ts-ignore
    searchAddon.findPrevious(query, { caseSensitive, wholeWord, regex });
    if (currentMatch > 1) currentMatch--;
  }

  function findNext() {
    if (!searchAddon || !query) return;
    // @ts-ignore
    searchAddon.findNext(query, { caseSensitive, wholeWord, regex });
    if (currentMatch < matchCount) currentMatch++;
  }

  function handleClose() {
    searchAddon?.clearDecorations?.();
    onClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        findPrevious();
      } else {
        findNext();
      }
    }
  }
</script>

{#if isOpen}
  <div class="terminal-search">
    <div class="search-row">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        bind:value={query}
        placeholder="Search..."
        onkeydown={handleKeyDown}
        autofocus
      />
      {#if matchCount > 0}
        <span class="match-count">{currentMatch}/{matchCount}</span>
      {/if}
      <button class="nav-btn" onclick={findPrevious} title="Previous (Shift+Enter)">↑</button>
      <button class="nav-btn" onclick={findNext} title="Next (Enter)">↓</button>
      <button class="close-btn" onclick={handleClose} title="Close (Escape)">✕</button>
    </div>
    <div class="options-row">
      <label class="option">
        <input type="checkbox" bind:checked={caseSensitive} />
        <span>Aa</span>
      </label>
      <label class="option">
        <input type="checkbox" bind:checked={wholeWord} />
        <span>\b</span>
      </label>
      <label class="option">
        <input type="checkbox" bind:checked={regex} />
        <span>.*</span>
      </label>
    </div>
  </div>
{/if}

<style>
  .terminal-search {
    position: absolute;
    top: 40px;
    right: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--color-bg-surface0, #313244);
    padding: 8px;
    border-radius: 8px;
    z-index: 20;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 280px;
  }

  .search-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  input[type="text"] {
    flex: 1;
    background: var(--color-bg-base, #1e1e2e);
    border: 1px solid var(--color-border, #45475a);
    color: var(--color-text, #cdd6f4);
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 13px;
    outline: none;
  }

  input[type="text"]:focus {
    border-color: var(--color-primary, #89b4fa);
  }

  .match-count {
    font-size: 11px;
    color: var(--color-text-subtext0, #a6adc8);
    padding: 0 4px;
    font-family: var(--font-mono, monospace);
  }

  button {
    background: transparent;
    border: none;
    color: var(--color-text-subtext1, #6c7086);
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1;
    transition: all 0.15s ease;
  }

  button:hover {
    background: var(--color-bg-surface1, #45475a);
    color: var(--color-text, #cdd6f4);
  }

  .nav-btn {
    font-weight: bold;
  }

  .close-btn:hover {
    color: var(--color-error, #f38ba8);
  }

  .options-row {
    display: flex;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--color-border, #45475a);
  }

  .option {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 11px;
    color: var(--color-text-subtext0, #a6adc8);
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .option:hover {
    background: var(--color-bg-surface1, #45475a);
  }

  .option input[type="checkbox"] {
    display: none;
  }

  .option span {
    font-family: var(--font-mono, monospace);
    font-weight: 500;
  }

  .option:has(input:checked) {
    color: var(--color-primary, #89b4fa);
    background: rgba(137, 180, 250, 0.1);
  }
</style>
