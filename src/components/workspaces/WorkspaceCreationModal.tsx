import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTemplateStore } from '../../stores/templateStore';
import { AgentConfig, AgentType, AgentAllocation, Template, WorkspaceLayout } from '../../types/workspace';
import { AgentAllocationSlider } from '../agents/AgentAllocationSlider';
import { TemplateSelector } from '../agents/TemplateSelector';

// Import generateId from workspaceStore to avoid duplication
const generateId = () => Math.random().toString(36).substring(2, 9);

interface WorkspaceCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWorkspace?: WorkspaceLayout | null;
}

const agentTypeInfo: { type: AgentType; label: string; description: string; icon: string; color: string }[] = [
  { type: 'claude-code', label: 'Claude Code', description: "Anthropic's CLI agent", icon: '🤖', color: '#a6adc8' },
  { type: 'opencode', label: 'OpenCode', description: 'Open source coding agent', icon: '🔓', color: '#a6adc8' },
  { type: 'droid', label: 'Droid', description: 'Custom AI agent', icon: '🤖', color: '#a6adc8' },
  { type: 'gemini-cli', label: 'Gemini CLI', description: "Google's AI agent", icon: '✨', color: '#89b4fa' },
  { type: 'cursor', label: 'Cursor CLI', description: 'AI-powered coding', icon: '🎯', color: '#f38ba8' },
  { type: 'codex', label: 'Codex CLI', description: "OpenAI's coding agent", icon: '🧠', color: '#a6e3a1' },
  { type: 'oh-my-pi', label: 'Oh My Pi', description: 'Minimalist agent', icon: '🥧', color: '#fab387' },
  { type: 'aider', label: 'Aider', description: 'Git-native AI pair', icon: '🚀', color: '#cba6f7' },
  { type: 'goose', label: 'Goose', description: 'Extensible AI agent', icon: '🪿', color: '#94e2d5' },
  { type: 'warp', label: 'Warp AI', description: 'Terminal with AI', icon: '⚡', color: '#f9e2af' },
  { type: 'amp', label: 'Amp', description: 'Code quality agent', icon: '🔥', color: '#eba0ac' },
  { type: 'kiro', label: 'Kiro', description: 'AWS coding agent', icon: '☁️', color: '#89dceb' },
];

const emojis = ['💼', '🚀', '💻', '🔧', '⚡', '🎯', '📦', '🛠️', '📊', '🎨'];

// Helper function to extract agent allocation from existing workspace
const extractAgentAllocation = (
  terminals: WorkspaceLayout['terminals']
): AgentAllocation => {
  const allocation: AgentAllocation = {
    claudeCode: 0,
    opencode: 0,
    droid: 0,
    geminiCli: 0,
    cursor: 0,
    codex: 0,
    ohMyPi: 0,
    aider: 0,
    goose: 0,
    warp: 0,
    amp: 0,
    kiro: 0,
  };

  terminals.forEach(term => {
    if (term.agent) {
      switch (term.agent.type) {
        case 'claude-code': allocation.claudeCode++; break;
        case 'opencode': allocation.opencode++; break;
        case 'droid': allocation.droid++; break;
        case 'gemini-cli': allocation.geminiCli++; break;
        case 'cursor': allocation.cursor++; break;
        case 'codex': allocation.codex++; break;
        case 'oh-my-pi': allocation.ohMyPi++; break;
        case 'aider': allocation.aider++; break;
        case 'goose': allocation.goose++; break;
        case 'warp': allocation.warp++; break;
        case 'amp': allocation.amp++; break;
        case 'kiro': allocation.kiro++; break;
      }
    }
  });

  return allocation;
};

