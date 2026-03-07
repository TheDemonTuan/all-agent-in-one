/**
 * Unit tests for Vietnamese IME patch version comparison functions
 * 
 * Run with: bun test src/utils/vietnameseImePatch.test.ts
 */

import { describe, it, expect } from 'bun:test';
import { compareVersions, isVersionMismatched, extractClaudeVersion } from './vietnameseImePatch';

describe('compareVersions', () => {
  it('returns 0 for identical versions', () => {
    expect(compareVersions('2.1.70', '2.1.70')).toBe(0);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('3.5.2', '3.5.2')).toBe(0);
  });

  it('returns 1 when v1 > v2', () => {
    expect(compareVersions('2.1.71', '2.1.70')).toBe(1);
    expect(compareVersions('2.2.0', '2.1.99')).toBe(1);
    expect(compareVersions('3.0.0', '2.9.9')).toBe(1);
    expect(compareVersions('2.1.70', '2.1.69')).toBe(1);
  });

  it('returns -1 when v1 < v2', () => {
    expect(compareVersions('2.1.70', '2.1.71')).toBe(-1);
    expect(compareVersions('2.1.99', '2.2.0')).toBe(-1);
    expect(compareVersions('2.9.9', '3.0.0')).toBe(-1);
    expect(compareVersions('2.1.69', '2.1.70')).toBe(-1);
  });

  it('handles versions with different lengths', () => {
    expect(compareVersions('2.1', '2.1.0')).toBe(0);
    expect(compareVersions('2.1.0', '2.1')).toBe(0);
    expect(compareVersions('2.1.1', '2.1')).toBe(1);
    expect(compareVersions('2.1', '2.1.1')).toBe(-1);
  });

  it('handles major version differences', () => {
    expect(compareVersions('3.0.0', '2.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
  });
});

describe('isVersionMismatched', () => {
  it('returns false when both versions are identical', () => {
    expect(isVersionMismatched('2.1.70', '2.1.70')).toBe(false);
    expect(isVersionMismatched('2.1.69', '2.1.69')).toBe(false);
  });

  it('returns true when versions are different', () => {
    expect(isVersionMismatched('2.1.71', '2.1.70')).toBe(true);
    expect(isVersionMismatched('2.1.70', '2.1.71')).toBe(true);
    expect(isVersionMismatched('2.2.0', '2.1.70')).toBe(true);
    expect(isVersionMismatched('3.0.0', '2.1.70')).toBe(true);
  });

  it('returns false when patchedVersion is undefined', () => {
    expect(isVersionMismatched('2.1.70', undefined)).toBe(false);
    expect(isVersionMismatched('2.1.71', undefined)).toBe(false);
  });

  it('returns false when patchedVersion is null', () => {
    expect(isVersionMismatched('2.1.70', null)).toBe(false);
    expect(isVersionMismatched('2.1.71', null)).toBe(false);
  });

  it('returns false when currentVersion is null (Claude Code not installed) and patchedVersion exists', () => {
    // This simulates Claude Code not being installed
    expect(isVersionMismatched(null, '2.1.70')).toBe(false);
  });

  it('auto-detects version when currentVersion is undefined', () => {
    // When undefined, it should auto-detect from file system
    // This may return true or false depending on installed version
    const result = isVersionMismatched(undefined, '2.1.70');
    // We just verify it doesn't throw - actual value depends on system state
    expect(typeof result).toBe('boolean');
  });

  it('returns false when both versions are undefined/null', () => {
    expect(isVersionMismatched(undefined, undefined)).toBe(false);
    expect(isVersionMismatched(null, null)).toBe(false);
    expect(isVersionMismatched()).toBe(false);
  });

  it('detects minor version changes', () => {
    expect(isVersionMismatched('2.1.70', '2.1.69')).toBe(true);
    expect(isVersionMismatched('2.1.69', '2.1.70')).toBe(true);
  });

  it('detects patch version changes', () => {
    expect(isVersionMismatched('2.1.1', '2.1.0')).toBe(true);
    expect(isVersionMismatched('2.0.5', '2.0.4')).toBe(true);
  });
});

describe('extractClaudeVersion', () => {
  it('extracts version from standard format', () => {
    const content1 = `
      const config = {
        "version": "2.1.70",
        "name": "claude-code"
      };
    `;
    expect(extractClaudeVersion(content1)).toBe('2.1.70');
  });

  it('extracts version from equals format', () => {
    const content2 = `
      version = "2.1.69";
      const name = "test";
    `;
    expect(extractClaudeVersion(content2)).toBe('2.1.69');
  });

  it('returns null when version not found', () => {
    const content3 = 'const config = { name: "test" };';
    expect(extractClaudeVersion(content3)).toBe(null);
  });

  it('returns null for empty content', () => {
    expect(extractClaudeVersion('')).toBe(null);
  });
});
