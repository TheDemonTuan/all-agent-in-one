package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"tdt-space-wails/internal/patch"
	"tdt-space-wails/internal/pty"
	"tdt-space-wails/internal/store"
	"tdt-space-wails/internal/types"
)

// App struct
type App struct {
	ctx         context.Context
	app         *application.App
	window      *application.WebviewWindow
	ptyManager  *pty.PTYManager
	configStore *store.DebouncedStore
	workspaces  []types.WorkspaceLayout
	mu          sync.RWMutex
}

// NewApp creates a new App instance
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts
func (a *App) Startup(ctx context.Context, app *application.App) {
	a.ctx = ctx
	a.app = app

	// Initialize PTY manager
	a.ptyManager = pty.NewPTYManager(app)

	// Initialize config store
	configStore, err := store.NewConfigStore("tdt-space")
	if err != nil {
		log.Printf("Failed to create config store: %v", err)
	}
	a.configStore = store.NewDebouncedStore(configStore)

	// Load workspaces from store
	a.loadWorkspaces()

	log.Println("App started successfully")
}

// Shutdown is called when the app is shutting down
func (a *App) Shutdown(ctx context.Context, app *application.App) {
	log.Println("App shutting down, cleaning up terminals...")

	// Kill all PTY processes
	count := a.ptyManager.CleanupAll()
	log.Printf("Cleaned up %d terminal(s)", count)

	// Flush pending saves
	a.configStore.Flush()

	log.Println("App shutdown complete")
}

// SetWindow stores the window reference for window controls
func (a *App) SetWindow(window *application.WebviewWindow) {
	a.window = window
}

// ============================================================================
// PLATFORM & SYSTEM
// ============================================================================

// GetPlatform returns the current platform
func (a *App) GetPlatform() string {
	return runtime.GOOS
}

// GetCwd returns the current working directory of the Go process
func (a *App) GetCwd() string {
	cwd, err := os.Getwd()
	if err != nil {
		return "./"
	}
	return cwd
}

// GetAppVersion returns the application version
func (a *App) GetAppVersion() string {
	// Try to get version from build info or return default
	return "0.1.2"
}

// GetShell returns the appropriate shell for the current platform
func (a *App) GetShell() string {
	return pty.GetShell()
}

// ============================================================================
// WINDOW CONTROLS
// ============================================================================

// WindowMinimize minimizes the main window
func (a *App) WindowMinimize() {
	// Use Wails Runtime API from frontend for minimize
	// This method is kept for compatibility but frontend should use Runtime API
	log.Println("WindowMinimize called - use Wails Runtime API from frontend")
}

// WindowMaximize maximizes the main window
func (a *App) WindowMaximize() {
	// Use Wails Runtime API from frontend for maximize
	// This method is kept for compatibility but frontend should use Runtime API
	log.Println("WindowMaximize called - use Wails Runtime API from frontend")
}

// WindowClose closes the main window
func (a *App) WindowClose() {
	a.app.Quit()
}

// WindowIsMaximised returns whether the window is maximized
func (a *App) WindowIsMaximised() bool {
	// Will be implemented when Wails v3 adds this API
	return false
}

// ============================================================================
// TERMINAL MANAGEMENT
// ============================================================================

// SpawnTerminal spawns a new terminal
func (a *App) SpawnTerminal(id, cwd, workspaceID string) (bool, int, error) {
	shell := pty.GetShell()
	args := pty.GetShellArgs()

	result := a.ptyManager.Spawn(id, cwd, shell, args)

	if result.Success {
		// Emit terminal started event
		a.app.Event.Emit("terminal-started", map[string]interface{}{
			"id": id,
		})
	}

	return result.Success, result.PID, nil
}

