#!/bin/bash
# Build script for TDT Space - Wails v3 compatible
# Usage: ./build.sh [dev|prod|installer|all|windows|linux|macos|macos-arm|debug]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Add UPX to PATH if exists in project root
if [ -f "$SCRIPT_DIR/upx" ] || [ -f "$SCRIPT_DIR/upx.exe" ]; then
    export PATH="$SCRIPT_DIR:$PATH"
    UPX_AVAILABLE=true
else
    UPX_AVAILABLE=false
fi

# Default build mode
MODE="${1:-prod}"

# Navigate to tdt-space-v3 directory
cd "$SCRIPT_DIR/tdt-space-v3"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  TDT Space - Wails v3 Build${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

clean_bin() {
    if [ -d "bin" ]; then
        echo -e "${BLUE}[i]${NC} Cleaning bin directory..."
        rm -rf bin
    fi
    mkdir -p bin
}

run_upx() {
    local binary="$1"
    if [ "$UPX_AVAILABLE" = true ] && [ -f "$binary" ]; then
        echo -e "${BLUE}[i]${NC} Running UPX compression..."
        upx --best "$binary" 2>/dev/null || echo -e "${YELLOW}[!]${NC} UPX compression failed, skipping..."
    fi
}

case "$MODE" in
    dev|d)
        echo -e "${YELLOW}▶ Running development server (Wails v3 dev mode)...${NC}"
        echo -e "${BLUE}  Hot reload enabled, frontend on port 9245${NC}"
        echo ""
        wails3 dev -config ./build/config.yml
        ;;

    prod|p|production)
        echo -e "${YELLOW}▶ Building for current platform with optimizations...${NC}"
        echo -e "${BLUE}  Flags: -trimpath -ldflags=\"-s -w -buildmode=pie\"${NC}"
        echo ""
        clean_bin
        wails3 task windows:build DEV=false EXTRA_TAGS=production
        run_upx "bin/TDT-Space.exe"
        echo ""
        echo -e "${GREEN}✓ Build complete!${NC}"
        ls -lh bin/ 2>/dev/null || true
        ;;

    installer|i|nsis)
        echo -e "${YELLOW}▶ Building with NSIS installer...${NC}"
        echo ""
        wails3 task package
        echo ""
        echo -e "${GREEN}✓ Build complete with installer!${NC}"
        ls -lh bin/ 2>/dev/null || true
        ;;

    windows|win|w)
        echo -e "${YELLOW}▶ Building for Windows (amd64) with optimizations...${NC}"
        clean_bin
        wails3 task windows:build ARCH=amd64 EXTRA_TAGS=production
        run_upx "bin/TDT-Space.exe"
        echo -e "${GREEN}✓ Windows build complete!${NC}"
        ls -lh bin/*.exe 2>/dev/null || true
        ;;

    linux|l)
        echo -e "${YELLOW}▶ Building for Linux (amd64) with optimizations...${NC}"
        echo -e "${YELLOW}  Note: Linux build may require Docker for cross-compilation${NC}"
        clean_bin
        wails3 task linux:build ARCH=amd64 EXTRA_TAGS=production
        run_upx "bin/TDT-Space"
        echo -e "${GREEN}✓ Linux build complete!${NC}"
        ls -lh bin/TDT-Space 2>/dev/null || true
        ;;

    macos|mac|m|darwin)
        echo -e "${YELLOW}▶ Building for macOS Intel (amd64)...${NC}"
        clean_bin
        wails3 task darwin:build ARCH=amd64 EXTRA_TAGS=production
        # Note: UPX not recommended for macOS due to codesigning
        echo -e "${GREEN}✓ macOS Intel build complete!${NC}"
        ls -lh bin/ 2>/dev/null || true
        ;;

    macos-arm|mac-arm|ma|apple-silicon)
        echo -e "${YELLOW}▶ Building for macOS Apple Silicon (arm64)...${NC}"
        clean_bin
        wails3 task darwin:build ARCH=arm64 EXTRA_TAGS=production
        # Note: UPX not recommended for macOS due to codesigning
        echo -e "${GREEN}✓ macOS ARM build complete!${NC}"
        ls -lh bin/ 2>/dev/null || true
        ;;

    all|a)
        echo -e "${YELLOW}▶ Building for ALL platforms...${NC}"
        echo ""

        clean_bin

        echo -e "${BLUE}[1/4] Building for Windows...${NC}"
        wails3 task windows:build ARCH=amd64 EXTRA_TAGS=production || echo -e "${RED}✗ Windows build failed${NC}"

        echo ""
        echo -e "${BLUE}[2/4] Building for Linux...${NC}"
        wails3 task linux:build ARCH=amd64 EXTRA_TAGS=production || echo -e "${RED}✗ Linux build failed${NC}"

        echo ""
        echo -e "${BLUE}[3/4] Building for macOS Intel...${NC}"
        wails3 task darwin:build ARCH=amd64 EXTRA_TAGS=production || echo -e "${RED}✗ macOS Intel build failed${NC}"

        echo ""
        echo -e "${BLUE}[4/4] Building for macOS ARM...${NC}"
        wails3 task darwin:build ARCH=arm64 EXTRA_TAGS=production || echo -e "${RED}✗ macOS ARM build failed${NC}"

        echo ""
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}  Multi-platform build complete!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo ""
        ls -lh bin/ 2>/dev/null || true
        ;;

    debug)
        echo -e "${YELLOW}▶ Building DEBUG mode (with devtools enabled)...${NC}"
        echo -e "${YELLOW}  Note: Debug builds are larger and slower${NC}"
        echo ""
        clean_bin
        wails3 task windows:build DEV=true
        ;;

    *)
        echo "Usage: ./build.sh [dev|prod|installer|all|windows|linux|macos|macos-arm|debug]"
        echo ""
        echo "Commands:"
        echo "  dev         - Run development server with hot reload"
        echo "  prod        - Production build for current platform (default)"
        echo "  installer   - Production build + NSIS installer"
        echo "  all         - Build for ALL platforms (Windows, Linux, macOS)"
        echo "  windows     - Build for Windows (amd64)"
        echo "  linux       - Build for Linux (amd64)"
        echo "  macos       - Build for macOS Intel (amd64)"
        echo "  macos-arm   - Build for macOS Apple Silicon (arm64)"
        echo "  debug       - Debug build with devtools"
        echo ""
        echo "Build Optimizations:"
        echo "  - UPX compression (if upx available)"
        echo "  - Symbol stripping (-s -w)"
        echo "  - PIE mode for security"
        echo "  - Static linking where possible"
        echo ""
        echo "Examples:"
        echo "  ./build.sh              # Build for current platform"
        echo "  ./build.sh all          # Build for all platforms"
        echo "  ./build.sh windows      # Build Windows executable"
        echo "  ./build.sh linux        # Build Linux binary"
        exit 1
        ;;
esac

# Return to script directory
cd "$SCRIPT_DIR"
