# TDT Space - Multi-Agent Terminal for TDT Vibe Coding

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Electron](https://img.shields.io/badge/Electron-34.5.8-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows)

**Multi-Agent Terminal** - Chạy nhiều AI coding agents song song trong một giao diện grid terminal

[Download](#download) • [Installation](#installation) • [Usage](#usage) • [Features](#features)

</div>

---

## 🚀 Features

- **🖥️ Grid Terminal Layout**: Chia màn hình thành nhiều terminal panes (1x1, 2x1, 2x2, 3x2, 4x4)
- **🤖 Multi-Agent Support**: Chạy song song nhiều AI agents:
  - Claude Code
  - OpenCode
  - Droid
  - Và các agents khác
- **💾 Workspace Management**: Lưu và quản lý nhiều workspace với cấu hình riêng
- **🎨 Custom Templates**: Tạo và lưu templates workspace tùy chỉnh
- **🔍 Terminal Search**: Tìm kiếm trong lịch sử terminal
- **⌨️ Command History**: Lưu trữ và truy xuất lệnh đã chạy
- **📦 Agent Allocation**: Phân bổ agent cụ thể cho từng terminal pane

---

## 📥 Download

### Windows

#### Pre-built Executable
1. Tải file ZIP từ [Releases](https://github.com/TheDemonTuan/all-agent-in-one/releases)
2. Giải nén vào thư mục mong muốn
3. Chạy `TDT Space.exe`

#### Build from Source
```bash
# Clone repository
git clone https://github.com/TheDemonTuan/all-agent-in-one.git
cd all-agent-in-one

# Cài đặt dependencies
bun install

# Build ứng dụng
bun run electron:build

# Executable sẽ có trong thư mục release/win-unpacked/
```

---

## 🔧 Installation

### Requirements

- **Node.js**: v18+ 
- **Bun**: v1.0+ (package manager)
- **Windows**: 10/11 (64-bit)

### Setup

```bash
# 1. Cài đặt Bun (nếu chưa có)
curl -fsSL https://bun.sh/install | bash

# 2. Clone repository
git clone https://github.com/TheDemonTuan/all-agent-in-one.git
cd all-agent-in-one

# 3. Cài đặt dependencies
bun install

# 4. Chạy development mode
bun run dev

# 5. Build production
bun run electron:build
```

---

## 💡 Usage

### Terminal Grid Layout

TDT Space hỗ trợ các layout terminal sau:

| Layout | Description |
|--------|-------------|
| 1×1 | Single terminal pane |
| 2×1 | Two vertical panes |
| 2×2 | Four panes (quadrant) |
| 3×2 | Six panes |
| 4×4 | Sixteen panes (advanced) |

### Workspace Management

1. **Create Workspace**: Click "+ New Workspace" → Chọn layout → Đặt tên
2. **Switch Workspace**: Use tab bar ở phía trên
3. **Delete Workspace**: Right-click vào workspace tab → Delete

### Agent Allocation

Mỗi terminal pane có thể được gán cho một AI agent cụ thể:
- Click vào terminal pane
- Chọn agent từ dropdown menu
- Agent sẽ được sử dụng khi chạy commands trong pane đó

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + T` | New workspace |
| `Ctrl + W` | Close current workspace |
| `Ctrl + Shift + P` | Command palette |
| `Ctrl + F` | Search in terminal |
| `F11` | Toggle fullscreen |

---

## 🛠️ Development

### Available Scripts

```bash
bun run dev              # Start Vite dev server + Electron (development)
bun run build            # Build React frontend
bun run electron:start   # Start Electron in production mode
bun run electron:dev     # Start Electron in dev mode
bun run electron:only    # Start Electron with built files only
bun run electron:build   # Build and package for distribution
bun run preview          # Preview production build
bun run package          # Package application for release
```

### Project Structure

```
all-agent-in-one/
├── src/
│   ├── components/       # React components
│   ├── stores/          # Zustand state stores
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── electron/        # Electron main & preload scripts
│   └── main.tsx         # React entry point
├── public/              # Static assets
├── scripts/             # Build and utility scripts
├── release/             # Build output (generated)
├── dist/                # Vite build output (generated)
└── dist-electron/       # Electron build output (generated)
```

### Tech Stack

- **Framework**: Electron 34 + Vite 7 + React 19
- **Language**: TypeScript 5.9 (strict mode)
- **State Management**: Zustand
- **Terminal**: xterm.js with node-pty
- **Storage**: electron-store
- **Package Manager**: Bun

---

## 📝 Configuration

### Settings

Access settings via the gear icon in the title bar:

- **Terminal Font Size**: Adjust terminal text size
- **Terminal Theme**: Light/Dark/Custom themes
- **Agent Commands**: Configure commands for each AI agent
- **Auto-save**: Enable/disable workspace auto-save

### Custom Templates

1. Configure workspace layout and agent allocation
2. Click "Save as Template"
3. Name your template
4. Reuse across workspaces

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [xterm.js](https://xtermjs.org/) - Terminal rendering
- [node-pty](https://github.com/microsoft/node-pty) - PTY spawning
- [Electron](https://www.electronjs.org/) - Desktop framework
- [React](https://react.dev/) - UI library
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/TheDemonTuan/all-agent-in-one/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TheDemonTuan/all-agent-in-one/discussions)

---

<div align="center">

**Made with ❤️ by TDT Space Team**

⭐ Star this repo if you find it helpful!

</div>
