package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create app logic instance
	a := NewApp()

	// Create application with options
	app := application.New(application.Options{
		Name:        "TDT Space",
		Description: "Multi-Agent Terminal for TDT Vibe Coding",
		Services: []application.Service{
			application.NewService(a),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// Register events
	application.RegisterEvent[map[string]interface{}]("terminal-data")
	application.RegisterEvent[map[string]interface{}]("terminal-exit")
	application.RegisterEvent[map[string]interface{}]("terminal-error")
	application.RegisterEvent[map[string]interface{}]("terminal-started")

	// Create main window with DevTools enabled
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "TDT Space",
		Width:            1400,
		Height:           900,
		MinWidth:         800,
		MinHeight:        600,
		Frameless:        false,
		DisableResize:    false,
		AlwaysOnTop:      false,
		BackgroundColour: application.NewRGB(30, 30, 46), // #1e1e2e
		URL:              "/",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
	})

	// Store window reference in app for window controls
	a.SetWindow(window)

	// Run application
	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
