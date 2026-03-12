package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"

	"tdt-space/internal/platform"
)

// ============================================================================
// CLAUDE PATH STRATEGY
// ============================================================================

// ClaudePathStrategy defines a strategy for finding Claude Code CLI binary.
type ClaudePathStrategy struct {
	Name      string   // Strategy name (for logging)
	Priority  int      // Lower = higher priority
	Platforms []string // "windows", "darwin", "linux"
	Paths     []string // Path templates to check
	Commands  []string // Commands to run (where, which, bun which, etc.)
}

// Path template variables supported:
// {home}, {claudeExe}, {exeExt}, {BUN_INSTALL}, {APPDATA}, {LOCALAPPDATA},
// {PROGRAMFILES}, {PROGRAMFILES(X86)}, {USERPROFILE}, {npmRoot}

// ============================================================================
// STRATEGY DEFINITIONS
// ============================================================================

// officialInstallerStrategy finds Claude Code installed via official installer.
// According to official docs:
// - Windows: ~/.local/bin/claude.exe (symlink) + ~/.local/share/claude/versions/{version}/claude.exe
// - macOS/Linux: ~/.local/bin/claude + ~/.local/share/claude/versions/{version}/claude
func officialInstallerStrategy(isWin bool, exeName, exeExt string) ClaudePathStrategy {
	home := platform.GetUserHome()
	strategy := ClaudePathStrategy{
		Name:      "official-installer",
		Priority:  0,
		Platforms: []string{"windows", "darwin", "linux"},
		Paths: []string{
			// Primary symlink path (most common)
			filepath.Join(home, ".local", "bin", exeName),
			// Alternative cmd file on Windows
		},
	}

	if isWin {
		strategy.Paths = append(strategy.Paths,
			filepath.Join(home, ".local", "bin", "claude.cmd"),
		)
	}

	return strategy
}

// pathCommandStrategy finds Claude Code via system PATH commands.
func pathCommandStrategy(isWin bool) ClaudePathStrategy {
	strategy := ClaudePathStrategy{
		Name:      "system-path",
		Priority:  1,
		Platforms: []string{"windows", "darwin", "linux"},
		Commands:  []string{},
	}

	if isWin {
		// Windows commands
		strategy.Commands = []string{
			"where claude",
			"powershell -NoProfile -Command \"Get-Command claude -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source\"",
		}
	} else {
		// Unix/macOS commands
		strategy.Commands = []string{
			"which claude",
		}
	}

	return strategy
}

