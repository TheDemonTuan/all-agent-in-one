# Build Optimizations Configuration

## Overview

This document describes the build optimizations configured for TDT Space, following Wails v3 best practices.

## Configuration Files

### 1. **`build/config.yml`** - Central Build Configuration

Centralized build settings for Go compiler and optimizations:

```yaml
build:
  ldflags: "-s -w -buildmode=pie -extldflags=-static"
  tags: "production"
  trimpath: true
  buildvcs: false
  debug: false
  upx:
    enabled: true
    level: "best"
```

### 2. **`frontend/vite.config.ts`** - Frontend Optimizations

Complete frontend build optimizations:

- ✅ **Minification**: Terser with advanced options
- ✅ **Tree-shaking**: Rollup tree-shaking enabled
- ✅ **Code splitting**: Vendor, xterm, zustand chunks
- ✅ **CSS minification**: LightningCSS
- ✅ **Bundle analysis**: Visualizer plugin

### 3. **Platform Taskfiles** - Build Execution

- `build/windows/Taskfile.yml` - Windows build with UPX
- `build/linux/Taskfile.yml` - Linux build with UPX
- `build/darwin/Taskfile.yml` - macOS build (no UPX)

---

## Optimization Breakdown

### Go Backend Optimizations

| Flag | Purpose | Size Reduction |
|------|---------|----------------|
| `-s` | Strip symbol table | ~10% |
| `-w` | Strip DWARF debug info | ~20% |
| `-buildmode=pie` | Position-independent executable | Security |
| `-extldflags=-static` | Static linking | Portability |
| `-trimpath` | Remove file system paths | Reproducibility |
| `UPX --best` | Binary compression | ~65% |

**Total reduction:** ~93% (50MB debug → 3.6MB compressed)

### Frontend Optimizations

| Feature | Configuration | Benefit |
|---------|--------------|---------|
| **Minification** | Terser with 2 passes | ~70% JS reduction |
| **Tree-shaking** | Rollup preset | Removes dead code |
| **Code splitting** | Manual chunks | Better caching |
| **CSS minification** | LightningCSS | Faster builds |
| **Console removal** | drop_console: true | Cleaner code |
| **Bundle analysis** | visualizer plugin | Size tracking |

**Frontend bundle:** ~837KB total (gzipped)

---

## Build Process

### Production Build Flow

```
1. Go mod tidy
   ↓
2. Install frontend dependencies
   ↓
3. Generate TypeScript bindings
   ↓
4. Build frontend (Vite)
   - Minification
   - Tree-shaking
   - Code splitting
   ↓
5. Generate platform assets (icons, syso, etc.)
   ↓
6. Compile Go binary
   - Apply ldflags
   - Strip symbols
   - Enable PIE mode
   ↓
7. UPX compression (Windows/Linux only)
   ↓
8. Output: bin/TDT Space.exe (3.6MB)
```

### Development Build Flow

```
1. Start Vite dev server (port 9245)
   - Hot Module Replacement (HMR)
   - Fast rebuilds
   ↓
2. Watch Go files
   ↓
3. On change: quick rebuild (no optimizations)
   - Debug symbols included
   - Faster compilation
   ↓
4. Launch application
```

---

## Configuration Reference

### Go ldflags Explained

```bash
-s                      # Strip symbol table (smaller binary)
-w                      # Strip DWARF debugging info
-H windowsgui           # Windows: no console window
-buildmode=pie          # Position-independent executable
-extldflags=-static     # Static linking for portability
-tags production        # Enable production build tag
-trimpath               # Remove file paths from binary
-buildvcs=false         # Don't embed VCS info
```

### Vite Build Options

```typescript
{
  minify: 'terser',           // JavaScript minifier
  cssMinify: 'lightningcss',  // CSS minifier (faster)
  sourcemap: false,           // No source maps in production
  terserOptions: {
    compress: {
      drop_console: true,     // Remove console.log
      drop_debugger: true,    // Remove debugger
      pure_getters: true,     // Aggressive optimization
      passes: 2,              // Multiple optimization passes
    }
  }
}
```

### UPX Compression Levels

| Level | Speed | Compression Ratio | Use Case |
|-------|-------|------------------|----------|
| `fast` | ~1s | ~40% | Quick builds |
| `best` | ~3-5s | ~65% | **Production (default)** |
| `ultra-brute` | ~30s | ~68% | Maximum compression |

---

## Platform-Specific Notes

### Windows

- ✅ UPX compression enabled
- ✅ Windows GUI mode (no console)
- ✅ Icon embedded via .syso
- ✅ Manifest for UAC settings

### Linux

- ✅ UPX compression enabled
- ✅ CGO required (native build)
- ✅ .desktop file generated
- ⚠️ Docker may be needed for cross-compilation

### macOS

- ❌ UPX disabled (codesigning issues)
- ✅ Native codesigning (adhoc)
- ✅ .app bundle structure
- ✅ Assets.car for iOS-style icons

---

## Performance Metrics

### Build Times (Typical)

| Phase | Time |
|-------|------|
| Frontend build | 10-15s |
| Go compilation | 5-10s |
| UPX compression | 3-5s |
| **Total** | **18-30s** |

### Binary Sizes

| Stage | Size | Reduction |
|-------|------|-----------|
| Debug build | ~50MB | - |
| Production (stripped) | ~10.5MB | ~80% |
| After UPX | ~3.6MB | ~65% more |
| **Total** | | **~93% smaller** |

### Frontend Bundle Sizes

| Chunk | Size (gzipped) |
|-------|---------------|
| xterm | ~117KB |
| index | ~93KB |
| zustand | ~3.2KB |
| react-vendor | ~1.3KB |
| CSS | ~7.8KB |
| **Total** | **~222KB** |

---

## Best Practices

### ✅ Do

- Use `build.bat prod` for releases
- Keep UPX enabled for production builds
- Use `build.bat dev` during development
- Run `build.bat clean` before major releases
- Monitor bundle sizes with visualizer

### ❌ Don't

- Use debug builds for production
- Disable optimizations without reason
- Commit `bin/` directory to Git
- Skip UPX on Windows/Linux releases
- Build on macOS with UPX (codesigning)

---

## Troubleshooting

### Binary Too Large

1. Check production mode: `build.bat prod`
2. Verify UPX ran: Look for "Packed 1 file" in log
3. Check frontend bundle: `frontend/dist/stats.html`

### Build Slow

1. Use build cache (automatic)
2. Run `build.bat clean` if issues persist
3. Check for large dependencies

### UPX Not Found

Ensure `upx.exe` is in:
- Project root (`E:\tdt-clone\upx.exe`), OR
- `tdt-space-v3` directory, OR
- System PATH

---

## Related Documentation

- [Wails v3 Build System](https://v3alpha.wails.io/concepts/build-system/)
- [Build Customization](https://v3alpha.wails.io/guides/build/customization/)
- [Binary Compression](https://v3alpha.wails.io/concepts/build-system/#binary-compression)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)

---

## Quick Reference

```bash
# Production build (optimized)
.\build.bat prod

# Development mode (hot reload)
.\build.bat dev

# Clean build
.\build.bat clean && .\build.bat prod

# Build for specific platform
.\build.bat windows
.\build.bat linux
.\build.bat macos

# Build all platforms
.\build.bat all

# Show build info
.\build.bat info
```

**Output:** `bin/TDT Space.exe` (~3.6MB after UPX)
