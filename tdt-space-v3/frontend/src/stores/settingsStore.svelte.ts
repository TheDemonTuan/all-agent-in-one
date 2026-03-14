import { backendAPI } from '../services/wails-bridge';

export interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  cursorBlink: boolean;
  scrollback: number;
  showCommandBlocks: boolean;
  theme: 'dark' | 'light' | 'system';
}

export interface VietnameseImeSettings {
  enabled: boolean;
  autoPatch: boolean;
  lastPatchStatus?: 'success' | 'failed' | 'pending';
  lastPatchPath?: string;
  patchedVersion?: string;
}

const DEFAULT_SETTINGS: TerminalSettings = {
  fontSize: 14,
  fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
  cursorBlink: true,
  scrollback: 300, // Updated for Option C: Balanced performance optimization
  showCommandBlocks: true,
  theme: 'dark',
};

const DEFAULT_VN_IME_SETTINGS: VietnameseImeSettings = {
  enabled: false,
  autoPatch: true,
};

const SETTINGS_STORAGE_KEY = 'terminal-settings';
const VN_IME_SETTINGS_KEY = 'vietnamese-ime-settings';

class SettingsStore {
  // State with runes
  settings = $state<TerminalSettings>(DEFAULT_SETTINGS);
  vietnameseIme = $state<VietnameseImeSettings>(DEFAULT_VN_IME_SETTINGS);
  isLoading = $state(false);

  constructor() {
    // Auto-load on init
    this.loadSettings();
    this.loadVietnameseImeSettings();
  }

  async loadSettings(): Promise<void> {
    this.isLoading = true;
    try {
      const stored = await backendAPI.getStoreValue(SETTINGS_STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...stored };
      }
    } catch (err) {
      console.error('[SettingsStore] Failed to load settings:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await backendAPI.setStoreValue(SETTINGS_STORAGE_KEY, this.settings);
    } catch (err) {
      console.error('[SettingsStore] Failed to save settings:', err);
    }
  }

  updateSettings(updates: Partial<TerminalSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }

  resetSettings(): void {
    this.settings = DEFAULT_SETTINGS;
  }

  async loadVietnameseImeSettings(): Promise<void> {
    try {
      const stored = await backendAPI.getStoreValue(VN_IME_SETTINGS_KEY);
      if (stored) {
        this.vietnameseIme = { ...DEFAULT_VN_IME_SETTINGS, ...stored };
      }
    } catch (err) {
      console.error('[SettingsStore] Failed to load VN IME settings:', err);
    }
  }

  async saveVietnameseImeSettings(): Promise<void> {
    try {
      await backendAPI.setStoreValue(VN_IME_SETTINGS_KEY, this.vietnameseIme);
    } catch (err) {
      console.error('[SettingsStore] Failed to save VN IME settings:', err);
    }
  }

  updateVietnameseImeSettings(updates: Partial<VietnameseImeSettings>): void {
    this.vietnameseIme = { ...this.vietnameseIme, ...updates };
  }
}

// Export singleton instance
export const settingsStore = new SettingsStore();
export default settingsStore;
