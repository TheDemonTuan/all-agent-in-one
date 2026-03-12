@echo off
REM Build script for TDT Space with optimal production flags (Wails v3)
REM Usage: build.bat [dev|prod|installer|all|windows|linux|macos|macos-arm|debug]

setlocal EnableDelayedExpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Add UPX to PATH if exists in project root
if exist "%SCRIPT_DIR%upx.exe" (
    set "PATH=%SCRIPT_DIR%;%PATH%"
    echo [✓] UPX found in project
)

REM Check UPX
where upx >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] UPX not found. Binary will not be compressed.
    set "USE_UPX=false"
) else (
    echo [✓] UPX available
    set "USE_UPX=true"
)

REM Check Go version and determine if obfuscation is supported
REM Obfuscation is not supported for Go 1.26+
set "OBFUSCATE_FLAG="
for /f "tokens=3" %%i in ('go version 2^>nul') do set "GOVERSION=%%i"
if defined GOVERSION (
    echo [i] Go version detected: !GOVERSION!
    REM Extract version number after "go1."
    set "GOVERNUM=!GOVERSION:go1=!"
    for /f "tokens=1 delims=." %%a in ("!GOVERNUM!") do set "GO_MINOR=%%a"
    if !GO_MINOR! GEQ 26 (
        echo [!] Go 1.26+ detected: obfuscation not supported
    )
) else (
    echo [!] Unable to detect Go version
)

REM Default build mode
set "MODE=%~1"
if "%~1"=="" set "MODE=prod"

echo =========================================
echo   TDT Space - Wails v3 Build
echo =========================================
echo.

if /i "%MODE%"=="dev" goto :dev
if /i "%MODE%"=="d" goto :dev
if /i "%MODE%"=="prod" goto :prod
if /i "%MODE%"=="p" goto :prod
if /i "%MODE%"=="production" goto :prod
if /i "%MODE%"=="installer" goto :installer
if /i "%MODE%"=="i" goto :installer
if /i "%MODE%"=="nsis" goto :installer
if /i "%MODE%"=="windows" goto :windows
if /i "%MODE%"=="win" goto :windows
if /i "%MODE%"=="w" goto :windows
if /i "%MODE%"=="linux" goto :linux
if /i "%MODE%"=="l" goto :linux
if /i "%MODE%"=="macos" goto :macos
if /i "%MODE%"=="mac" goto :macos
if /i "%MODE%"=="m" goto :macos
if /i "%MODE%"=="darwin" goto :macos
if /i "%MODE%"=="macos-arm" goto :macos-arm
if /i "%MODE%"=="mac-arm" goto :macos-arm
if /i "%MODE%"=="ma" goto :macos-arm
if /i "%MODE%"=="apple-silicon" goto :macos-arm
if /i "%MODE%"=="all" goto :all
if /i "%MODE%"=="a" goto :all
if /i "%MODE%"=="debug" goto :debug
goto :help

:dev
echo [^>] Running development server (Wails v3 dev mode)...
echo     Hot reload enabled, frontend on port 9245
echo.
cd tdt-space-v3
wails3 dev -config ./build/config.yml
cd ..
goto :end

:prod
echo [^>] Building for current platform with optimizations...
echo     Flags: -trimpath -ldflags="-s -w -buildmode=pie"
echo.
REM Optimized build flags:
REM   -s -w: Strip debug symbols (reduce size ~30%%)
REM   -trimpath: Remove file system paths (security + reproducibility)
REM   -buildmode=pie: Position-independent executable (security)
cd tdt-space-v3

REM Clean bin directory manually
if exist "bin" (
    echo [i] Cleaning bin directory...
    rmdir /s /q bin
)
mkdir bin

REM Build using wails3 task with production config
wails3 task windows:build DEV=false EXTRA_TAGS=production
if %ERRORLEVEL% NEQ 0 (
    echo [X] Build failed!
    cd ..
    goto :end
)

REM Run UPX compression if available
if "!USE_UPX!"=="true" (
    echo [i] Running UPX compression...
    if exist "bin\TDT-Space.exe" (
        ..\upx.exe --best "bin\TDT-Space.exe"
    )
)

