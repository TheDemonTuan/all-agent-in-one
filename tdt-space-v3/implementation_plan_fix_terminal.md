# Fix: Workspace Only Shows 1 Terminal Instead of 4

## Problem

When creating a new workspace with a 2×2 grid (4 terminals), only 1 terminal is displayed. The issue persists after restarting the app because the data is persisted incorrectly.

## Root Cause: Go ↔ TypeScript Struct Mismatch

The Go backend [Workspace](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go#86-95) struct has a **different JSON shape** than the frontend [WorkspaceLayout](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go#80-84) interface. When the frontend sends workspace data to the backend, the mismatched field names cause data loss during JSON serialization/deserialization.

### Mismatch 1: Workspace layout fields

| Field | Frontend ([WorkspaceLayout](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go#80-84)) | Backend Go ([Workspace](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go#86-95)) |
|-------|-----|-----|
| columns | `columns` (top-level) | `layout.columns` (nested in [Layout](file:///e:/tdt-clone/tdt-space-v3/frontend/src/types/workspace.ts#39-40)) |
| rows | `rows` (top-level) | `layout.rows` (nested in [Layout](file:///e:/tdt-clone/tdt-space-v3/frontend/src/types/workspace.ts#39-40)) |
| lastUsed | `lastUsed` | ❌ missing |
| icon | `icon` | ❌ missing |
| cwd | ❌ not at workspace level | `cwd` (unused by frontend) |

**Impact**: When Go deserializes frontend JSON, `columns` and `rows` are at the top level but Go expects them inside `layout`. Go's `Layout.Rows` and `Layout.Columns` remain `0`, meaning `0×0 = 0` terminals in the grid.

### Mismatch 2: TerminalPane fields

| Field | Frontend ([TerminalPane](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go#68-78)) | Backend Go ([TerminalPane](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go#68-78)) |
|-------|-----|-----|
| agent | `agent: {type, enabled, ...}` (object) | ❌ missing, uses `agentType` (string) |
| shell | `shell` | ❌ missing |
| workspaceId | ❌ not present | `workspaceId` |
| command | ❌ not present | `command` |
| args | ❌ not present | `args` |

**Impact**: The `agent` config is lost during round-trip serialization, and `shell` info is dropped.

## Proposed Changes

### Backend Go Types

#### [MODIFY] [types.go](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go)

Align Go structs to match the frontend TypeScript interfaces:

```diff
 // TerminalPane matches src/types/workspace.ts
 type TerminalPane struct {
 	ID          string   `json:"id"`
-	WorkspaceID string   `json:"workspaceId"`
-	AgentType   string   `json:"agentType"`
 	CWD         string   `json:"cwd"`
 	Title       string   `json:"title,omitempty"`
-	Status      string   `json:"status"` // "idle" | "running" | "exited" | "error"
-	Command     string   `json:"command,omitempty"`
-	Args        []string `json:"args,omitempty"`
+	Shell       string   `json:"shell,omitempty"`
+	Status      string   `json:"status"` // "running" | "stopped" | "error"
+	Agent       *AgentAssignment `json:"agent,omitempty"`
+	ProcessId   int      `json:"processId,omitempty"`
 }

+// AgentAssignment matches src/types/workspace.ts AgentConfig
+type AgentAssignment struct {
+	Type    string `json:"type"`
+	Enabled bool   `json:"enabled"`
+	Command string `json:"command,omitempty"`
+	Args    []string `json:"args,omitempty"`
+	ApiKey  string `json:"apiKey,omitempty"`
+}

-// WorkspaceLayout matches the layout config
-type WorkspaceLayout struct {
-	Rows    int `json:"rows"`
-	Columns int `json:"columns"`
-}

 // Workspace matches src/types/workspace.ts
 type Workspace struct {
 	ID        string          `json:"id"`
 	Name      string          `json:"name"`
-	CWD       string          `json:"cwd"`
-	Layout    WorkspaceLayout `json:"layout"`
+	Columns   int             `json:"columns"`
+	Rows      int             `json:"rows"`
 	Terminals []TerminalPane  `json:"terminals"`
+	Icon      string          `json:"icon,omitempty"`
 	CreatedAt int64           `json:"createdAt"`
-	UpdatedAt int64           `json:"updatedAt"`
+	LastUsed  int64           `json:"lastUsed"`
 }
```

> [!IMPORTANT]
> The [Template](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go#101-109) struct also uses [WorkspaceLayout](file:///e:/tdt-clone/tdt-space-v3/internal/services/types.go#80-84) and should be updated similarly, but I'll keep it minimal for now and only change what's required to fix the workspace bug.

## Verification Plan

### Manual Verification

1. Build and run the app with `wails dev`
2. Create a new workspace with a 2×2 grid (4 terminals)
3. **Verify**: All 4 terminals should appear in a 2×2 grid layout
4. Close and reopen the app
5. **Verify**: The workspace still shows all 4 terminals in the correct layout
6. Create a workspace with a 3×1 grid (3 terminals)
7. **Verify**: All 3 terminals appear in a 3-column layout
