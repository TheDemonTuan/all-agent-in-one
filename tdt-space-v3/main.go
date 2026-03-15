package main

import (
	"embed"
	"runtime"

	"tdt-space/internal/services"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

// Version information - set via ldflags during build
// Example: -ldflags="-X main.version=0.1.2 -X main.buildTime=2026-03-12"
var (
	version   = "0.1.2-dev"
	buildTime = "unknown"
	gitCommit = "unknown"
)

func main() {
	// Determine frameless mode (Windows uses custom title bar)
	frameless := runtime.GOOS == "windows"

	// Build asset options - always embed assets for both dev and prod
	// Wails v3 handles dev/prod mode automatically
	assetOptions := application.AssetOptions{
		Handler: application.AssetFileServerFS(assets),
	}

	// Create the Wails application FIRST
	wailsApp := application.New(application.Options{
		Name:        "TDT Space",
		Description: "Multi-Agent Terminal for TDT Vibe Coding",
		Assets:      assetOptions,
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// Create services AFTER app is created (dependency injection pattern)
	storeSvc := services.NewStoreService()
	terminalSvc := services.NewTerminalService()
	workspaceSvc := services.NewWorkspaceService()
	templateSvc := services.NewTemplateService()
	terminalHistorySvc := services.NewTerminalHistoryService()
	systemSvc := services.NewSystemService()
	vietnameseIMESvc := services.NewVietnameseIMEService()

	// Wire dependencies - set application reference immediately
	terminalSvc.SetApplication(wailsApp)
	systemSvc.SetApplication(wailsApp)
	workspaceSvc.Init(storeSvc, terminalSvc)
	templateSvc.Init(storeSvc)
	terminalHistorySvc.Init(storeSvc)
	vietnameseIMESvc.Init(storeSvc)

	// Create App service with all dependencies
	app := NewApp(terminalSvc, storeSvc, systemSvc, workspaceSvc, templateSvc, terminalHistorySvc, vietnameseIMESvc)

	// Register all services with Wails
	wailsApp.RegisterService(application.NewService(app))
	wailsApp.RegisterService(application.NewService(terminalSvc))
	wailsApp.RegisterService(application.NewService(workspaceSvc))
	wailsApp.RegisterService(application.NewService(templateSvc))
	wailsApp.RegisterService(application.NewService(storeSvc))
	wailsApp.RegisterService(application.NewService(systemSvc))
	wailsApp.RegisterService(application.NewService(vietnameseIMESvc))
	wailsApp.RegisterService(application.NewService(terminalHistorySvc))

	// Create the main window
	window := wailsApp.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "TDT Space",
		Width:            1400,
		Height:           900,
		MinWidth:         800,
		MinHeight:        600,
		Frameless:        frameless,
		BackgroundColour: application.NewRGB(30, 30, 46),
		URL:              "/",
	})

	// Maximize window on startup
	window.Maximise()

	// Set up menu using the application's Menu manager
	wailsApp.Menu.SetApplicationMenu(buildMenu(app))

	// Run the application
	err := wailsApp.Run()
	if err != nil {
		println("Error:", err.Error())
	}
}