// Helper function to generate agent assignments from allocation
const generateAgentAssignments = (
  allocation: AgentAllocation,
  total: number
): Record<string, AgentConfig> => {
  const assignments: Record<string, AgentConfig> = {};
  let terminalIndex = 0;

  // Allocate agents in order of priority
  const agentAllocations = [
    { type: 'claude-code' as const, count: allocation.claudeCode },
    { type: 'opencode' as const, count: allocation.opencode },
    { type: 'droid' as const, count: allocation.droid },
    { type: 'gemini-cli' as const, count: allocation.geminiCli },
    { type: 'cursor' as const, count: allocation.cursor },
    { type: 'codex' as const, count: allocation.codex },
    { type: 'oh-my-pi' as const, count: allocation.ohMyPi },
    { type: 'aider' as const, count: allocation.aider },
    { type: 'goose' as const, count: allocation.goose },
    { type: 'warp' as const, count: allocation.warp },
    { type: 'amp' as const, count: allocation.amp },
    { type: 'kiro' as const, count: allocation.kiro },
  ];

  // Allocate each agent type
  for (const agent of agentAllocations) {
    for (let i = 0; i < agent.count; i++) {
      assignments[`terminal-${terminalIndex++}`] = { type: agent.type, enabled: true };
    }
  }

  // Rest are None
  while (terminalIndex < total) {
    assignments[`terminal-${terminalIndex++}`] = { type: 'none', enabled: false };
  }

  return assignments;
};

