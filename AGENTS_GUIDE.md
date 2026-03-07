# AI Coding Agents Support in TDT Space

TDT Space now supports **12+ AI coding agents** that can be run in parallel terminal workspaces.

## Supported Agents

### Core Agents (Already Integrated)
- **Claude Code** 🤖 - Anthropic's CLI agent (with Vietnamese IME patch support)
- **OpenCode** 📦 - Open source coding agent
- **Droid** ⚡ - Custom AI agent

### New Agents (v1.2.0+)

#### Google & Big Tech
- **Gemini CLI** ✨ - Google's AI agent with 1M token context window
- **Codex CLI** 🧠 - OpenAI's lightweight coding agent (Rust-based)
- **Kiro** ☁️ - AWS's AI coding agent with deep AWS integration

#### Independent & Open Source
- **Cursor CLI** 🎯 - AI-powered coding from Cursor IDE
- **Oh My Pi** 🥧 - Minimalist, extensible agent (4 core tools)
- **Aider** 🚀 - Git-native AI pair programming with auto-commits
- **Goose** 🪿 - Extensible AI agent by Block (formerly Square)
- **Amp** 🔥 - Code quality focused agent
- **Warp AI** ⚡ - Modern terminal with built-in AI

## Installation

Each agent requires separate installation. Open **Settings → 📦 Agents Guide** in TDT Space for detailed installation instructions.

### Quick Install Commands

```bash
# Claude Code
bun install -g @anthropic-ai/claude-code

# Gemini CLI
npm install -g @anthropic-ai/gemini-cli

# Cursor CLI
curl -LsSf https://cursor.com/install.sh | sh

# Codex CLI
npm install -g @openai/codex

# Oh My Pi
curl -fsSL https://get.pi-cli.dev | sh

# Aider
pip install aider-chat

# OpenCode
npm install -g @opencode/cli

# Goose
cargo install goose-ai

# Kiro
npm install -g @aws/kiro
```

## Usage

1. **Create Workspace**: Click `+` or `Ctrl+Shift+N` to create a new workspace
2. **Select Template**: Choose grid layout (1×1, 2×2, 3×2, etc.)
3. **Assign Agents**: Use sliders to allocate agents to terminals
4. **Start Coding**: Each terminal runs its assigned agent independently

## Agent Configuration

Each agent can be configured with:
- **Command**: Custom command override (default: agent name)
- **Args**: Additional CLI arguments
- **API Key**: Provider-specific API keys
- **Enabled**: Toggle on/off

## Tips

- **Mix & Match**: Run different agents side-by-side for comparison
- **Resource Management**: Each agent runs in its own process - monitor system resources
- **API Keys**: Store API keys securely in each agent's config
- **Vietnamese IME**: Claude Code includes auto-patch for Vietnamese IME support

## Documentation

- **In-App Guide**: Settings → 📦 Agents Guide
- **Agent Websites**: Click agent cards in the guide for official docs
- **Workspace Templates**: Save custom agent allocations as templates

## Troubleshooting

### Agent not found
- Install the agent using the guide
- Ensure it's in your system PATH
- Restart TDT Space after installation

### API errors
- Check API key configuration
- Verify subscription/credits with provider
- Check network connectivity

### Vietnamese IME issues (Claude Code)
- Auto-patch should run automatically
- Manual patch: Settings → Vietnamese IME → Apply Patch
- Restart Claude Code terminals after patching

---

**TDT Space v1.2.0+** - Multi-Agent Terminal for AI-Assisted Development
