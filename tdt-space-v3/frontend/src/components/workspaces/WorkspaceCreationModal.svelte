<script lang="ts">
  import { workspaceStore } from '../../stores';
  import type { Template, WorkspaceCreationConfig } from '../../types/workspace';
  import type { AgentType, AgentConfig } from '../../types/agent';
  import { backendAPI } from '../../services/wails-bridge';
  import AgentItem from './AgentItem.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    editingWorkspace?: any;
  }

  let { isOpen, onClose, editingWorkspace = null }: Props = $props();

  const emojis = ['📁', '📂', '💼', '🗂️', '📊', '📈', '💻', '⚡', '🔥', '🚀', '🎯', '⭐', '🔷', '🔶', '💎', '🎨'];
  
  // Agent configurations with proper AgentType values
  const AGENT_CONFIGS: { type: AgentType; name: string; icon: string }[] = [
    { type: 'claude-code', name: 'Claude Code', icon: '🟣' },
    { type: 'opencode', name: 'OpenCode', icon: '🔵' },
    { type: 'droid', name: 'Droid', icon: '🟢' },
    { type: 'codex', name: 'Codex', icon: '🟡' },
    { type: 'cursor', name: 'Cursor', icon: '🔷' },
    { type: 'gemini-cli', name: 'Gemini CLI', icon: '💎' },
    { type: 'aider', name: 'Aider', icon: '🟠' },
    { type: 'goose', name: 'Goose', icon: '🪿' },
    { type: 'oh-my-pi', name: 'Oh My Pi', icon: '🥧' },
    { type: 'warp', name: 'Warp', icon: '⚡' },
    { type: 'amp', name: 'Amp', icon: '🔌' },
    { type: 'kiro', name: 'Kiro', icon: '🎯' },
  ];

  const builtinTemplates = [
    { id: 'single', name: 'Single', columns: 1, rows: 1, icon: '①' },
    { id: 'dual', name: 'Dual', columns: 2, rows: 1, icon: '②' },
    { id: 'quad', name: 'Quad', columns: 2, rows: 2, icon: '④' },
    { id: 'six', name: 'Six', columns: 3, rows: 2, icon: '⑥' },
    { id: 'eight', name: 'Eight', columns: 4, rows: 2, icon: '⑧' },
  ];

  let currentStep = $state<'template' | 'configure'>('template');
  let selectedTemplate = $state<Template | null>(null);
  let workspaceName = $state('My Workspace');
  let selectedIcon = $state(emojis[0]);
  let workingDir = $state('');
  let columns = $state(2);
  let rows = $state(2);
  
  // Agent assignments for each slot (index -> AgentType | null)
  let slotAssignments = $state<(AgentType | null)[]>([]);

  $effect(() => {
    if (editingWorkspace) {
      workspaceName = editingWorkspace.name;
      selectedIcon = editingWorkspace.icon || emojis[0];
      columns = editingWorkspace.columns;
      rows = editingWorkspace.rows;
      selectedTemplate = null;
      currentStep = 'configure';
    }
  });
  
  $effect(() => {
    // Reset slot assignments when layout changes
    const totalSlots = columns * rows;
    slotAssignments = Array(totalSlots).fill(null);
  });

  function selectTemplate(template: typeof builtinTemplates[0]) {
    selectedTemplate = template as unknown as Template;
    columns = template.columns;
    rows = template.rows;
    currentStep = 'configure';
  }
  
  function handleDragStart(e: DragEvent, agentType: AgentType) {
    e.dataTransfer?.setData('application/json', JSON.stringify({ type: agentType }));
    e.dataTransfer!.effectAllowed = 'copy';
  }
  
  function handleDropOnSlot(e: DragEvent, slotIndex: number) {
    e.preventDefault();
    const data = e.dataTransfer?.getData('application/json');
    if (data) {
      const { type } = JSON.parse(data);
      slotAssignments[slotIndex] = type as AgentType;
      slotAssignments = [...slotAssignments];
    }
  }
  
  function handleSlotClick(slotIndex: number) {
    slotAssignments[slotIndex] = null;
    slotAssignments = [...slotAssignments];
  }
  
  function handleAutoDistribute() {
    // Distribute agents evenly across slots
    const totalSlots = columns * rows;
    const agentTypes = AGENT_CONFIGS.map(a => a.type);
    
    slotAssignments = slotAssignments.map((_, i) => {
      return agentTypes[i % agentTypes.length];
    });
  }
  
  function clearAllAgents() {
    slotAssignments = Array(columns * rows).fill(null);
  }

  async function browseDirectory() {
    try {
      // Check if backendAPI has showOpenDialog
      const result = await (backendAPI as any).showOpenDialog?.({
        title: 'Select Working Directory',
        properties: ['openDirectory'],
        defaultPath: workingDir || undefined,
      });
      
      if (result && !result.canceled && result.filePaths.length > 0) {
        workingDir = result.filePaths[0];
      }
    } catch (err) {
      console.error('Failed to browse directory:', err);
      // Fallback: use native file input
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          // Get directory path from first file
          const path = (files[0] as any).path || files[0].webkitRelativePath;
          if (path) {
            workingDir = path.split('/').slice(0, -1).join('/');
          }
        }
      };
      input.click();
    }
  }

  async function handleCreateWorkspace() {
    // Build agent assignments for slots that have agents
    const agentAssignments: Record<string, AgentConfig> = {};
    slotAssignments.forEach((agentType, index) => {
      if (agentType) {
        agentAssignments[`term-${index}`] = {
          type: agentType,
          enabled: true,
        };
      }
    });

    const config: WorkspaceCreationConfig = {
      name: workspaceName,
      columns,
      rows,
      cwd: workingDir || './',
      icon: selectedIcon,
      agentAssignments,
    };

    try {
      if (editingWorkspace) {
        await workspaceStore.updateWorkspace(editingWorkspace.id, {
          name: workspaceName,
          icon: selectedIcon,
          columns,
          rows,
        });
      } else {
        await workspaceStore.addWorkspace(config);
      }
      onClose();
      resetForm();
    } catch (err) {
      console.error('Failed to create/update workspace:', err);
      alert('Failed to create workspace: ' + (err as Error).message);
    }
  }

  function resetForm() {
    currentStep = 'template';
    selectedTemplate = null;
    workspaceName = 'My Workspace';
    selectedIcon = emojis[0];
    workingDir = '';
    columns = 2;
    rows = 2;
    slotAssignments = [];
  }

  function handleClose() {
    onClose();
    resetForm();
  }

  function goBack() {
    if (currentStep === 'configure') {
      currentStep = 'template';
    }
  }
  
  function getAgentCount(type: AgentType): number {
    return slotAssignments.filter(a => a === type).length;
  }
  
  function incrementAgent(type: AgentType) {
    // Find first empty slot
    const emptyIndex = slotAssignments.findIndex(a => a === null);
    if (emptyIndex !== -1) {
      slotAssignments[emptyIndex] = type;
      slotAssignments = [...slotAssignments];
    }
  }
  
  function decrementAgent(type: AgentType) {
    // Find last slot with this agent
    const lastIndex = slotAssignments.lastIndexOf(type);
    if (lastIndex !== -1) {
      slotAssignments[lastIndex] = null;
      slotAssignments = [...slotAssignments];
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={handleClose} role="dialog" aria-modal="true" tabindex="-1">
    <div class="creation-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <div class="modal-header">
        <h3 id="creation-modal-title">{editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}</h3>
        <button class="close-btn" onclick={handleClose} aria-label="Close">×</button>
      </div>

      {#if currentStep === 'template'}
        <div class="step-content">
          <p class="step-description">Choose a template for your workspace:</p>
          <div class="template-grid">
            {#each builtinTemplates as template}
              <button
                class="template-card"
                class:selected={selectedTemplate?.id === template.id}
                onclick={() => selectTemplate(template)}
              >
                <span class="template-icon">{template.icon}</span>
                <span class="template-name">{template.name}</span>
                <span class="template-layout">{template.columns}×{template.rows}</span>
              </button>
            {/each}
          </div>
        </div>
      {:else if currentStep === 'configure'}
        <div class="step-content configure-step">
          <div class="configure-layout">
            <!-- Left: Basic Settings -->
            <div class="settings-panel">
              <div class="form-group">
                <label for="workspace-name">Workspace Name</label>
                <input id="workspace-name" type="text" bind:value={workspaceName} placeholder="My Workspace" />
              </div>

              <div class="form-group">
                <span id="workspace-icon-label" class="field-label">Icon</span>
                <div class="icon-grid" role="group" aria-labelledby="workspace-icon-label">
                  {#each emojis as emoji}
                    <button
                      class="icon-btn"
                      class:selected={selectedIcon === emoji}
                      onclick={() => selectedIcon = emoji}
                      aria-pressed={selectedIcon === emoji}
                    >
                      {emoji}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="form-group">
                <label for="workspace-dir">Working Directory</label>
                <div class="dir-input-group">
                  <input id="workspace-dir" type="text" bind:value={workingDir} placeholder="./" />
                  <button class="btn-browse" onclick={browseDirectory} title="Browse..." aria-label="Browse for directory">📁</button>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="workspace-columns">Columns</label>
                  <input id="workspace-columns" type="number" min="1" max="8" bind:value={columns} />
                </div>
                <div class="form-group">
                  <label for="workspace-rows">Rows</label>
                  <input id="workspace-rows" type="number" min="1" max="8" bind:value={rows} />
                </div>
              </div>
            </div>
            
            <!-- Right: Agent Assignment -->
            <div class="agents-panel">
              <div class="agents-header">
                <h4>Agent Assignment</h4>
                <div class="agent-actions">
                  <button class="btn-auto" onclick={handleAutoDistribute}>Auto</button>
                  <button class="btn-clear" onclick={clearAllAgents}>Clear</button>
                </div>
              </div>
              
              <!-- Slots Grid -->
              <div class="slots-grid" style="--cols: {Math.min(columns, 4)}; --rows: {Math.ceil(slotAssignments.length / Math.min(columns, 4))};">
                {#each slotAssignments as agent, i}
                  <div
                    class="slot"
                    class:assigned={agent !== null}
                    onclick={() => handleSlotClick(i)}
                    ondragover={(e) => e.preventDefault()}
                    ondrop={(e) => handleDropOnSlot(e, i)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === 'Enter' && handleSlotClick(i)}
                    title={agent ? AGENT_CONFIGS.find(a => a.type === agent)?.name : `Slot ${i + 1} (click to clear)`}
                  >
                    <span class="slot-number">{i + 1}</span>
                    {#if agent}
                      {@const agentInfo = AGENT_CONFIGS.find(a => a.type === agent)}
                      <span class="slot-agent">{agentInfo?.icon}</span>
                    {:else}
                      <span class="slot-placeholder">+</span>
                    {/if}
                  </div>
                {/each}
              </div>
              
              <!-- Agent Palette -->
              <div class="agent-palette">
                <p class="hint">Drag agents to slots or use +/- buttons:</p>
                <div class="agent-list">
                  {#each AGENT_CONFIGS as { type, name, icon }}
                    <AgentItem
                      {type}
                      {name}
                      {icon}
                      count={getAgentCount(type)}
                      max={columns * rows}
                      onIncrement={() => incrementAgent(type)}
                      onDecrement={() => decrementAgent(type)}
                      onDragStart={handleDragStart}
                    />
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-back" onclick={goBack}>← Back</button>
          <button class="btn-create" onclick={handleCreateWorkspace} disabled={!workspaceName.trim()}>
            {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .creation-modal {
    background: var(--color-bg-surface0, #1e1e2e);
    border-radius: 12px;
    width: 800px;
    max-width: 90vw;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border, #45475a);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border, #45475a);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--color-text, #cdd6f4);
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-subtext0, #6c7086);
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    color: var(--color-text, #cdd6f4);
    background: var(--color-bg-surface1, #313244);
  }

  .step-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .step-description {
    color: var(--color-text-subtext0, #a6adc8);
    margin: 0 0 16px;
    font-size: 14px;
  }

  /* Template Grid */
  .template-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .template-card {
    background: var(--color-bg-surface1, #313244);
    border: 2px solid var(--color-border, #45475a);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .template-card:hover {
    background: var(--color-bg-surface2, #41435a);
    border-color: var(--color-border-hover, #585b70);
  }

  .template-card.selected {
    border-color: var(--color-primary, #89b4fa);
    background: rgba(137, 180, 250, 0.1);
  }

  .template-icon {
    font-size: 32px;
  }

  .template-name {
    color: var(--color-text, #cdd6f4);
    font-weight: 500;
  }

  .template-layout {
    color: var(--color-text-subtext0, #6c7086);
    font-size: 12px;
  }

  /* Configure Step */
  .configure-step {
    padding: 16px;
  }

  .configure-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
    height: 100%;
  }

  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label,
  .form-group .field-label {
    color: var(--color-text, #cdd6f4);
    font-size: 12px;
    font-weight: 500;
  }

  .form-group input {
    background: var(--color-bg-base, #1e1e2e);
    border: 1px solid var(--color-border, #45475a);
    color: var(--color-text, #cdd6f4);
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13px;
    outline: none;
    transition: all 0.15s ease;
  }

  .form-group input:focus {
    border-color: var(--color-primary, #89b4fa);
  }

  .hint {
    color: var(--color-text-subtext0, #6c7086);
    font-size: 11px;
    margin: 0;
  }

  .dir-input-group {
    display: flex;
    gap: 6px;
  }

  .dir-input-group input {
    flex: 1;
  }

  .btn-browse {
    padding: 6px 10px;
    background: var(--color-bg-surface1, #313244);
    border: 1px solid var(--color-border, #45475a);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s ease;
  }

  .btn-browse:hover {
    background: var(--color-bg-surface2, #41435a);
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  .icon-btn {
    background: var(--color-bg-base, #1e1e2e);
    border: 2px solid transparent;
    border-radius: 6px;
    padding: 6px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    background: var(--color-bg-surface1, #313244);
  }

  .icon-btn.selected {
    border-color: var(--color-primary, #89b4fa);
    background: rgba(137, 180, 250, 0.1);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* Agents Panel */
  .agents-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .agents-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .agents-header h4 {
    margin: 0;
    color: var(--color-text, #cdd6f4);
    font-size: 14px;
  }

  .agent-actions {
    display: flex;
    gap: 6px;
  }

  .btn-auto,
  .btn-clear {
    padding: 4px 10px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .btn-auto {
    background: var(--color-primary, #89b4fa);
    color: var(--color-bg-base, #1e1e2e);
  }

  .btn-clear {
    background: var(--color-bg-surface1, #313244);
    color: var(--color-text, #cdd6f4);
  }

  .btn-auto:hover {
    background: var(--color-primary-hover, #74a9f0);
  }

  .btn-clear:hover {
    background: var(--color-error, #f38ba8);
    color: var(--color-bg-base, #1e1e2e);
  }

  /* Slots Grid */
  .slots-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), 1fr);
    grid-template-rows: repeat(var(--rows, 2), 1fr);
    gap: 6px;
    padding: 10px;
    background: var(--color-bg-base, #1e1e2e);
    border-radius: 8px;
    border: 1px solid var(--color-border, #45475a);
    min-height: 120px;
  }

  .slot {
    background: var(--color-bg-surface1, #313244);
    border: 2px dashed var(--color-border, #45475a);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    min-height: 40px;
    aspect-ratio: 1;
  }

  .slot:hover {
    border-color: var(--color-border-hover, #585b70);
    background: var(--color-bg-surface2, #41435a);
  }

  .slot.assigned {
    border-style: solid;
    border-color: var(--color-primary, #89b4fa);
    background: rgba(137, 180, 250, 0.1);
  }

  .slot-number {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 9px;
    color: var(--color-text-subtext0, #6c7086);
    font-weight: 600;
  }

  .slot-agent {
    font-size: 18px;
  }

  .slot-placeholder {
    font-size: 16px;
    color: var(--color-text-subtext0, #6c7086);
  }

  /* Agent Palette */
  .agent-palette {
    margin-top: auto;
  }

  .agent-list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    max-height: 120px;
    overflow-y: auto;
  }


  /* Footer */
  .modal-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--color-border, #45475a);
    background: var(--color-bg-mantle, #181825);
  }

  .btn-back,
  .btn-create {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .btn-back {
    background: var(--color-bg-surface1, #313244);
    color: var(--color-text, #cdd6f4);
  }

  .btn-create {
    background: var(--color-primary, #89b4fa);
    color: var(--color-bg-base, #1e1e2e);
    margin-left: auto;
  }

  .btn-back:hover {
    background: var(--color-bg-surface2, #41435a);
  }

  .btn-create:hover {
    background: var(--color-primary-hover, #74a9f0);
  }

  .btn-create:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>