export const WorkspaceCreationModal: React.FC<WorkspaceCreationModalProps> = ({ isOpen, onClose }) => {
  const { addWorkspace, setCurrentWorkspace, updateWorkspace, editingWorkspace } = useWorkspaceStore();
  const { loadTemplates } = useTemplateStore();

  const isEditMode = !!editingWorkspace;

  // Step 1: Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Step 2: Basic Info
  const [workspaceName, setWorkspaceName] = useState('My Workspace');
  const [selectedIcon, setSelectedIcon] = useState(emojis[0]);

  // Step 3: Working Directory
  const [workingDir, setWorkingDir] = useState('./');

  // Step 4: Agent Allocation
  const [agentAllocation, setAgentAllocation] = useState<AgentAllocation>({
    claudeCode: 0,
    opencode: 0,
    droid: 0,
    geminiCli: 0,
    cursor: 0,
    codex: 0,
    ohMyPi: 0,
    aider: 0,
    goose: 0,
    warp: 0,
    amp: 0,
    kiro: 0,
  });

  // Derived state from template
  const totalTerminals = selectedTemplate ? selectedTemplate.columns * selectedTemplate.rows : 0;
  const allocatedCount = agentAllocation.claudeCode + agentAllocation.opencode + agentAllocation.droid + 
                          agentAllocation.geminiCli + agentAllocation.cursor + agentAllocation.codex + 
                          agentAllocation.ohMyPi + agentAllocation.aider + agentAllocation.goose + 
                          agentAllocation.warp + agentAllocation.amp + agentAllocation.kiro;
  const noneCount = totalTerminals - allocatedCount;

  // Generate agentAssignments from allocation
  const [agentAssignments, setAgentAssignments] = useState<Record<string, AgentConfig>>({});

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  // Load workspace data when editing
  useEffect(() => {
    if (isEditMode && editingWorkspace && isOpen) {
      // Preload workspace data into form
      setWorkspaceName(editingWorkspace.name);
      setSelectedIcon(editingWorkspace.icon || emojis[0]);
      setWorkingDir(editingWorkspace.terminals[0]?.cwd || './');
      
      // Extract agent allocation from existing terminals
      const allocation = extractAgentAllocation(editingWorkspace.terminals);
      setAgentAllocation(allocation);

      // Find matching template
      loadTemplates();
      const { getTemplate } = useTemplateStore.getState();
      const template = getTemplateByLayout(editingWorkspace.columns, editingWorkspace.rows);
      if (template) {
        setSelectedTemplate(template);
      }
    } else if (!isEditMode) {
      // Reset form for create mode
      resetForm();
    }
  }, [editingWorkspace, isEditMode, isOpen]);

  useEffect(() => {
    if (totalTerminals > 0) {
      const assignments = generateAgentAssignments(agentAllocation, totalTerminals);
      setAgentAssignments(assignments);
    }
  }, [agentAllocation, totalTerminals]);

  // Reset allocation when template changes if it exceeds new total
  useEffect(() => {
    if (allocatedCount > totalTerminals && totalTerminals > 0) {
      setAgentAllocation({
        claudeCode: 0,
        opencode: 0,
        droid: 0,
        geminiCli: 0,
        cursor: 0,
        codex: 0,
        ohMyPi: 0,
        aider: 0,
        goose: 0,
        warp: 0,
        amp: 0,
        kiro: 0,
      });
    }
  }, [totalTerminals]);

// Helper function to find template by layout
const getTemplateByLayout = (columns: number, rows: number): Template | null => {
  const { getTemplate } = useTemplateStore.getState();
  
  // Try to find exact match
  const templates = [
    getTemplate('single'),      // 1x1
    getTemplate('dual'),        // 2x1
    getTemplate('quad'),        // 2x2
    getTemplate('six'),         // 3x2
    getTemplate('eight'),       // 4x2
    getTemplate('ten'),         // 5x2
    getTemplate('twelve'),      // 4x3
    getTemplate('fourteen'),    // custom
    getTemplate('sixteen'),     // 4x4
  ].filter(Boolean) as Template[];

  return templates.find(t => t.columns === columns && t.rows === rows) || null;
};

// Initialize with single template when modal opens
useEffect(() => {
  if (isOpen && !selectedTemplate && !isEditMode) {
    // Default to "single" template - will be loaded asynchronously
    const initTemplates = async () => {
      await loadTemplates();
      const { getTemplate } = useTemplateStore.getState();
      const singleTemplate = getTemplate('single');
      if (singleTemplate) {
        setSelectedTemplate(singleTemplate);
      }
    };
    initTemplates();
  }
}, [isOpen, isEditMode]);

  const handleBrowseFolder = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Working Directory',
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setWorkingDir(result.filePaths[0]);
      }
    } else {
      const folder = prompt('Enter working directory path:', workingDir);
      if (folder) {
        setWorkingDir(folder);
      }
    }
  };

  const handleReset = () => {
    setAgentAllocation({
      claudeCode: 0,
      opencode: 0,
      droid: 0,
      geminiCli: 0,
      cursor: 0,
      codex: 0,
      ohMyPi: 0,
      aider: 0,
      goose: 0,
      warp: 0,
      amp: 0,
      kiro: 0,
    });
  };

  const handleAutoDistribute = () => {
    if (totalTerminals === 0) return;

    // Auto-fill by priority: distribute evenly among top agents
    const numAgents = 12; // Total number of agent types
    const base = Math.floor(totalTerminals / numAgents);
    const remainder = totalTerminals % numAgents;

    const allocation = {
      claudeCode: base,
      opencode: base,
      droid: base,
      geminiCli: base,
      cursor: base,
      codex: base,
      ohMyPi: base,
      aider: base,
      goose: base,
      warp: base,
      amp: base,
      kiro: base,
    };

    // Distribute remainder
    const keys = Object.keys(allocation) as (keyof typeof allocation)[];
    for (let i = 0; i < remainder; i++) {
      allocation[keys[i]]++;
    }

    setAgentAllocation(allocation);
  };

  const handleCreateWorkspace = () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    const finalAgentAssignments: Record<string, AgentConfig> = {};
    Object.entries(agentAssignments).forEach(([key, config], index) => {
      finalAgentAssignments[`term-${index}`] = config;
    });

    if (isEditMode && editingWorkspace) {
      // Edit mode: recreate workspace with new layout
      const getShell = () => editingWorkspace.terminals[0]?.shell || 'powershell.exe';
      
      const newTerminals = [];
      const totalNewTerminals = selectedTemplate.columns * selectedTemplate.rows;
      
      // Preserve agent allocation based on the slider values
      let terminalIndex = 0;
      
      // Helper to allocate terminals for an agent type
      const allocateAgent = (type: AgentType, count: number) => {
        for (let i = 0; i < count && terminalIndex < totalNewTerminals; i++) {
          newTerminals.push({
            id: generateId(),
            title: `Terminal ${terminalIndex + 1}`,
            cwd: workingDir,
            shell: getShell(),
            status: 'stopped' as const,
            agent: { type, enabled: true },
          });
          terminalIndex++;
        }
      };
      
      // Allocate agents based on current allocation
      allocateAgent('claude-code', agentAllocation.claudeCode);
      allocateAgent('opencode', agentAllocation.opencode);
      allocateAgent('droid', agentAllocation.droid);
      allocateAgent('gemini-cli', agentAllocation.geminiCli);
      allocateAgent('cursor', agentAllocation.cursor);
      allocateAgent('codex', agentAllocation.codex);
      allocateAgent('oh-my-pi', agentAllocation.ohMyPi);
      allocateAgent('aider', agentAllocation.aider);
      allocateAgent('goose', agentAllocation.goose);
      allocateAgent('warp', agentAllocation.warp);
      allocateAgent('amp', agentAllocation.amp);
      allocateAgent('kiro', agentAllocation.kiro);
      
      // Fill remaining with none
      while (terminalIndex < totalNewTerminals) {
        newTerminals.push({
          id: generateId(),
          title: `Terminal ${terminalIndex + 1}`,
          cwd: workingDir,
          shell: getShell(),
          status: 'stopped' as const,
          agent: { type: 'none' as const, enabled: false },
        });
        terminalIndex++;
      }

      // Update workspace with new layout and terminals
      updateWorkspace(editingWorkspace.id, {
        name: workspaceName,
        icon: selectedIcon,
        columns: selectedTemplate.columns,
        rows: selectedTemplate.rows,
        terminals: newTerminals,
      });
    } else {
      // Create mode: add new workspace
      const workspace = addWorkspace({
        name: workspaceName,
        columns: selectedTemplate.columns,
        rows: selectedTemplate.rows,
        cwd: workingDir,
        icon: selectedIcon,
        agentAssignments: finalAgentAssignments,
        templateId: selectedTemplate.id,
      });

      setCurrentWorkspace(workspace);
    }
    
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setWorkspaceName('My Workspace');
    setSelectedIcon(emojis[0]);
    setSelectedTemplate(null);
    setWorkingDir('./');
    setAgentAllocation({
      claudeCode: 0,
      opencode: 0,
      droid: 0,
      geminiCli: 0,
      cursor: 0,
      codex: 0,
      ohMyPi: 0,
      aider: 0,
      goose: 0,
      warp: 0,
      amp: 0,
      kiro: 0,
    });
  };

  // Calculate max values for each slider
  const getMaxForAgent = (excludeKey: keyof AgentAllocation) => {
    const sumOthers = Object.entries(agentAllocation)
      .filter(([key]) => key !== excludeKey)
      .reduce((sum, [, value]) => sum + value, 0);
    return totalTerminals - sumOthers;
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{isEditMode ? 'Edit Workspace' : 'Create New Workspace'}</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Step 1: Template Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>1. Select Template</h3>
            <p style={styles.sectionDescription}>
              Choose a pre-built template or create a custom one
            </p>
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          </div>

          {/* Step 2: Basic Info */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>2. Basic Information</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                style={styles.input}
                placeholder="Enter workspace name"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Icon</label>
              <div style={styles.emojiPicker}>
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedIcon(emoji)}
                    style={{
                      ...styles.emojiButton,
                      backgroundColor: selectedIcon === emoji ? '#45475a' : 'transparent',
                      border: selectedIcon === emoji ? '2px solid #89b4fa' : '1px solid #45475a',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Working Directory */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>3. Working Directory</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Terminal Working Directory</label>
              <div style={styles.folderInput}>
                <input
                  type="text"
                  value={workingDir}
                  onChange={(e) => setWorkingDir(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="e.g., C:\Projects\my-app"
                />
                <button onClick={handleBrowseFolder} style={styles.browseButton}>
                  📁 Browse
                </button>
              </div>
            </div>
          </div>

          {/* Step 4: Agent Allocation */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>4. AI Agents Allocation</h3>
            <p style={styles.sectionDescription}>
              Drag sliders to allocate AI agents to terminals
            </p>

            {/* Allocation Summary */}
            <div style={styles.allocationSummary}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Total Terminals:</span>
                <span style={styles.summaryValue}>{totalTerminals}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Allocated:</span>
                <span style={{
                  ...styles.summaryValue,
                  color: allocatedCount > totalTerminals ? '#f38ba8' : '#a6e3a1'
                }}>
                  {allocatedCount}/{totalTerminals}
                </span>
              </div>
              {noneCount > 0 && (
                <div style={styles.summaryRow}>
                  <span style={{ ...styles.summaryLabel, color: '#6c7086' }}>None (plain terminals):</span>
                  <span style={{ ...styles.summaryValue, color: '#6c7086' }}>{noneCount}</span>
                </div>
              )}
            </div>

            {/* Agent Sliders */}
            <div style={styles.slidersContainer}>
              {agentTypeInfo.map((agent) => {
                const allocationKey = agent.type === 'claude-code' ? 'claudeCode' : 
                                     agent.type === 'opencode' ? 'opencode' :
                                     agent.type === 'gemini-cli' ? 'geminiCli' :
                                     agent.type === 'cursor' ? 'cursor' :
                                     agent.type === 'codex' ? 'codex' :
                                     agent.type === 'oh-my-pi' ? 'ohMyPi' :
                                     agent.type === 'aider' ? 'aider' :
                                     agent.type === 'goose' ? 'goose' :
                                     agent.type === 'warp' ? 'warp' :
                                     agent.type === 'amp' ? 'amp' :
                                     agent.type === 'kiro' ? 'kiro' : 'droid';
                
                return (
                  <AgentAllocationSlider
                    key={agent.type}
                    label={agent.label}
                    icon={agent.icon}
                    value={agentAllocation[allocationKey]}
                    maxValue={getMaxForAgent(allocationKey)}
                    onChange={(value) => setAgentAllocation(prev => ({
                      ...prev,
                      [allocationKey]: value
                    }))}
                    color={agent.color}
                    description={agent.description}
                  />
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={styles.allocationActions}>
              <button onClick={handleReset} style={styles.resetButton}>
                🔄 Reset to None
              </button>
              <button onClick={handleAutoDistribute} style={styles.autoButton}>
                ⚡ Auto-distribute
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleCreateWorkspace}
            style={{
              ...styles.createButton,
              opacity: selectedTemplate ? 1 : 0.5,
              pointerEvents: selectedTemplate ? 'auto' : 'none',
            }}
          >
            {isEditMode ? '💾 Save Changes' : '🚀 Create Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1e1e2e',
    borderRadius: '12px',
    border: '1px solid #45475a',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #45475a',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#cdd6f4',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#a6adc8',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0 8px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#89b4fa',
    marginBottom: '16px',
  },
  sectionDescription: {
    fontSize: '13px',
    color: '#a6adc8',
    marginBottom: '12px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#bac2de',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    backgroundColor: '#313244',
    border: '1px solid #45475a',
    borderRadius: '6px',
    color: '#cdd6f4',
    outline: 'none',
  },
  emojiPicker: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  emojiButton: {
    fontSize: '24px',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  folderInput: {
    display: 'flex',
    gap: '8px',
  },
  browseButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#45475a',
    color: '#cdd6f4',
    border: '1px solid #585b70',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  allocationSummary: {
    backgroundColor: '#313244',
    border: '1px solid #45475a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#bac2de',
  },
  summaryValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#cdd6f4',
    backgroundColor: '#45475a',
    padding: '4px 12px',
    borderRadius: '4px',
  },
  slidersContainer: {
    marginBottom: '16px',
  },
  allocationActions: {
    display: 'flex',
    gap: '12px',
  },
  resetButton: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#313244',
    color: '#a6adc8',
    border: '1px solid #45475a',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  autoButton: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#45475a',
    color: '#89b4fa',
    border: '1px solid #585b70',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid #45475a',
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: 'transparent',
    color: '#a6adc8',
    border: '1px solid #45475a',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  createButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#89b4fa',
    color: '#1e1e2e',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
