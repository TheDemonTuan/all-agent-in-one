# TDT Space - Build Guide

## 📦 Quick Start

### Production Build (Recommended)

```bash
# From tdt-space-v3 directory
cd tdt-space-v3

# Windows
.\build.bat prod

# Linux/macOS
./build.sh prod
```

**Output:** `bin/TDT Space.exe` (~3.6MB after UPX compression)

---

## 🚀 Available Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `prod` | `p`, `production` | Production build with all optimizations |
| `dev` | `d` | Development mode with hot reload |
| `debug` | - | Debug build with devtools |
| `installer` | - | Build NSIS installer |
| `windows` | `w` | Build for Windows (amd64) |
| `linux` | `l` | Build for Linux (amd64) |
| `macos` | `m` | Build for macOS Intel (amd64) |
| `macos-arm` | - | Build for macOS Apple Silicon (arm64) |
| `all` | `a` | Build for all platforms |
| `clean` | - | Clean build artifacts |
| `info` | - | Show build information |

---

## 📋 Usage Examples

### 1. Production Build

```bash
# Quick production build
.\build.bat prod

# Clean build
.\build.bat clean
.\build.bat prod

# Or chain commands
.\build.bat clean && .\build.bat prod
```

### 2. Development Mode

```bash
# Start development server with hot reload
.\build.bat dev
```

This will:
- Start frontend dev server on port 9245
- Enable hot module replacement (HMR)
- Include debug symbols
- Watch for file changes

### 3. Multi-Platform Build

```bash
# Build for all platforms
.\build.bat all

# Outputs:
# - bin/TDT Space.exe (Windows)
# - bin/TDT-Space (Linux)
# - bin/TDT-Space (macOS Intel)
# - bin/TDT-Space (macOS ARM)
```

---

## 🔧 Build Optimizations

### Production Build Includes:

1. **Symbol Stripping** (`-s -w`)
   - Removes debug symbols
   - ~30% size reduction

2. **PIE Mode** (`-buildmode=pie`)
   - Position-independent executable
   - Enhanced security

3. **Static Linking** (`-extldflags=-static`)
   - Better portability
   - Fewer dependencies

4. **Trimpath**
   - Removes file system paths
   - Reproducible builds
   - Enhanced security

5. **UPX Compression**
   - ~50% additional size reduction
   - Slightly slower startup (~100ms)
   - *Not applied to macOS builds*

### Build Size Comparison:

| Stage | Size | Reduction |
|-------|------|-----------|
| Debug build | ~50MB | - |
| Production | ~10.5MB | ~80% |
| After UPX | ~3.6MB | ~65% more |
| **Total** | | **~93% smaller** |

---

## 🛠️ Advanced Usage

### Direct Task Commands

For more control, use `wails3 task` directly:

```bash
# Build with custom architecture
wails3 task windows:build ARCH=amd64 EXTRA_TAGS=production

# Build without frontend rebuild (if unchanged)
wails3 task windows:build SKIP_FRONTEND=true

# Force rebuild
wails3 task windows:build -f

# Verbose output
wails3 task windows:build -v
```

### Custom Build Flags

Edit `build/windows/Taskfile.yml` to customize:

```yaml
vars:
  BUILD_FLAGS: '-trimpath -buildvcs=false -ldflags="-s -w -H windowsgui -buildmode=pie -extldflags=-static"'
```

### Version Stamping

Add version info to binary:

```bash
# In build.bat or manually
wails3 task windows:build \
  EXTRA_TAGS="production" \
  LDFLAGS="-X main.version=1.0.0 -X main.buildTime=2026-03-12"
```

---

## 📁 Output Structure

```
tdt-space-v3/
├── bin/
│   ├── TDT Space.exe          # Windows binary
│   ├── TDT-Space              # Linux binary
│   └── TDT-Space-app          # macOS .app bundle
├── build/
│   └── bin/                   # Alternative output (old builds)
└── frontend/
    └── dist/                  # Built frontend assets
```

---

## 🔍 Troubleshooting

### Build Fails

**Check Go compilation:**
```bash
go build -v
```

**Check frontend build:**
```bash
cd frontend
bun run build
```

**Clean and retry:**
```bash
.\build.bat clean
.\build.bat prod
```

### Binary Too Large

1. Ensure production mode: `.\build.bat prod`
2. Check UPX is available: Look for `[✓] UPX compression available`
3. Manually compress: `upx --best bin\TDT\ Space.exe`

### Slow Builds

1. **Use build cache** - Automatic in Go and Vite
2. **Skip unchanged steps:**
   ```bash
   wails3 build -skipbindings
   ```
3. **Clean build** (if issues):
   ```bash
   .\build.bat clean
   .\build.bat prod
   ```

### UPX Not Found

Download UPX from: https://github.com/upx/upx/releases

Place `upx.exe` in:
- Project root (`E:\tdt-clone\upx.exe`), OR
- `tdt-space-v3` directory

---

## 📊 Build Performance

### Typical Build Times:

| Phase | Time |
|-------|------|
| Go mod tidy | <1s |
| Install frontend deps | <1s (cached) |
| Generate bindings | 2-5s |
| Build frontend | 5-15s |
| Generate syso | 1-2s |
| Go compilation | 5-10s |
| UPX compression | 2-5s |
| **Total** | **15-40s** |

### Tips for Faster Builds:

1. Keep `node_modules` - Don't clean unnecessarily
2. Use `dev` mode during development
3. Run `clean` only when needed
4. Build cache is automatic in Go and Vite

---

## 🎯 Best Practices

### ✅ Do:

- Use `dev` mode during development
- Use `prod` for releases
- Run `clean` before major releases
- Test builds on target platforms
- Keep UPX updated for best compression

### ❌ Don't:

- Commit `bin/` directory to Git
- Use debug builds for production
- Skip testing on target platforms
- Remove build optimizations

---

## 🔗 Related Documentation

- [Wails v3 Build System](https://v3alpha.wails.io/concepts/build-system/)
- [Build Customization](https://v3alpha.wails.io/guides/build/customization/)
- [Building Applications](https://v3alpha.wails.io/guides/build/building/)
- [Taskfile Documentation](https://taskfile.dev/)

---

## 📞 Support

For build issues:
1. Check this guide first
2. Run `.\build.bat info` for environment details
3. Check Wails docs: https://v3alpha.wails.io/
4. Ask in Discord: https://discord.gg/JDdSxwjhGf
