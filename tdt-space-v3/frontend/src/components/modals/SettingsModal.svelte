<script lang="ts">
  import { onMount } from 'svelte';
  import { backendAPI, isWailsAvailable } from '../../services/wails-bridge';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  interface TerminalSettings {
    fontSize: number;
    fontFamily: string;
    cursorBlink: boolean;
    scrollback: number;
    showCommandBlocks: boolean;
    theme: 'dark' | 'light' | 'system';
  }

  interface VietnameseImeSettings {
    enabled: boolean;
    autoPatch: boolean;
  }

  const defaultSettings: TerminalSettings = {
    fontSize: 14,
    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    cursorBlink: true,
    scrollback: 10000,
    showCommandBlocks: true,
    theme: 'dark',
  };

  const defaultVietnameseImeSettings: VietnameseImeSettings = {
    enabled: false,
    autoPatch: true,
  };

  const fontOptions = [
    '"JetBrains Mono", "Fira Code", Consolas, monospace',
    '"Fira Code", Consolas, monospace',
    '"Cascadia Code", Consolas, monospace',
    'Consolas, monospace',
    '"Courier New", monospace',
  ];

  let settings = $state<TerminalSettings>(defaultSettings);
  let vietnameseImeSettings = $state<VietnameseImeSettings>(defaultVietnameseImeSettings);
  let activeTab = $state<'terminal' | 'vietnamese'>('terminal');
  let patchStatus = $state<any>(null);
  let isPatching = $state(false);
  let patchMessage = $state<string | null>(null);
  let patchTimeoutRef: ReturnType<typeof setTimeout> | null = null;

  let hasLoadedSettings = $state(false);

  $effect(() => {
    // Only load settings once on initial mount, not on every open
    if (isOpen && isWailsAvailable() && !hasLoadedSettings) {
      hasLoadedSettings = true;
      
      backendAPI.getVietnameseImeSettings().then((vn: VietnameseImeSettings) => {
        vietnameseImeSettings = vn || defaultVietnameseImeSettings;
      }).catch((err: any) => console.error('[SettingsModal] Failed to load VN IME settings:', err));

      backendAPI.checkVietnameseImePatchStatus().then((status: any) => {
        const claudeInstalled = status?.claude_code_installed ?? status?.claudeCodeInstalled ?? status?._claudeInstalled ?? false;
        patchStatus = {...status, _claudeInstalled: claudeInstalled};
      }).catch((err: any) => {
        console.error('[SettingsModal] Failed to check VN IME patch status:', err);
        patchStatus = { claude_code_installed: false, claudeCodeInstalled: false, _claudeInstalled: false, error: err.message };
      });
    }
  });

  onMount(() => {
    return () => {
      if (patchTimeoutRef) {
        clearTimeout(patchTimeoutRef);
      }
    };
  });

  function handleSave() {
    if (isWailsAvailable()) {
      backendAPI.setStoreValue('terminal-settings', settings);
      backendAPI.setVietnameseImeSettings(vietnameseImeSettings);
    }
    onClose();
  }

  async function handleApplyPatch() {
    isPatching = true;
    patchMessage = null;
    try {
      const result = await backendAPI.applyVietnameseImePatch();
      if (result.success) {
        let msg = '✅ Patch Applied!\n';
        if (result.version) msg += `• Version: v${result.version}\n`;
        if (result.processesKilled) msg += `• Closed ${result.processesKilled} processes\n`;
        msg += '\n⚠️ Restart Claude Code terminals.';
        patchMessage = msg;
        patchStatus = {...patchStatus, isPatched: true};
      } else {
        patchMessage = `✗ ${result.message}`;
      }
    } catch (err: any) {
      patchMessage = `✗ ${err.message}`;
    } finally {
      isPatching = false;
      if (patchTimeoutRef) clearTimeout(patchTimeoutRef);
      patchTimeoutRef = setTimeout(() => patchMessage = null, 6000);
    }
  }

  async function handleRestore() {
    isPatching = true;
    patchMessage = null;
    try {
      const result = await backendAPI.restoreVietnameseImePatch();
      patchMessage = result.success ? '✓ Restored! Restart terminals to test.' : `✗ ${result.message}`;
      if (result.success) patchStatus = {...patchStatus, isPatched: false};
    } catch (err: any) {
      patchMessage = `✗ ${err.message}`;
    } finally {
      isPatching = false;
      if (patchTimeoutRef) clearTimeout(patchTimeoutRef);
      patchTimeoutRef = setTimeout(() => patchMessage = null, 5000);
    }
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="-1">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <h2 id="settings-title">Settings</h2>
        </div>
        <button class="close-btn" onclick={onClose} aria-label="Close settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="modal-tabs">
        <button
          class="tab-btn"
          class:active={activeTab === 'terminal'}
          onclick={() => activeTab = 'terminal'}
          aria-selected={activeTab === 'terminal'}
          role="tab"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          Terminal
        </button>
        <button
          class="tab-btn"
          class:active={activeTab === 'vietnamese'}
          onclick={() => activeTab = 'vietnamese'}
          aria-selected={activeTab === 'vietnamese'}
          role="tab"
        >
          <span class="tab-icon">🇻🇳</span>
          Vietnamese IME
        </button>
      </div>

      <!-- Content -->
      <div class="modal-body">
        {#if activeTab === 'terminal'}
          <div class="settings-group">
            <h3 class="group-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              Appearance
            </h3>

            <div class="setting-item">
              <label class="setting-label" for="font-size">Font Size</label>
              <div class="setting-control">
                <input
                  id="font-size"
                  type="range"
                  min="10"
                  max="24"
                  bind:value={settings.fontSize}
                  class="range-input"
                />
                <span class="value-badge">{settings.fontSize}px</span>
              </div>
            </div>

            <div class="setting-item">
              <label class="setting-label" for="font-family">Font Family</label>
              <div class="setting-control">
                <select id="font-family" bind:value={settings.fontFamily} class="select-input">
                  {#each fontOptions as font}
                    <option value={font}>{font.split(',')[0].replace(/"/g, '')}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="setting-item">
              <label class="setting-label" for="theme">Theme</label>
              <div class="setting-control">
                <select id="theme" bind:value={settings.theme} class="select-input">
                  <option value="dark">🌙 Dark</option>
                  <option value="light">☀️ Light</option>
                  <option value="system">💻 System</option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <h3 class="group-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              Behavior
            </h3>

            <label class="checkbox-item">
              <input type="checkbox" bind:checked={settings.cursorBlink} />
              <span class="checkbox-label">Cursor Blink</span>
              <span class="checkbox-description">Animate cursor blinking in terminal</span>
            </label>

            <label class="checkbox-item">
              <input type="checkbox" bind:checked={settings.showCommandBlocks} />
              <span class="checkbox-label">Show Command Blocks</span>
              <span class="checkbox-description">Highlight command blocks in terminal output</span>
            </label>

            <div class="setting-item">
              <label class="setting-label" for="scrollback">Scrollback Lines</label>
              <div class="setting-control">
                <input
                  id="scrollback"
                  type="number"
                  min="1000"
                  max="50000"
                  step="1000"
                  bind:value={settings.scrollback}
                  class="number-input"
                />
              </div>
            </div>
          </div>
        {:else}
          <div class="settings-group">
            <h3 class="group-title">
              <span class="tab-icon">🇻🇳</span>
              Vietnamese IME Support
            </h3>

            <p class="setting-description">
              Enable Vietnamese IME support to type Vietnamese characters in Claude Code terminals.
              This patches the readline module to handle Vietnamese input correctly.
            </p>

            <label class="checkbox-item">
              <input type="checkbox" bind:checked={vietnameseImeSettings.enabled} />
              <span class="checkbox-label">Enable Vietnamese IME Patch</span>
              <span class="checkbox-description">Apply patches for Vietnamese character input</span>
            </label>

            <label class="checkbox-item">
              <input type="checkbox" bind:checked={vietnameseImeSettings.autoPatch} />
              <span class="checkbox-label">Auto-apply Patch</span>
              <span class="checkbox-description">Automatically apply patch when Claude Code is detected</span>
            </label>

            {#if patchStatus?._claudeInstalled}
              <div class="patch-actions">
                <button
                  class="btn btn-primary"
                  onclick={handleApplyPatch}
                  disabled={isPatching}
                >
                  {#if isPatching}
                    <span class="spinner"></span>
                    Applying...
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Apply Patch
                  {/if}
                </button>

                <button
                  class="btn btn-secondary"
                  onclick={handleRestore}
                  disabled={isPatching}
                >
                  {#if isPatching}
                    <span class="spinner"></span>
                    Restoring...
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    Restore
                  {/if}
                </button>
              </div>
            {:else}
              <div class="patch-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Claude Code must be installed to use this feature
              </div>
            {/if}

            {#if patchMessage}
              <div class="patch-message" class:error={patchMessage.startsWith('✗')}>
                <pre>{patchMessage}</pre>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={onClose}>Cancel</button>
        <button class="btn btn-primary" onclick={handleSave}>Save Changes</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Modal Overlay */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    animation: fadeIn 200ms var(--ease-out);
    padding: var(--space-4);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Modal Container */
  .modal-container {
    background: var(--color-bg-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    width: 560px;
    max-width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 300ms var(--ease-spring);
    overflow: hidden;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Header */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--color-border);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--color-text);
  }

  .header-title h2 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-subtext0);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .close-btn:hover {
    background: var(--color-bg-surface0);
    color: var(--color-text);
  }

  /* Tabs */
  .modal-tabs {
    display: flex;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-6) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--color-text-subtext0);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: -1px;
  }

  .tab-btn:hover {
    color: var(--color-text);
  }

  .tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .tab-icon {
    font-size: var(--text-sm);
  }

  /* Body */
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6);
  }

  .settings-group {
    margin-bottom: var(--space-6);
  }

  .settings-group:last-child {
    margin-bottom: 0;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-primary);
    margin: 0 0 var(--space-4);
  }

  .setting-description {
    font-size: var(--text-sm);
    color: var(--color-text-subtext0);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-4);
  }

  /* Setting Items */
  .setting-item {
    margin-bottom: var(--space-4);
  }

  .setting-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--color-text);
    margin-bottom: var(--space-2);
  }

  .setting-control {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  /* Inputs */
  .range-input {
    flex: 1;
    height: 6px;
    background: var(--color-bg-surface0);
    border-radius: var(--radius-full);
    outline: none;
    -webkit-appearance: none;
  }

  .range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: transform var(--transition-fast);
  }

  .range-input::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  .select-input,
  .number-input {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text);
    background: var(--color-bg-surface0);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    transition: all var(--transition-fast);
  }

  .select-input:focus,
  .number-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.15);
  }

  .value-badge {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-surface0);
    border-radius: var(--radius-sm);
    color: var(--color-text-subtext0);
    min-width: 50px;
    text-align: center;
  }

  /* Checkbox Items */
  .checkbox-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);
    margin-bottom: var(--space-2);
  }

  .checkbox-item:hover {
    background-color: var(--color-bg-surface0);
  }

  .checkbox-item input[type="checkbox"] {
    grid-row: span 2;
    width: 18px;
    height: 18px;
    accent-color: var(--color-primary);
    cursor: pointer;
  }

  .checkbox-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--color-text);
  }

  .checkbox-description {
    font-size: var(--text-xs);
    color: var(--color-text-subtext0);
    grid-column: 2;
  }

  /* Patch Actions */
  .patch-actions {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .patch-notice {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-bg-surface0);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-text-subtext0);
  }

  .patch-message {
    margin-top: var(--space-4);
    padding: var(--space-4);
    background: rgba(166, 227, 161, 0.1);
    border: 1px solid rgba(166, 227, 161, 0.3);
    border-radius: var(--radius-md);
  }

  .patch-message.error {
    background: rgba(243, 139, 168, 0.1);
    border-color: rgba(243, 139, 168, 0.3);
  }

  .patch-message pre {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-bg-base);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-secondary {
    background: var(--color-bg-surface0);
    color: var(--color-text);
    border-color: var(--color-border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-bg-surface1);
    border-color: var(--color-border-hover);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: currentColor;
    border-radius: var(--radius-full);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Footer */
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-6);
    background: var(--color-bg-mantle);
    border-top: 1px solid var(--color-border);
  }
</style>
