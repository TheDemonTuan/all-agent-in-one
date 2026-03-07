import React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { TerminalCell } from './TerminalCell';
import { WorkspaceLayout } from '../../types/workspace';

export const TerminalGrid = React.memo(() => {
  const { currentWorkspace, activeTerminalId, setActiveTerminal, removeTerminal, splitTerminal } = useWorkspaceStore();

  if (!currentWorkspace) {
    return <div>No workspace selected</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.workspaceContainer}>
        {renderWorkspace(currentWorkspace, activeTerminalId, setActiveTerminal, removeTerminal, splitTerminal)}
      </div>
    </div>
  );
});

TerminalGrid.displayName = 'TerminalGrid';

// Render a single workspace grid
const renderWorkspace = (
  workspace: WorkspaceLayout,
  activeTerminalId: string | null,
  setActiveTerminal: (id: string) => void,
  removeTerminal: (terminalId: string) => void,
  splitTerminal: (terminalId: string, direction: 'horizontal' | 'vertical') => void
) => {
  const { columns, rows, terminals } = workspace;

  // Single terminal
  if (columns === 1 && rows === 1) {
    const terminal = terminals[0];
    return (
      <div style={styles.simpleContainer}>
        <TerminalCell
          terminal={terminal}
          isActive={terminal.id === activeTerminalId}
          onActivate={() => setActiveTerminal(terminal.id)}
          onSplit={(direction) => splitTerminal(terminal.id, direction)}
          onClose={() => removeTerminal(terminal.id)}
        />
      </div>
    );
  }

  // Multiple rows and columns - use CSS grid instead of nested Groups
  if (columns > 1 && rows > 1) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        height: '100%',
        width: '100%',
        gap: '2px',
      }}>
        {terminals.map((terminal: any, index: number) => (
          <div key={terminal.id} style={{ ...styles.simpleContainer, border: '1px solid #45475a40', borderRadius: '4px' }}>
            <TerminalCell
              terminal={terminal}
              isActive={terminal.id === activeTerminalId}
              onActivate={() => setActiveTerminal(terminal.id)}
              onSplit={(direction) => splitTerminal(terminal.id, direction)}
              onClose={() => removeTerminal(terminal.id)}
            />
          </div>
        ))}
      </div>
    );
  }

  // Single row, multiple columns - horizontal layout
  if (rows === 1 && columns > 1) {
    return (
      <Group orientation="horizontal" style={styles.groupContainer}>
        {terminals.map((terminal: any, index: number) => (
          <React.Fragment key={terminal.id}>
            <Panel defaultSize={100 / columns} minSize={10}>
              <div style={styles.simpleContainer}>
                <TerminalCell
                  terminal={terminal}
                  isActive={terminal.id === activeTerminalId}
                  onActivate={() => setActiveTerminal(terminal.id)}
                  onSplit={(direction) => splitTerminal(terminal.id, direction)}
                  onClose={() => removeTerminal(terminal.id)}
                />
              </div>
            </Panel>
            {index < terminals.length - 1 && (
              <Separator />
            )}
          </React.Fragment>
        ))}
      </Group>
    );
  }

  // Single column, multiple rows - vertical layout
  if (columns === 1 && rows > 1) {
    return (
      <Group orientation="vertical" style={styles.groupContainer}>
        {terminals.map((terminal: any, index: number) => (
          <React.Fragment key={terminal.id}>
            <Panel defaultSize={100 / rows} minSize={10}>
              <div style={styles.simpleContainer}>
                <TerminalCell
                  terminal={terminal}
                  isActive={terminal.id === activeTerminalId}
                  onActivate={() => setActiveTerminal(terminal.id)}
                  onSplit={(direction) => splitTerminal(terminal.id, direction)}
                  onClose={() => removeTerminal(terminal.id)}
                />
              </div>
            </Panel>
            {index < terminals.length - 1 && (
              <Separator />
            )}
          </React.Fragment>
        ))}
      </Group>
    );
  }

  return null;
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    width: '100%',
    padding: '0',
    position: 'relative',
    overflow: 'hidden',
  },
  workspaceContainer: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  simpleContainer: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  groupContainer: {
    height: '100%',
    width: '100%',
  },
};
