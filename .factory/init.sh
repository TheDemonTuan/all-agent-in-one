#!/bin/bash
# TDT Space Optimization Mission - Init Script
# This script sets up the environment for the optimization mission

set -e

echo "🚀 TDT Space Optimization Mission - Setup"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Install testing dependencies
echo "📦 Installing testing dependencies..."
bun add -d vitest @playwright/test @testing-library/react jsdom @types/node

# Install xterm.js optimization addons
echo "📦 Installing xterm.js addons..."
bun add @xterm/addon-webgl

# Create test directories if they don't exist
echo "📁 Creating test directory structure..."
mkdir -p src/test
mkdir -p src/stores/__tests__
mkdir -p src/components/terminals/__tests__
mkdir -p src/electron/__tests__
mkdir -p tests/e2e
mkdir -p tests/performance

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
bunx playwright install --with-deps chromium

echo "✅ Setup complete! Ready to run optimization mission."
echo ""
echo "Available commands:"
echo "  bun run dev           - Start development server"
echo "  bun run test          - Run unit/component tests"
echo "  bun run test:coverage - Run tests with coverage"
echo "  bun run test:e2e      - Run E2E tests"
echo "  bun run lint          - Run linter"
echo "  bun run typecheck     - Run TypeScript type check"