// SpawnTerminalWithAgent spawns a terminal with an AI agent
func (a *App) SpawnTerminalWithAgent(id, cwd, workspaceID string, agent types.AgentConfig) (bool, int, error) {
	shell := pty.GetShell()
	args := pty.GetShellArgs()

	result := a.ptyManager.SpawnWithAgent(id, cwd, shell, args, agent)

	if result.Success {
		a.app.Event.Emit("terminal-started", map[string]interface{}{
			"id": id,
		})
	}

	return result.Success, result.PID, nil
}

// WriteToTerminal writes data to a terminal
func (a *App) WriteToTerminal(id, data string) error {
	return a.ptyManager.Write(id, data)
}

// KillTerminal kills a terminal process
func (a *App) KillTerminal(id string) (bool, error) {
	return a.ptyManager.Kill(id)
}

// ResizeTerminal resizes a terminal
func (a *App) ResizeTerminal(id string, cols, rows int) error {
	return a.ptyManager.Resize(id, cols, rows)
}

// ============================================================================
// VIETNAMESE IME PATCH
// ============================================================================

// ApplyVietnameseImePatch applies Vietnamese IME patch to Claude Code CLI
func (a *App) ApplyVietnameseImePatch() (map[string]interface{}, error) {
	result, err := patch.ApplyVietnameseImePatch()
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"message": err.Error(),
		}, err
	}

	return map[string]interface{}{
		"success":        result.Success,
		"alreadyPatched": result.AlreadyPatched,
		"message":        result.Message,
		"patchedPath":    result.PatchedPath,
		"version":        result.Version,
	}, nil
}

// CheckVietnameseImePatchStatus checks if Vietnamese IME patch is applied
func (a *App) CheckVietnameseImePatchStatus() (map[string]interface{}, error) {
	patched, version, err := patch.CheckPatchStatus()
	
	return map[string]interface{}{
		"patched": patched,
		"version": version,
		"error":   err,
	}, nil
}

// ValidateVietnameseImePatch validates the Vietnamese IME patch
func (a *App) ValidateVietnameseImePatch() (map[string]interface{}, error) {
	isValid, issues, suggestions := patch.ValidatePatch()
	
	return map[string]interface{}{
		"isValid":      isValid,
		"issues":       issues,
		"suggestions":  suggestions,
		"isPatched":    isValid && len(issues) == 0,
	}, nil
}

// RestoreVietnameseImePatch restores Claude Code CLI to original version
func (a *App) RestoreVietnameseImePatch() (map[string]interface{}, error) {
	result, err := patch.RestoreVietnameseImePatch()
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"message": err.Error(),
		}, err
	}

	return map[string]interface{}{
		"success": result.Success,
		"message": result.Message,
	}, nil
}

// GetVietnameseImeSettings returns Vietnamese IME settings
func (a *App) GetVietnameseImeSettings() (map[string]interface{}, error) {
	settings, err := a.configStore.Get("vietnamese-ime")
	if err != nil {
		return map[string]interface{}{
			"enabled":   false,
			"autoPatch": true,
		}, nil
	}
	
	if settings == nil {
		return map[string]interface{}{
			"enabled":   false,
			"autoPatch": true,
		}, nil
	}
	
	return settings.(map[string]interface{}), nil
}

// SetVietnameseImeSettings sets Vietnamese IME settings
func (a *App) SetVietnameseImeSettings(settings map[string]interface{}) error {
	return a.configStore.Store.Set("vietnamese-ime", settings)
}

// ValidatePatchForWorkspace validates Vietnamese IME patch for a workspace with Claude terminals
func (a *App) ValidatePatchForWorkspace(workspace map[string]interface{}) (map[string]interface{}, error) {
	// Check if workspace has any Claude terminals
	terminals, ok := workspace["terminals"].([]interface{})
	if !ok {
		return map[string]interface{}{"valid": true, "needsPatch": false}, nil
	}

	hasClaude := false
	for _, t := range terminals {
		terminal, ok := t.(map[string]interface{})
		if !ok {
			continue
		}
		
		agent, ok := terminal["agent"].(map[string]interface{})
		if ok && agent["type"] == "claude-code" && agent["enabled"] == true {
			hasClaude = true
			break
		}
	}

	if !hasClaude {
		return map[string]interface{}{"valid": true, "needsPatch": false}, nil
	}

	// Check patch status
	patched, _, _ := patch.CheckPatchStatus()
	
	return map[string]interface{}{
		"valid":     patched,
		"needsPatch": !patched,
		"isPatched": patched,
	}, nil
}

