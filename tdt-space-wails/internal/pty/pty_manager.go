package pty

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
	"sync"

	"github.com/creack/pty"
	"github.com/wailsapp/wails/v3/pkg/application"
	"tdt-space-wails/internal/patch"
	"tdt-space-wails/internal/types"
)

// PTYProcess represents a running PTY process
type PTYProcess struct {
	ptyFile   *os.File
	cmd       *exec.Cmd
	mu        sync.Mutex
	id        string
	cwd       string
	agentType string
}

// PTYManager manages all PTY processes
type PTYManager struct {
	processes map[string]*PTYProcess
	mu        sync.RWMutex
	app       *application.App
}

// NewPTYManager creates a new PTY manager
func NewPTYManager(app *application.App) *PTYManager {
	return &PTYManager{
		processes: make(map[string]*PTYProcess),
		app:       app,
	}
}

// SpawnResult represents the result of spawning a PTY process
type SpawnResult struct {
	Success bool   `json:"success"`
	PID     int    `json:"pid,omitempty"`
	Error   string `json:"error,omitempty"`
}

// Spawn creates a new PTY process
func (m *PTYManager) Spawn(id, cwd, shell string, args []string) SpawnResult {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Validate working directory
	if err := validateWorkingDirectory(cwd); err != nil {
		return SpawnResult{
			Success: false,
			Error:   err.Error(),
		}
	}

	// Create command
	cmd := exec.Command(shell, args...)
	cmd.Dir = cwd
	cmd.Env = append(os.Environ(), "COLORTERM=truecolor", "TERM_PROGRAM=TDTSpace")

	// Create PTY
	ptyFile, err := pty.Start(cmd)
	if err != nil {
		return SpawnResult{
			Success: false,
			Error:   fmt.Sprintf("Failed to start PTY: %v", err),
		}
	}

	// Store process
	process := &PTYProcess{
		ptyFile: ptyFile,
		cmd:     cmd,
		id:      id,
		cwd:     cwd,
	}
	m.processes[id] = process

	// Start goroutine to read output
	go m.readOutput(id, process)

	return SpawnResult{
		Success: true,
		PID:     cmd.Process.Pid,
	}
}

// SpawnWithAgent creates a new PTY process with an AI agent
func (m *PTYManager) SpawnWithAgent(id, cwd, shell string, args []string, agent types.AgentConfig) SpawnResult {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Validate working directory
	if err := validateWorkingDirectory(cwd); err != nil {
		return SpawnResult{
			Success: false,
			Error:   err.Error(),
		}
	}

	// Auto-patch Vietnamese IME for Claude Code terminals
	if agent.Type == "claude-code" && agent.Enabled {
		if err := ensureVietnameseImePatch(); err != nil {
			log.Printf("Warning: Vietnamese IME patch check failed: %v", err)
		}
	}

	// Build agent command
	agentCommands := map[string]string{
		"claude-code":  "claude",
		"opencode":     "opencode",
		"droid":        "droid",
		"gemini-cli":   "gemini",
		"cursor":       "cursor-agent",
		"codex":        "codex",
		"oh-my-pi":     "pi",
		"aider":        "aider",
		"goose":        "goose",
		"warp":         "warp",
		"amp":          "amp",
		"kiro":         "kiro",
	}

	agentCmd := agent.Command
	if agentCmd == "" {
		agentCmd = agentCommands[agent.Type]
	}

	var finalArgs []string
	if agentCmd != "" && agent.Enabled && agent.Type != "none" {
		// Build full command
		fullCmd := agentCmd
		if len(agent.Args) > 0 {
			fullCmd += " " + joinStrings(agent.Args)
		}

		// Platform-specific args
		if shell == "powershell.exe" {
			finalArgs = []string{"-NoLogo", "-NoExit", "-Command", fullCmd}
		} else {
			finalArgs = []string{"-c", fullCmd + "; exec $SHELL"}
		}
	} else {
		finalArgs = args
	}

	// Create command
	cmd := exec.Command(shell, finalArgs...)
	cmd.Dir = cwd
	cmd.Env = append(os.Environ(), "COLORTERM=truecolor", "TERM_PROGRAM=TDTSpace")

	// Create PTY
	ptyFile, err := pty.Start(cmd)
	if err != nil {
		return SpawnResult{
			Success: false,
			Error:   fmt.Sprintf("Failed to start PTY with agent: %v", err),
		}
	}

	// Store process
	process := &PTYProcess{
		ptyFile:   ptyFile,
		cmd:       cmd,
		id:        id,
		cwd:       cwd,
		agentType: agent.Type,
	}
	m.processes[id] = process

	// Start goroutine to read output
	go m.readOutput(id, process)

	return SpawnResult{
		Success: true,
		PID:     cmd.Process.Pid,
	}
}