cd ..
echo.
echo [✓] Build complete!
echo [i] Output:
dir /b tdt-space-v3\bin\
goto :end

:installer
echo [^>] Building with NSIS installer...
cd tdt-space-v3
wails3 task package
cd ..
echo.
echo [✓] Build complete with installer!
dir /b tdt-space-v3\bin\
goto :end

:windows
echo [^>] Building for Windows (amd64) with optimizations...
cd tdt-space-v3
if exist "bin" (
    rmdir /s /q bin
)
mkdir bin
wails3 task windows:build ARCH=amd64 EXTRA_TAGS=production
cd ..
echo [✓] Windows build complete!
dir /b tdt-space-v3\bin\
goto :end

:linux
echo [^>] Building for Linux (amd64) with optimizations...
echo [!] Note: Linux build may require Docker for cross-compilation
cd tdt-space-v3
if exist "bin" (
    rmdir /s /q bin
)
mkdir bin
wails3 task linux:build ARCH=amd64 EXTRA_TAGS=production
cd ..
echo [✓] Linux build complete!
dir /b tdt-space-v3\bin\
goto :end

:macos
echo [^>] Building for macOS Intel (amd64)...
cd tdt-space-v3
if exist "bin" (
    rmdir /s /q bin
)
mkdir bin
wails3 task darwin:build ARCH=amd64 EXTRA_TAGS=production
cd ..
echo [✓] macOS Intel build complete!
dir /b tdt-space-v3\bin\
goto :end

:macos-arm
echo [^>] Building for macOS Apple Silicon (arm64)...
cd tdt-space-v3
if exist "bin" (
    rmdir /s /q bin
)
mkdir bin
wails3 task darwin:build ARCH=arm64 EXTRA_TAGS=production
cd ..
echo [✓] macOS ARM build complete!
dir /b tdt-space-v3\bin\
goto :end

:all
echo [^>] Building for ALL platforms...
echo.

cd tdt-space-v3
if exist "bin" (
    rmdir /s /q bin
)
mkdir bin

echo [1/4] Building for Windows...
wails3 task windows:build ARCH=amd64 EXTRA_TAGS=production || echo [X] Windows build failed

echo.
echo [2/4] Building for Linux...
wails3 task linux:build ARCH=amd64 EXTRA_TAGS=production || echo [X] Linux build failed

echo.
echo [3/4] Building for macOS Intel...
wails3 task darwin:build ARCH=amd64 EXTRA_TAGS=production || echo [X] macOS Intel build failed

echo.
echo [4/4] Building for macOS ARM...
wails3 task darwin:build ARCH=arm64 EXTRA_TAGS=production || echo [X] macOS ARM build failed

cd ..
echo.
echo =========================================
echo   Multi-platform build complete!
echo =========================================
echo.
dir /b tdt-space-v3\bin\
goto :end

:debug
echo [^>] Building DEBUG mode (with devtools enabled)...
echo     Note: Debug builds are larger and slower
echo.
cd tdt-space-v3
if exist "bin" (
    rmdir /s /q bin
)
mkdir bin
wails3 task windows:build DEV=true
cd ..
goto :end

:help
echo Usage: build.bat [dev^|prod^|installer^|all^|windows^|linux^|macos^|macos-arm^|debug]
echo.
echo Commands:
echo   dev         - Run development server with hot reload
echo   prod        - Production build for current platform (default)
echo   installer   - Production build + NSIS installer
echo   all         - Build for ALL platforms (Windows, Linux, macOS)
echo   windows     - Build for Windows (amd64)
echo   linux       - Build for Linux (amd64)
echo   macos       - Build for macOS Intel (amd64)
echo   macos-arm   - Build for macOS Apple Silicon (arm64)
echo   debug       - Debug build with devtools
echo.
echo Build Optimizations:
echo   - UPX compression (if upx.exe present)
echo   - Symbol stripping (-s -w)
echo   - PIE mode for security
echo   - Static linking where possible
echo.
echo Examples:
echo   build.bat              - Build for current platform
echo   build.bat all          - Build for all platforms
echo   build.bat windows      - Build Windows executable
echo   build.bat linux        - Build Linux binary
echo.

:end
endlocal