// ============================================================================
// STORE MANAGEMENT
// ============================================================================

// GetStoreValue retrieves a value from the store
func (a *App) GetStoreValue(key string) (interface{}, error) {
	return a.configStore.Get(key)
}

// SetStoreValue stores a value
func (a *App) SetStoreValue(key string, value interface{}) error {
	return a.configStore.Store.Set(key, value)
}

// ============================================================================
// WORKSPACE MANAGEMENT
// ============================================================================

// GetWorkspaces returns all workspaces
func (a *App) GetWorkspaces() ([]types.WorkspaceLayout, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.workspaces, nil
}

// CreateWorkspace creates a new workspace
func (a *App) CreateWorkspace(config types.WorkspaceCreationConfig) (types.WorkspaceLayout, error) {
	workspace := a.createWorkspaceFromConfig(config)

	a.mu.Lock()
	a.workspaces = append(a.workspaces, workspace)
	a.mu.Unlock()

	// Save to store with debounce
	a.saveWorkspacesDebounced()

	return workspace, nil
}

// DeleteWorkspace deletes a workspace
func (a *App) DeleteWorkspace(id string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	// Find and remove workspace
	for i, ws := range a.workspaces {
		if ws.ID == id {
			a.workspaces = append(a.workspaces[:i], a.workspaces[i+1:]...)
			break
		}
	}

	// Save to store
	a.saveWorkspacesDebounced()

	return nil
}

// SwitchWorkspace switches to a different workspace
func (a *App) SwitchWorkspace(workspaceID string) (bool, error) {
	// Find workspace
	var targetWorkspace *types.WorkspaceLayout
	for i, ws := range a.workspaces {
		if ws.ID == workspaceID {
			targetWorkspace = &a.workspaces[i]
			break
		}
	}

	if targetWorkspace == nil {
		return false, fmt.Errorf("workspace not found: %s", workspaceID)
	}

	// Cleanup terminals from current workspace
	if len(a.workspaces) > 0 && a.workspaces[0].ID != workspaceID {
		// Kill terminals from previous workspace
		for _, terminal := range a.workspaces[0].Terminals {
			a.ptyManager.Kill(terminal.ID)
		}
	}

	// Spawn terminals for new workspace
	for _, terminal := range targetWorkspace.Terminals {
		if terminal.Agent.Enabled && terminal.Agent.Type != "none" {
			a.ptyManager.SpawnWithAgent(terminal.ID, terminal.Cwd, pty.GetShell(), pty.GetShellArgs(), terminal.Agent)
		} else {
			a.ptyManager.Spawn(terminal.ID, terminal.Cwd, pty.GetShell(), pty.GetShellArgs())
		}
	}

	return true, nil
}

// loadWorkspaces loads workspaces from the store
func (a *App) loadWorkspaces() {
	var workspaces []types.WorkspaceLayout
	err := a.configStore.GetTyped("workspaces", &workspaces)
	if err != nil {
		log.Printf("Failed to load workspaces: %v", err)
		a.workspaces = []types.WorkspaceLayout{}
		return
	}

	a.mu.Lock()
	a.workspaces = workspaces
	a.mu.Unlock()
}

// saveWorkspacesDebounced saves workspaces with debouncing
func (a *App) saveWorkspacesDebounced() {
	a.configStore.Set("workspaces", a.workspaces, 300*time.Millisecond)
}