// bunStrategy finds Claude Code installed via Bun package manager.
func bunStrategy(isWin bool, exeName, exeExt string) ClaudePathStrategy {
	bunInstall := os.Getenv("BUN_INSTALL")
	if bunInstall == "" {
		bunInstall = filepath.Join(platform.GetUserHome(), ".bun")
	}

	return ClaudePathStrategy{
		Name:      "bun",
		Priority:  2,
		Platforms: []string{"windows", "darwin", "linux"},
		Commands:  []string{"bun which claude"},
		Paths: []string{
			// Direct binary in bun bin
			filepath.Join(bunInstall, "bin", exeName),
			filepath.Join(bunInstall, "bin", "claude.cmd"),
			// cli.js paths (for script execution)
			filepath.Join(bunInstall, "install", "global", "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
			filepath.Join(bunInstall, "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
			filepath.Join(bunInstall, "global", "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
		},
	}
}

// npmStrategy finds Claude Code installed via npm/yarn/pnpm.
func npmStrategy(isWin bool) ClaudePathStrategy {
	appdata := os.Getenv("APPDATA")
	localappdata := os.Getenv("LOCALAPPDATA")

	strategy := ClaudePathStrategy{
		Name:      "npm",
		Priority:  3,
		Platforms: []string{"windows", "darwin", "linux"},
		Commands:  []string{"npm root -g"},
		Paths:     []string{},
	}

	// Add npm global paths
	if isWin && appdata != "" {
		strategy.Paths = append(strategy.Paths,
			filepath.Join(appdata, "npm", "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
		)
	}
	if isWin && localappdata != "" {
		strategy.Paths = append(strategy.Paths,
			filepath.Join(localappdata, "npm", "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
			filepath.Join(localappdata, "pnpm-global", "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
			filepath.Join(localappdata, "Yarn", "Data", "global", "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
		)
	}

	return strategy
}

// windowsInstallerStrategy finds Claude Code via Windows-specific installers (WinGet, Scoop, etc.).
func windowsInstallerStrategy() ClaudePathStrategy {
	localappdata := os.Getenv("LOCALAPPDATA")
	programfiles := os.Getenv("PROGRAMFILES")
	programfilesx86 := os.Getenv("PROGRAMFILES(X86)")
	userprofile := os.Getenv("USERPROFILE")

	return ClaudePathStrategy{
		Name:      "windows-installers",
		Priority:  4,
		Platforms: []string{"windows"},
		Paths: []string{
			// Official WinGet/PowerShell installer paths (Claude Code)
			filepath.Join(localappdata, "Programs", "Claude Code", "claude.exe"),
			filepath.Join(programfiles, "Claude Code", "claude.exe"),
			filepath.Join(userprofile, "AppData", "Local", "Programs", "Claude Code", "claude.exe"),
			// Legacy paths (Claude)
			filepath.Join(localappdata, "Programs", "Claude", "claude.exe"),
			filepath.Join(localappdata, "Claude", "claude.exe"),
			filepath.Join(programfiles, "Claude", "claude.exe"),
			filepath.Join(programfilesx86, "Claude", "claude.exe"),
			filepath.Join(userprofile, "AppData", "Local", "Programs", "Claude", "claude.exe"),
			// WinGet packages
			filepath.Join(localappdata, "Microsoft", "WinGet", "Packages", "Oven.Oven", "LocalState", "bin", "claude.exe"),
			// Scoop shims
			filepath.Join(userprofile, "scoop", "shims", "claude.exe"),
		},
	}
}

// nvmStrategy finds Claude Code installed via NVM (Node Version Manager).
func nvmStrategy(isWin bool) ClaudePathStrategy {
	strategy := ClaudePathStrategy{
		Name:      "nvm",
		Priority:  5,
		Platforms: []string{"windows", "darwin", "linux"},
		Paths:     []string{},
	}

	if isWin {
		nvmHome := os.Getenv("NVM_HOME")
		if nvmHome != "" {
			// Scan NVM directories for Claude Code
			if entries, err := os.ReadDir(nvmHome); err == nil {
				for _, e := range entries {
					if e.IsDir() {
						strategy.Paths = append(strategy.Paths,
							filepath.Join(nvmHome, e.Name(), "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
						)
					}
				}
			}
		}
	}

	return strategy
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// resolveSymlink resolves symlinks and returns the real path.
func resolveSymlink(path string) string {
	real, err := filepath.EvalSymlinks(path)
	if err != nil {
		return path
	}
	return real
}

// fileExists returns true if the path exists and is a file (not directory).
func fileExists(path string) bool {
	if path == "" {
		return false
	}
	path = filepath.Clean(path)
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return !info.IsDir()
}

// executeCommand runs a command and returns the first line of stdout.
func executeCommand(cmd string, isWin bool) string {
	var c *exec.Cmd
	if isWin {
		c = exec.Command("cmd", "/c", cmd)
		c.SysProcAttr = platform.HiddenWindowAttr()
	} else {
		c = exec.Command("sh", "-c", cmd)
	}

	out, err := c.Output()
	if err != nil {
		return ""
	}

	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(lines) > 0 {
		return strings.TrimSpace(lines[0])
	}
	return ""
}

// contains checks if a string slice contains a string.
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// scanVersionDirectory scans ~/.local/share/claude/versions/ for the latest binary.
// Returns the path to the most recent version's binary.
func scanVersionDirectory(home string, exeName string) string {
	versionsPath := filepath.Join(home, ".local", "share", "claude", "versions")
	entries, err := os.ReadDir(versionsPath)
	if err != nil {
		return ""
	}

	// Collect valid version directories
	type versionEntry struct {
		name string
		path string
	}

	var versionDirs []versionEntry
	for _, entry := range entries {
		if entry.IsDir() {
			candidate := filepath.Join(versionsPath, entry.Name(), exeName)
			if fileExists(candidate) {
				versionDirs = append(versionDirs, versionEntry{
					name: entry.Name(),
					path: candidate,
				})
			}
		}
	}

	if len(versionDirs) == 0 {
		return ""
	}

	// Sort by version name (descending) to get latest first
	// Version names are typically semver like "2.1.74"
	sort.Slice(versionDirs, func(i, j int) bool {
		return versionDirs[i].name > versionDirs[j].name
	})

	// Return the latest version's binary path
	return versionDirs[0].path
}

// logInstallationHelp prints helpful installation instructions.
func logInstallationHelp() {
	fmt.Printf("[VietnameseIME] Claude Code not found in PATH or common locations.\n")
	fmt.Printf("[VietnameseIME] Please install Claude Code using one of these methods:\n")
	fmt.Printf("[VietnameseIME]   (RECOMMENDED) Windows PowerShell: irm https://claude.ai/install.ps1 | iex\n")
	fmt.Printf("[VietnameseIME]   (RECOMMENDED) Windows WinGet:     winget install Anthropic.ClaudeCode\n")
	fmt.Printf("[VietnameseIME]   (RECOMMENDED) macOS/Linux:        curl -fsSL https://claude.ai/install.sh | bash\n")
	fmt.Printf("[VietnameseIME]   (RECOMMENDED) macOS Homebrew:     brew install --cask claude-code\n")
	fmt.Printf("[VietnameseIME]   (DEPRECATED)  bun:                bun install -g @anthropic-ai/claude-code\n")
}

// ============================================================================
// MAIN PATH FINDER
// ============================================================================

// FindClaudePathWithStrategy finds Claude Code CLI binary using configurable strategies.
// Returns the path to the binary, or empty string if not found.
func FindClaudePathWithStrategy() string {
	isWin := runtime.GOOS == "windows"
	exeName := "claude"
	exeExt := ""

	if isWin {
		exeName = "claude.exe"
		exeExt = ".exe"
	}

	// Build all strategies in priority order
	strategies := []ClaudePathStrategy{
		officialInstallerStrategy(isWin, exeName, exeExt),
		pathCommandStrategy(isWin),
		bunStrategy(isWin, exeName, exeExt),
		npmStrategy(isWin),
		windowsInstallerStrategy(),
		nvmStrategy(isWin),
	}

	// Execute strategies in priority order
	for _, strategy := range strategies {
		// Skip if not for this platform
		if !contains(strategy.Platforms, runtime.GOOS) {
			continue
		}

		// Try commands first
		for _, cmd := range strategy.Commands {
			if path := executeCommand(cmd, isWin); path != "" {
				path = strings.TrimSpace(path)
				if fileExists(path) {
					// Resolve symlinks on Unix systems
					if !isWin {
						if resolved := resolveSymlink(path); resolved != "" {
							fmt.Printf("[VietnameseIME] Found Claude via '%s' (%s): %s\n", cmd, strategy.Name, resolved)
							return resolved
						}
					}
					fmt.Printf("[VietnameseIME] Found Claude via '%s' (%s): %s\n", cmd, strategy.Name, path)
					return path
				}
			}
		}

		// Try paths
		for _, p := range strategy.Paths {
			if p == "" {
				continue
			}
			if fileExists(p) {
				fmt.Printf("[VietnameseIME] Found Claude at %s path: %s\n", strategy.Name, p)
				return p
			}
		}

		// Special handling for official installer version scanning
		if strategy.Name == "official-installer" {
			home := platform.GetUserHome()
			if found := scanVersionDirectory(home, exeName); found != "" {
				fmt.Printf("[VietnameseIME] Found Claude via %s (version scan): %s\n", strategy.Name, found)
				return found
			}
		}
	}

	// Not found - provide helpful message
	logInstallationHelp()
	return ""
}
