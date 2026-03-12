# Fix App Crash/Freeze When Closing During Dev Mode

Khi bấm nút tắt app (close button) trong `wails dev`, app bị đơ/crash thay vì tắt sạch. Nguyên nhân nằm ở logic shutdown bị blocking và duplicate.

## Root Cause Analysis

Có **3 vấn đề chính**:

### 1. Duplicate [CleanupAllTerminals()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#347-362) gây blocking x2
- [OnBeforeClose()](file:///e:/tdt-clone/tdt-space-v3/app.go#77-85) gọi [CleanupAllTerminals()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#347-362) (line 80-82 trong [app.go](file:///e:/tdt-clone/tdt-space-v3/app.go))
- Sau đó [ServiceShutdown()](file:///e:/tdt-clone/tdt-space-v3/app.go#61-76) lại gọi [CleanupAllTerminals()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#347-362) lần nữa (line 66)
- Lần gọi thứ 2 đã không còn gì để dọn (vì lần 1 đã xóa hết), nhưng vẫn lock mutex → vô nghĩa

### 2. [killProcess()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#404-442) gọi `taskkill /f /t` đồng bộ (blocking)
- Mỗi terminal gọi [KillProcessTree()](file:///e:/tdt-clone/tdt-space-v3/internal/platform/platform.go#98-109) → chạy `taskkill.exe` synchronously via `cmd.Run()` 
- Windows `taskkill` có thể mất 1-3 giây per process
- Nếu có 4 terminals → blocking 4-12 giây
- ConPTY [Close()](file:///e:/tdt-clone/tdt-space-v3/internal/platform/pty_types.go#17-24) cũng có thể block nếu process chưa terminate

### 3. `batcher.stop()` cố flush event vào Wails runtime đang shutdown
- Khi [stop()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal_batching.go#267-285) được gọi, nó gọi [flushLocked()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal_batching.go#193-266) → cố emit `terminal-data` event
- Lúc này Wails runtime có thể đã bắt đầu shutdown → deadlock hoặc panic

## Proposed Changes

### App Lifecycle ([app.go](file:///e:/tdt-clone/tdt-space-v3/app.go))

#### [MODIFY] [app.go](file:///e:/tdt-clone/tdt-space-v3/app.go)

1. **Xóa [CleanupAllTerminals()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#347-362) khỏi [OnBeforeClose()](file:///e:/tdt-clone/tdt-space-v3/app.go#77-85)** — để [ServiceShutdown()](file:///e:/tdt-clone/tdt-space-v3/app.go#61-76) xử lý duy nhất
2. **Thêm `shutdownInProgress` flag** để batcher biết không cần flush event nữa

```diff
 func (a *App) OnBeforeClose() bool {
-    if a.terminalSvc != nil {
-        a.terminalSvc.CleanupAllTerminals()
-    }
     return false
 }
```

---

### Terminal Service ([internal/services/terminal.go](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go))

#### [MODIFY] [terminal.go](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go)

1. **Thêm `shuttingDown` flag** vào [TerminalService](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#39-50)
2. **[CleanupAllTerminals()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#347-362) set `shuttingDown = true`** trước khi kill
3. **[killProcess()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#404-442) khi shutdown: skip [KillProcessTree](file:///e:/tdt-clone/tdt-space-v3/internal/platform/platform.go#98-109) timeout, chỉ close ConPTY** — ConPTY [Close()](file:///e:/tdt-clone/tdt-space-v3/internal/platform/pty_types.go#17-24) tự kill process tree
4. **[killProcess()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal.go#404-442) dùng goroutine cho `taskkill`** — non-blocking, với overall timeout 5s

```diff
 type TerminalService struct {
     app              *application.App
     mu               sync.RWMutex
     processes        map[string]*ptyProcess
+    shuttingDown     bool
     ...
 }
```

```diff
 func (t *TerminalService) CleanupAllTerminals() CleanupResult {
+    t.mu.Lock()
+    t.shuttingDown = true
+    ids := make([]string, 0, len(t.processes))
+    for id := range t.processes {
+        ids = append(ids, id)
+    }
+    t.mu.Unlock()
+
+    // Kill all processes concurrently with overall timeout
+    var wg sync.WaitGroup
+    for _, id := range ids {
+        wg.Add(1)
+        go func(id string) {
+            defer wg.Done()
+            t.killProcess(id)
+        }(id)
+    }
+
+    // Wait with timeout
+    done := make(chan struct{})
+    go func() {
+        wg.Wait()
+        close(done)
+    }()
+    select {
+    case <-done:
+    case <-time.After(5 * time.Second):
+        log.Printf("[WARN] CleanupAllTerminals timed out after 5s")
+    }
+
     return CleanupResult{Success: true, Cleaned: ids}
 }
```

---

### Terminal Batcher ([internal/services/terminal_batching.go](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal_batching.go))

#### [MODIFY] [terminal_batching.go](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal_batching.go)

1. **[stop()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal_batching.go#267-285) skip [flushLocked()](file:///e:/tdt-clone/tdt-space-v3/internal/services/terminal_batching.go#193-266)** — khi shutdown không cần flush data nữa, tránh emit vào dead runtime

```diff
 func (b *terminalBatcher) stop() {
     b.mu.Lock()
     defer b.mu.Unlock()
     if b.timer != nil {
         b.timer.Stop()
         b.timer = nil
     }
-    b.flushLocked()
+    // Don't flush during shutdown - Wails runtime may already be shutting down
+    b.buf = b.buf[:0]
+    b.bufferedData = nil
+    b.bufferedSize = 0
     ...
 }
```

## Verification Plan

### Manual Verification
1. Chạy `wails dev` ở thư mục project
2. Mở app → tạo 1-2 workspace với vài terminal + agent  
3. Bấm nút close (X) trên title bar
4. **Expected**: App tắt sạch trong vòng 2-3 giây, không đơ
5. Check terminal console log — không có panic hay deadlock message