// createWorkspaceFromConfig creates a workspace from config
func (a *App) createWorkspaceFromConfig(config types.WorkspaceCreationConfig) types.WorkspaceLayout {
	terminals := []types.TerminalPane{}
	totalTerminals := config.Columns * config.Rows

	for i := 0; i < totalTerminals; i++ {
		terminalID := generateID()
		agentKey := fmt.Sprintf("term-%d", i)

		agentConfig, exists := config.AgentAssignments[agentKey]
		if !exists {
			agentConfig = types.AgentConfig{
				Type:    "none",
				Enabled: false,
			}
		}

		terminals = append(terminals, types.TerminalPane{
			ID:     terminalID,
			Title:  fmt.Sprintf("Terminal %d", i+1),
			Cwd:    config.Cwd,
			Shell:  pty.GetShell(),
			Status: "stopped",
			Agent:  agentConfig,
		})
	}

	return types.WorkspaceLayout{
		ID:        generateID(),
		Name:      config.Name,
		Columns:   config.Columns,
		Rows:      config.Rows,
		Terminals: terminals,
		Icon:      config.Icon,
		CreatedAt: time.Now().UnixMilli(),
		LastUsed:  time.Now().UnixMilli(),
	}
}

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

// GetTemplates returns all saved templates
func (a *App) GetTemplates() ([]types.WorkspaceLayout, error) {
	var templates []types.WorkspaceLayout
	err := a.configStore.GetTyped("templates", &templates)
	if err != nil {
		return []types.WorkspaceLayout{}, nil
	}
	return templates, nil
}

// SaveTemplate saves a template
func (a *App) SaveTemplate(template types.WorkspaceLayout) error {
	// Get existing templates
	templates, _ := a.GetTemplates()
	
	// Check if template with same ID exists
	found := false
	for i, t := range templates {
		if t.ID == template.ID {
			templates[i] = template
			found = true
			break
		}
	}
	
	if !found {
		templates = append(templates, template)
	}
	
	return a.configStore.Store.Set("templates", templates)
}

// DeleteTemplate deletes a template
func (a *App) DeleteTemplate(id string) error {
	templates, _ := a.GetTemplates()
	
	for i, t := range templates {
		if t.ID == id {
			templates = append(templates[:i], templates[i+1:]...)
			break
		}
	}
	
	return a.configStore.Store.Set("templates", templates)
}

// ============================================================================
// TERMINAL HISTORY
// ============================================================================

// GetTerminalHistory returns command history for a terminal
func (a *App) GetTerminalHistory(terminalID string) ([]string, error) {
	key := fmt.Sprintf("terminal-history-%s", terminalID)
	history, err := a.configStore.Get(key)
	if err != nil {
		return []string{}, nil
	}
	
	if history == nil {
		return []string{}, nil
	}
	
	// Convert to []string
	if hist, ok := history.([]interface{}); ok {
		result := make([]string, len(hist))
		for i, h := range hist {
			if str, ok := h.(string); ok {
				result[i] = str
			}
		}
		return result, nil
	}
	
	return []string{}, nil
}

// SaveTerminalHistory saves command history for a terminal
func (a *App) SaveTerminalHistory(terminalID string, history []string) error {
	key := fmt.Sprintf("terminal-history-%s", terminalID)
	return a.configStore.Store.Set(key, history)
}

// ClearTerminalHistory clears command history for a terminal
func (a *App) ClearTerminalHistory(terminalID string) error {
	key := fmt.Sprintf("terminal-history-%s", terminalID)
	return a.configStore.Store.Delete(key)
}

// ============================================================================
// FILE DIALOGS
// ============================================================================

// ShowOpenDialog shows an open file/folder dialog
func (a *App) ShowOpenDialog(options map[string]interface{}) (map[string]interface{}, error) {
	// Wails v3 alpha has limited dialog support
	// Return canceled for now - frontend should use Wails Runtime API directly
	return map[string]interface{}{
		"canceled":  true,
		"filePaths": []string{},
	}, nil
}

// ============================================================================
// UTILITIES
// ============================================================================

// generateID generates a random ID
func generateID() string {
	return fmt.Sprintf("%x", rand.Int63())
}
