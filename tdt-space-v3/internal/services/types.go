package services

// ============================================================================
// TERMINAL TYPES
// ============================================================================

// SpawnResult is returned when spawning a terminal.
type SpawnResult struct {
	Success bool   `json:"success"`
	PID     int    `json:"pid,omitempty"`
	Error   string `json:"error,omitempty"`
}

// KillResult is returned when killing a terminal.
type KillResult struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// CleanupResult is returned when cleaning up terminals.
type CleanupResult struct {
	Success bool     `json:"success"`
	Cleaned []string `json:"cleaned"`
}

// TerminalDataEvent is sent via events when terminal produces output.
type TerminalDataEvent struct {
	TerminalID string `json:"terminalId"`
	Data       string `json:"data"`
}

// TerminalExitEvent is sent via events when terminal exits.
type TerminalExitEvent struct {
	TerminalID string `json:"terminalId"`
	ExitCode   int    `json:"exitCode"`
}

// TerminalStartedEvent is sent when terminal is ready.
type TerminalStartedEvent struct {
	TerminalID string `json:"terminalId"`
	PID        int    `json:"pid"`
}

// TerminalErrorEvent is sent when terminal encounters an error.
type TerminalErrorEvent struct {
	TerminalID string `json:"terminalId"`
	Error      string `json:"error"`
}

// ============================================================================
// AGENT TYPES
// ============================================================================

// AgentConfig matches src/config/agents.ts
type AgentConfig struct {
	Type        string   `json:"type"`
	Command     string   `json:"command"`
	DisplayName string   `json:"displayName"`
	Description string   `json:"description,omitempty"`
	DefaultArgs []string `json:"defaultArgs,omitempty"`
}

// ============================================================================
// WORKSPACE TYPES
// ============================================================================

// AgentAssignment matches src/types/workspace.ts AgentConfig
type AgentAssignment struct {
	Type    string   `json:"type"`
	Enabled bool     `json:"enabled"`
	Command string   `json:"command,omitempty"`
	Args    []string `json:"args,omitempty"`
	ApiKey  string   `json:"apiKey,omitempty"`
}

// TerminalPane matches src/types/workspace.ts
type TerminalPane struct {
	ID        string           `json:"id"`
	CWD       string           `json:"cwd"`
	Title     string           `json:"title,omitempty"`
	Shell     string           `json:"shell,omitempty"`
	Status    string           `json:"status"` // "running" | "stopped" | "error"
	Agent     *AgentAssignment `json:"agent,omitempty"`
	ProcessId int              `json:"processId,omitempty"`
}

// Workspace matches src/types/workspace.ts
type Workspace struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Columns   int            `json:"columns"`
	Rows      int            `json:"rows"`
	Terminals []TerminalPane `json:"terminals"`
	Icon      string         `json:"icon,omitempty"`
	CreatedAt int64          `json:"createdAt"`
	LastUsed  int64          `json:"lastUsed"`
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

// Template matches src/stores/templateStore.ts
type Template struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description,omitempty"`
	Columns     int            `json:"columns"`
	Rows        int            `json:"rows"`
	Terminals   []TerminalPane `json:"terminals"`
	CreatedAt   int64          `json:"createdAt"`
}

// ============================================================================
// TERMINAL HISTORY TYPES
// ============================================================================

// HistoryEntry represents a command history entry.
type HistoryEntry struct {
	Command   string `json:"command"`
	Timestamp int64  `json:"timestamp"`
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

// DialogOptions mirrors Electron's showOpenDialog options.
type DialogOptions struct {
	Title       string   `json:"title,omitempty"`
	DefaultPath string   `json:"defaultPath,omitempty"`
	ButtonLabel string   `json:"buttonLabel,omitempty"`
	Properties  []string `json:"properties,omitempty"` // e.g. ["openDirectory"]
}

// DialogResult mirrors Electron's showOpenDialog result.
type DialogResult struct {
	Canceled  bool     `json:"canceled"`
	FilePaths []string `json:"filePaths"`
}

// ============================================================================
// DIRECTORY LISTING TYPES
// ============================================================================

// DirectoryEntry represents a single file or directory entry.
type DirectoryEntry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	IsDirectory bool   `json:"isDirectory"`
}

// DirectoryListing is the result of listing a directory.
type DirectoryListing struct {
	Entries []DirectoryEntry `json:"entries"`
	Error   string           `json:"error,omitempty"`
}

// ============================================================================
// VIETNAMESE IME TYPES
// ============================================================================

// PatchResult matches src/utils/vietnameseImePatch.ts PatchResult
type PatchResult struct {
	Success         bool   `json:"success"`
	AlreadyPatched  bool   `json:"alreadyPatched,omitempty"`
	Message         string `json:"message,omitempty"`
	PatchedPath     string `json:"patchedPath,omitempty"`
	ProcessesKilled int    `json:"processesKilled,omitempty"`
	Version         string `json:"version,omitempty"`
}

// PatchValidation matches src/utils/vietnameseImePatch.ts PatchValidation
type PatchValidation struct {
	IsValid     bool     `json:"isValid"`
	IsPatched   bool     `json:"isPatched"`
	Issues      []string `json:"issues"`
	Suggestions []string `json:"suggestions"`
}

// RestoreResult matches src/utils/vietnameseImePatch.ts RestoreResult
type RestoreResult struct {
	Success    bool   `json:"success"`
	Message    string `json:"message,omitempty"`
	BackupPath string `json:"backupPath,omitempty"`
}

// PatchStatus represents the current patch status.
type PatchStatus struct {
	IsPatched           bool   `json:"isPatched"`
	ClaudePath          string `json:"claudePath"`
	HasBackup           bool   `json:"hasBackup"`
	InstalledVia        string `json:"installedVia"` // "bun" | "npm" | "pnpm" | "binary" | "unknown"
	Version             string `json:"version,omitempty"`
	ClaudeCodeInstalled bool   `json:"claude_code_installed"`
}

// IMESettings stores Vietnamese IME settings.
type IMESettings struct {
	Enabled        bool   `json:"enabled"`
	AutoPatch      bool   `json:"autoPatch"`
	PatchedVersion string `json:"patchedVersion,omitempty"`
}

// RestartResult is returned when restarting Claude terminals.
type RestartResult struct {
	Success   bool     `json:"success"`
	Restarted []string `json:"restarted"`
	Error     string   `json:"error,omitempty"`
}

// ============================================================================
// GENERIC RESULT
// ============================================================================

// Result is a generic success/error result.
type Result struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}
