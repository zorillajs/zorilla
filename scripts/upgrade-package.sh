#!/bin/bash
set -e

# Zorilla Package Upgrade Script
# Usage: ./scripts/upgrade-package.sh <package-directory>
# Example: ./scripts/upgrade-package.sh packages/puppeteer-extra-plugin

if [ -z "$1" ]; then
  echo "Usage: $0 <package-directory>"
  echo "Example: $0 packages/puppeteer-extra-plugin"
  exit 1
fi

PACKAGE_DIR="$1"
PACKAGE_NAME=$(node -p "require('./$PACKAGE_DIR/package.json').name")

echo "=================================================="
echo "🦡 Upgrading $PACKAGE_NAME"
echo "=================================================="

cd "$PACKAGE_DIR"

echo ""
echo "📦 Step 1: Cleaning old artifacts..."
rm -rf dist node_modules pnpm-lock.yaml
pnpm store prune || true

echo ""
echo "📦 Step 2: Updating dependencies to latest..."
# Update TypeScript if present
if grep -q '"typescript"' package.json; then
  echo "  - Updating TypeScript to latest..."
  pnpm add -D typescript@latest
fi

# Update common dev dependencies
if grep -q '"vitest"' package.json; then
  echo "  - Updating Vitest..."
  pnpm add -D vitest@latest @vitest/coverage-v8@latest
fi

if grep -q '"@types/node"' package.json; then
  echo "  - Updating @types/node..."
  pnpm add -D "@types/node@latest"
fi

if grep -q '"rollup"' package.json; then
  echo "  - Updating Rollup (if used)..."
  pnpm add -D rollup@latest
fi

# Update puppeteer if in devDependencies
if grep -q '"puppeteer"' package.json; then
  echo "  - Updating Puppeteer..."
  pnpm add -D puppeteer@latest
fi

# Update playwright if in devDependencies
if grep -q '"playwright"' package.json; then
  echo "  - Updating Playwright..."
  pnpm add -D playwright@latest
fi

if grep -q '"@playwright/test"' package.json; then
  echo "  - Updating @playwright/test..."
  pnpm add -D "@playwright/test@latest"
fi

echo ""
echo "📦 Step 3: Updating production dependencies..."
pnpm update

echo ""
echo "📦 Step 4: Fixing package.json issues..."
# Remove gitHead field
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.gitHead;
// Fix peerDependenciesMeta to use new package names
if (pkg.peerDependenciesMeta) {
  const meta = pkg.peerDependenciesMeta;
  if (meta['puppeteer-extra']) {
    meta['@zorilla/puppeteer-extra'] = meta['puppeteer-extra'];
    delete meta['puppeteer-extra'];
  }
  if (meta['playwright-extra']) {
    meta['@zorilla/playwright-extra'] = meta['playwright-extra'];
    delete meta['playwright-extra'];
  }
}
// Add test:coverage script if missing
if (!pkg.scripts['test:coverage']) {
  pkg.scripts['test:coverage'] = 'vitest run --coverage';
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo ""
echo "🔨 Step 5: Installing dependencies..."
pnpm install

echo ""
echo "🔨 Step 6: Building package..."
if pnpm run build; then
  echo "  ✅ Build successful!"
else
  echo "  ❌ Build failed! Please fix build errors manually."
  exit 1
fi

echo ""
echo "🧪 Step 7: Running tests..."
if pnpm test run; then
  echo "  ✅ Tests passed!"
else
  echo "  ⚠️  Tests failed! Please fix test failures manually."
fi

echo ""
echo "📊 Step 8: Checking test coverage..."
pnpm run test:coverage || echo "  ⚠️  Coverage check needs attention"

echo ""
echo "🎨 Step 9: Running linter..."
cd ../..
pnpm fix || echo "  ⚠️  Linting issues need attention"
cd "$PACKAGE_DIR"

echo ""
echo "=================================================="
echo "✅ Automated steps complete for $PACKAGE_NAME"
echo "=================================================="
echo ""
echo "📋 Manual steps remaining:"
echo "  1. Review and fix any TypeScript 'any' types in src/"
echo "  2. Add missing tests to reach 100% coverage"
echo "  3. Update README.md with @zorilla branding"
echo "  4. Create CLAUDE.md by running: /init"
echo ""
