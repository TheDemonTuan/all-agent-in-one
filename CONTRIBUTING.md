# Contributing to TDT Space

Thank you for your interest in contributing to TDT Space! This document provides guidelines and instructions for contributing.

## 🎯 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might not need to create one. When you are creating a bug report, please include as many details as possible:

**Template:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. Windows 11]
- Version: [e.g. v0.1.0]
- Node: [e.g. v18.0.0]
- Bun: [e.g. v1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Features

Enhancement suggestions are welcome! Please create an issue with:

**Template:**
```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Naming**: 
  - Components: PascalCase (e.g., `TerminalCell.tsx`)
  - Utils/Functions: camelCase (e.g., `formatDate.ts`)
  - Constants: UPPER_SNAKE_CASE
- **Files**: Match component/function name

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add terminal pane resizing
fix: Fix workspace switching bug
docs: Update README with installation steps
style: Format code according to guidelines
refactor: Refactor terminal initialization
test: Add unit tests for workspace store
chore: Update dependencies
```

### Branch Naming

```
feature/description
fix/description
hotfix/description
docs/description
refactor/description
```

## 🛠️ Development Setup

### Prerequisites

- Node.js v18+
- Bun v1.0+
- Git

### Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/all-agent-in-one.git
cd all-agent-in-one

# Install dependencies
bun install

# Start development
bun run dev
```

### Testing

```bash
# Run linter
bun run lint

# Run type check
bun run typecheck

# Run tests
bun run test
```

### Building

```bash
# Build for production
bun run build

# Build Electron app
bun run electron:build
```

## 📦 Architecture Overview

### Process Structure

```
┌─────────────────┐
│  Main Process   │
│  (Electron)     │
│  - Window Mgmt  │
│  - IPC Handlers │
│  - PTY Spawning │
└────────┬────────┘
         │ IPC
         ▼
┌─────────────────┐
│ Renderer Process│
│  (React + Vite) │
│  - UI Components│
│  - State Mgmt   │
│  - xterm.js     │
└─────────────────┘
```

### Key Directories

```
src/
├── components/     # React components
├── stores/        # Zustand stores
├── hooks/         # Custom hooks
├── types/         # TypeScript types
├── electron/      # Electron main/preload
└── utils/         # Utility functions
```

### State Management

- Use Zustand for global state
- Keep stores small and focused
- Use selectors for derived state
- Persist to electron-store when needed

## 🎨 UI/UX Guidelines

### Design Principles

1. **Consistency**: Match existing UI patterns
2. **Accessibility**: Support keyboard navigation
3. **Performance**: Avoid unnecessary re-renders
4. **Responsiveness**: Work on different screen sizes

### Component Structure

```tsx
import React from 'react';
import styles from './Component.module.css';

interface ComponentProps {
  // Props definition
}

export function Component({ prop }: ComponentProps) {
  // Component logic
  
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
}
```

## 🔒 Security Guidelines

- Never commit sensitive data
- Use environment variables for secrets
- Validate all user inputs
- Follow CSP (Content Security Policy)
- Keep dependencies updated

## 📝 Documentation

When adding new features:

1. Update README.md if needed
2. Add JSDoc comments to functions
3. Update CHANGELOG.md
4. Add inline comments for complex logic

## 🧪 Testing

Write tests for:

- Core functionality
- Edge cases
- Bug fixes
- New features

Test structure:
```typescript
describe('ComponentName', () => {
  it('should do something', () => {
    // Test implementation
  });
});
```

## 🚀 Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create pull request
4. Get approvals
5. Merge to main
6. Create git tag
7. Build release
8. Publish on GitHub

## 💬 Communication

- Use GitHub Issues for bugs and features
- Use GitHub Discussions for questions
- Be respectful and constructive
- Help others in the community

## 🏆 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Annual contributor highlights

## ❓ Questions?

- Check existing documentation
- Search GitHub Issues/Discussions
- Create a new Discussion post

---

**Thank you for contributing to TDT Space! 🎉**

Your contributions make this project better for everyone.