// Write writes data to a PTY process
func (m *PTYManager) Write(id, data string) error {
	m.mu.RLock()
	process, exists := m.processes[id]
	m.mu.RUnlock()

	if !exists {
		return fmt.Errorf("PTY process not found: %s", id)
	}

	process.mu.Lock()
	defer process.mu.Unlock()

	_, err := process.ptyFile.Write([]byte(data))
	return err
}

// Kill kills a PTY process
func (m *PTYManager) Kill(id string) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	process, exists := m.processes[id]
	if !exists {
		return false, fmt.Errorf("PTY process not found: %s", id)
	}

	// Kill process
	if err := process.cmd.Process.Kill(); err != nil {
		process.ptyFile.Close()
		return false, fmt.Errorf("Failed to kill process: %v", err)
	}

	// Close pty
	process.ptyFile.Close()

	// Remove from map
	delete(m.processes, id)

	return true, nil
}

// Resize resizes a PTY process
func (m *PTYManager) Resize(id string, cols, rows int) error {
	m.mu.RLock()
	process, exists := m.processes[id]
	m.mu.RUnlock()

	if !exists {
		return fmt.Errorf("PTY process not found: %s", id)
	}

	process.mu.Lock()
	defer process.mu.Unlock()

	// Use pty.Setsize with correct Winsize type
	win := pty.Winsize{
		Rows: uint16(rows),
		Cols: uint16(cols),
	}

	return pty.Setsize(process.ptyFile, &win)
}

// GetProcessCount returns the number of running processes
func (m *PTYManager) GetProcessCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.processes)
}

// CleanupAll kills all PTY processes
func (m *PTYManager) CleanupAll() int {
	m.mu.Lock()
	defer m.mu.Unlock()

	count := 0
	for id, process := range m.processes {
		if err := process.cmd.Process.Kill(); err == nil {
			count++
		}
		process.ptyFile.Close()
		delete(m.processes, id)
	}

	return count
}

// readOutput reads output from PTY and emits events
func (m *PTYManager) readOutput(id string, process *PTYProcess) {
	buffer := make([]byte, 4096)
	for {
		n, err := process.ptyFile.Read(buffer)
		if n > 0 {
			// Emit data event to frontend
			m.app.Event.Emit("terminal-data", map[string]interface{}{
				"id":   id,
				"data": string(buffer[:n]),
			})
		}

		if err != nil {
			if err == io.EOF {
				// Process exited normally
				m.app.Event.Emit("terminal-exit", map[string]interface{}{
					"id":   id,
					"code": 0,
				})
			} else {
				// Error occurred
				m.app.Event.Emit("terminal-error", map[string]interface{}{
					"id":    id,
					"error": err.Error(),
				})
			}

			// Cleanup
			m.mu.Lock()
			delete(m.processes, id)
			m.mu.Unlock()
			process.ptyFile.Close()
			return
		}
	}
}

// validateWorkingDirectory validates that the working directory exists and is accessible
func validateWorkingDirectory(cwd string) error {
	if cwd == "" || cwd == "." || cwd == "./" {
		return nil
	}

	info, err := os.Stat(cwd)
	if err != nil {
		return fmt.Errorf("Directory does not exist: %s", cwd)
	}

	if !info.IsDir() {
		return fmt.Errorf("Path is not a directory: %s", cwd)
	}

	return nil
}

// joinStrings joins a slice of strings with spaces
func joinStrings(args []string) string {
	result := ""
	for i, arg := range args {
		if i > 0 {
			result += " "
		}
		result += arg
	}
	return result
}

// GetShell returns the appropriate shell for the current platform
func GetShell() string {
	if runtime.GOOS == "windows" {
		return "powershell.exe"
	}
	// For Unix-like systems, check for zsh first, then bash
	if _, err := exec.LookPath("zsh"); err == nil {
		return "/bin/zsh"
	}
	return "/bin/bash"
}

// GetShellArgs returns the appropriate shell arguments for the current platform
func GetShellArgs() []string {
	if runtime.GOOS == "windows" {
		return []string{"-NoLogo", "-NoExit"}
	}
	return []string{"-l"}
}

// ensureVietnameseImePatch checks and applies the Vietnamese IME patch if needed
func ensureVietnameseImePatch() error {
	// Check if patch is already applied
	patched, _, err := patch.CheckPatchStatus()
	if err != nil {
		return fmt.Errorf("failed to check patch status: %w", err)
	}

	if !patched {
		log.Println("Vietnamese IME patch not applied, applying now...")
		result, err := patch.ApplyVietnameseImePatch()
		if err != nil {
			return fmt.Errorf("failed to apply Vietnamese IME patch: %w", err)
		}
		if result.Success {
			log.Println("Vietnamese IME patch applied successfully")
		} else {
			return fmt.Errorf("Vietnamese IME patch failed: %s", result.Message)
		}
	}

	return nil
}
