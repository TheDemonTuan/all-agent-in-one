# Wails v2 → v3 Migration (Init-based approach)

## Phase 0: Scaffold New v3 Project
- [ ] Install Wails v3 CLI (`go install github.com/wailsapp/wails/v3/cmd/wails3@latest`)
- [ ] Run `wails3 init -n tdt-space-v3 -t react` to create fresh v3 project
- [ ] Study generated project structure (main.go, Taskfile.yml, build/, frontend/)

## Phase 1: Migrate Backend Go Code
- [ ] Copy and adapt `internal/` directory (services, platform code) — update imports to v3
- [ ] Migrate [app.go](file:///E:/tdt-clone/app.go) → v3 Service pattern (`ServiceStartup`/`ServiceShutdown`)
- [ ] Rewrite [main.go](file:///E:/tdt-clone/main.go) using v3 scaffold as base + register existing services
- [ ] Update event emissions: `wailsruntime.EventsEmit(ctx,...)` → `app.Event.Emit(...)`
- [ ] Update dialog APIs in [system.go](file:///E:/tdt-clone/internal/services/system.go) to v3 equivalents
- [ ] Run `go mod tidy` and verify compilation

## Phase 2: Migrate Frontend
- [ ] Move `src/` into new project's frontend structure
- [ ] Install `@wailsio/runtime` and existing dependencies
- [ ] Update [wails-bridge.ts](file:///E:/tdt-clone/src/services/wails-bridge.ts) — use v3 runtime APIs (`Events.On`, `Events.Emit`, etc.)
- [ ] Update type declarations and remove v2 globals (`window.go.*`, `window.runtime.*`)
- [ ] Generate v3 bindings and integrate

## Phase 3: Build System & Config
- [ ] Customize `Taskfile.yml` for TDT Space (app name, custom build flags)
- [ ] Migrate [build.bat](file:///E:/tdt-clone/build.bat) script to use `wails3` commands
- [ ] Update [package.json](file:///E:/tdt-clone/package.json) scripts
- [ ] Migrate [vite.config.ts](file:///E:/tdt-clone/vite.config.ts) settings if needed

## Phase 4: Finalize & Verify
- [ ] Copy remaining assets (appicon, etc.)
- [ ] Replace original project with migrated project
- [ ] Compile backend (`go build`)
- [ ] Frontend builds (`bun run build`)
- [ ] `wails3 dev` starts without errors
- [ ] Manual testing
