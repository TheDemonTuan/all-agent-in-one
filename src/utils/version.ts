// Get app version from package.json
// In Electron, we use ipcRenderer to get the version from main process
// In development/web mode, we read from package.json

let cachedVersion = '';

export async function getAppVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }

  let version: string;

  // Try to get version from Electron IPC first
  try {
    // Check for electronAPI exposed by preload script
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && electronAPI.getAppVersion) {
      version = await electronAPI.getAppVersion();
      cachedVersion = version;
      return version;
    }
  } catch {
    // Not in Electron environment
  }

  // Fallback to reading from package.json
  try {
    // Vite will replace this with the actual version at build time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pkg = require('../../package.json') as { version: string };
    version = pkg.version;
    cachedVersion = version;
    return version;
  } catch {
    // Last resort fallback
    version = '0.0.0';
    cachedVersion = version;
    return version;
  }

  // Should never reach here, but just in case
  return '0.0.0';
}
