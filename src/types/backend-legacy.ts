/**
 * Legacy type definitions for backward compatibility.
 * @deprecated Use types from './backend' or BackendAPI from 'services/wails-bridge' instead.
 */

import type { BackendAPI } from '../services/wails-bridge';

export type {
  VietnameseImePatchResult,
  VietnameseImeStatus,
  VietnameseImeSettings,
  PatchValidation,
  PatchLog,
  OpenDialogOptions,
  OpenDialogReturnValue,
} from './backend';

/** @deprecated Use BackendAPI from 'services/wails-bridge' instead */
export type ElectronAPI = BackendAPI;

declare global {
  interface Window {
    /** @deprecated Use window.go.main.App or backendAPI from 'services/wails-bridge' instead */
    electronAPI?: BackendAPI;
  }
}

export {};
