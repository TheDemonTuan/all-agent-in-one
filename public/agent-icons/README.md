# Agent Icons

Download official icons for AI agents. Icons should be:
- **Format**: PNG or SVG (SVG preferred for scalability)
- **Size**: 24x24, 48x48, or 64x64 pixels
- **Style**: Consistent, preferably flat/minimal design
- **Background**: Transparent

## Icon Sources

### Official Brand Resources
1. **Claude Code** - https://www.anthropic.com/brand
2. **Cursor** - https://cursor.com/brand
3. **Codex** - https://openai.com/brand
4. **Gemini** - https://about.google/brand-resource-center/
5. **Kiro** - https://kiro.dev/brand
6. **Warp** - https://www.warp.dev/brand

### Icon Repositories
- LobeHub Icons: https://lobehub.com/icons
- TypingMind Icons: https://custom.typingmind.com/tools/model-icons/
- Icons8: https://icons8.com

## Current Icons

| Agent | Icon File | Status |
|-------|-----------|--------|
| Claude Code | `claude-code.png` | ✅ |
| OpenCode | `opencode.svg` | ✅ |
| Droid | `droid.svg` | ✅ |
| Gemini CLI | `gemini-cli.svg` | ✅ |
| Cursor CLI | `cursor-cli.svg` | ✅ |
| Codex CLI | `codex-cli.svg` | ✅ |
| Oh My Pi | `oh-my-pi.svg` | ✅ |
| Aider | `aider.svg` | ✅ |
| Goose | `goose.svg` | ✅ |
| Warp AI | `warp.svg` | ✅ |
| Amp | `amp.svg` | ✅ |
| Kiro | `kiro.svg` | ✅ |

## Usage

Icons are imported in `src/types/workspace.agents.ts` and displayed in the WorkspaceCreationModal.

```tsx
<img src="/agent-icons/claude-code.svg" alt="Claude Code" />
```

## Notes

- All icons should be properly licensed for use
- Keep file sizes small (<50KB per icon)
- Use consistent naming convention: `agent-name.ext`
