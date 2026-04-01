# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Package Overview

This is **playwright-extra**, a plugin framework for Playwright that enables extending Playwright's functionality through a clean plugin interface. It's part of the zorilla monorepo and works alongside `@zorilla/puppeteer-extra`.

**Key Characteristics**:
- ESM-only (no CommonJS support)
- TypeScript with strict mode
- Compatible with Playwright 1.x
- Requires Node.js 20+
- Works with chromium, firefox, and webkit browsers

## Development Commands

```bash
# Build
pnpm build                    # Compile TypeScript to dist/

# Testing
pnpm test                     # Run all tests across all browser projects
pnpm test --project=chromium  # Run tests for chromium only
pnpm test test/exports.spec.ts  # Run specific test file
pnpm test:coverage            # Run tests with c8 coverage reporting

# Browser Installation (required for testing)
pnpm exec playwright install  # Install all browsers
pnpm exec playwright install chromium  # Install specific browser

# Linting
npx biome check .             # Check formatting and linting
npx biome check --write .     # Auto-fix formatting issues

# Clean
pnpm clean                    # Remove dist/ and coverage/
```

## Architecture

### Core Components

**src/index.ts** - Main entry point that exports:
- `chromium`, `firefox`, `webkit` - Augmented browser launchers (singleton instances)
- `addExtra()` - Factory function to create fresh instances with independent plugin registries
- Re-exports of vanilla Playwright APIs (`devices`, `errors`, `request`, etc.)

**src/extra.ts** - `PlaywrightExtraClass` implementation:
- Wraps Playwright browser launchers with plugin functionality
- Intercepts `launch()`, `connect()`, `launchPersistentContext()`, `connectOverCDP()`
- Dispatches plugin lifecycle events at appropriate moments
- Uses Proxy pattern to pass through non-augmented methods to original launcher

**src/plugins.ts** - `PluginList` class manages plugin registry:
- Validates and registers plugins via `add()`
- Resolves plugin dependencies (both `plugins` and `dependencies` stanza)
- Dispatches events to plugins via `dispatch()` (fire-and-forget) or `dispatchBlocking()` (waterfall)
- Orders plugins based on requirements (e.g., `runLast`)
- Handles data sharing between plugins via `getData()`

**src/puppeteer-compatiblity-shim/index.ts** - Puppeteer compatibility layer:
- Adds Puppeteer-style methods to Playwright objects via Proxy
- `_client()` - Returns CDP session client
- `evaluateOnNewDocument()` - Maps to Playwright's `addInitScript()`
- `browser()` - Returns browser from page context
- Enables PuppeteerExtraPlugin instances to work with Playwright

**src/helper/loader.ts** - Module loading utilities:
- `Loader` class handles requiring `playwright` or `playwright-core`
- `lazyloadExportOrDie()` creates Proxies for lazy-loaded exports
- Provides helpful error messages when playwright is not installed

**src/types/index.ts** - TypeScript type definitions:
- Plugin lifecycle method signatures
- Plugin interfaces (PuppeteerExtraPlugin, CompatiblePlugin)
- Type-safe plugin method dispatch

### Plugin Lifecycle Flow

1. **Registration**: `chromium.use(plugin)` → `plugins.add(plugin)`
   - Plugin validated (_isPuppeteerExtraPlugin check)
   - `onPluginRegistered` called with `{ framework: 'playwright' }`
   - Dependencies resolved recursively

2. **Launch**: `chromium.launch(options)`
   - `plugins.prepare()` - resolve dependencies, order plugins
   - `beforeLaunch(options)` - plugins modify launch options (waterfall)
   - Native `launcher.launch()` called
   - `onBrowser(browser)` - plugins receive browser instance
   - `_bindBrowserEvents()` - intercept `newContext()` for context events
   - `afterLaunch(browser)` - post-launch actions

3. **Context Creation**: `browser.newContext()`
   - `beforeContext(options)` - plugins modify context options
   - Native `newContext()` called
   - `onContextCreated(context)` - plugins receive context
   - Intercept `context.on('page')` for page creation events

4. **Page Creation**: `context.newPage()`
   - `onPageCreated(page)` - plugins receive page instance
   - Puppeteer compat shim applied if plugin needs it
   - Page `close` event bound to `onPageClose`

5. **Cleanup**: `browser.close()`
   - `onDisconnected(browser)` - cleanup actions

### Puppeteer Compatibility

**Why it exists**: Many valuable plugins were written for Puppeteer. Rather than rewrite them, playwright-extra adds a compatibility layer.

**How it works**:
- `addPuppeteerCompat()` wraps Playwright objects (Page, Browser) in Proxies
- Proxy intercepts property access and adds Puppeteer-style methods
- Only applied to specific lifecycle methods: `onBrowser`, `onPageCreated`, `afterLaunch`, `afterConnect`
- Plugins can opt-out with `noPuppeteerShim: true`

**Key mappings**:
- `page._client()` → CDP session via `context.newCDPSession(page)`
- `page.evaluateOnNewDocument()` → `page.addInitScript()`
- `page.browser()` → `page.context().browser()`
- `page.setUserAgent()` → CDP `Emulation.setUserAgentOverride`

## Testing Architecture

**Framework**: Uses `@playwright/test` (not Vitest like other packages)

**Configuration**: `test/playwright.config.ts`
- Tests run across 3 browser projects: chromium, firefox, webkit
- 3 retries, 3 workers
- CI-specific args for chromium (--no-sandbox)

**Fixtures**: `test/fixtures/extra.ts` provides custom fixtures:
- `playwrightExtra` - The playwright-extra module
- `playwrightVanilla` - Vanilla playwright-core module
- `extraLauncher` - Pre-configured launcher with test plugins
- Custom `browser` worker fixture that pre-registers plugins

**Test Structure**:
- `test/exports.spec.ts` - API surface validation
- `test/plugin-events.spec.ts` - Lifecycle event verification
- `test/puppeteer-plugins/*.spec.ts` - Plugin compatibility tests

**Coverage**: Uses c8 with Node's V8 coverage
- Configuration in `.c8rc.json`
- Covers `dist/**/*.js` (built output, not source)
- Run with `pnpm test:coverage`

## Key Patterns

### Adding a New Lifecycle Event

1. Add method signature to `PluginLifecycleMethods` in `src/types/index.ts`
2. Add method to `CompatiblePluginLifecycleMethods` with unknown args
3. Update `extra.ts` to call `plugins.dispatch()` or `dispatchBlocking()` at appropriate point
4. Add to puppeteer compat whitelist in `plugins.ts` if needed
5. Update test fixtures and add test coverage

### Plugin Dependency Resolution

Plugins can declare dependencies via `dependencies` property:
- **Set/Array**: `dependencies: new Set(['stealth/evasions/webgl.vendor'])`
- **Map**: `dependencies: new Map([['path', { options }]])`

Resolution process:
1. Check if already registered (skip if so)
2. Look in `_dependencyResolution` map (for bundler compatibility)
3. Try requiring with common prefixes (`puppeteer-extra-plugin-*`)
4. Try requiring path verbatim
5. Throw helpful error if not found

Users can pre-configure dependency options:
```typescript
chromium.plugins.setDependencyDefaults('stealth/evasions/webgl.vendor', {
  vendor: 'Custom',
  renderer: 'Custom'
})
```

### Multiple Instance Pattern

**Problem**: Node.js import caching returns same instance
**Solution**: Use `addExtra()` to create fresh instances

```typescript
import { addExtra } from 'playwright-extra'
import playwright from 'playwright'

const instance1 = addExtra(playwright.chromium)
const instance2 = addExtra(playwright.chromium)
// Separate plugin registries
```

## Build System

**Type**: ESM-only, TypeScript direct compilation (no bundler)
- `tsc` compiles `src/**/*.ts` → `dist/`
- Source maps and declaration maps enabled
- Module resolution: NodeNext (for proper ESM support)
- No separate CJS build (unlike puppeteer-extra package)

**Output Structure**:
```
dist/
├── index.js + .d.ts          # Main entry
├── extra.js + .d.ts          # Core class
├── plugins.js + .d.ts        # Plugin manager
├── helper/
│   └── loader.js + .d.ts
├── puppeteer-compatiblity-shim/
│   └── index.js + .d.ts
└── types/
    └── index.js + .d.ts
```

## Common Issues

**"Cannot find module 'playwright'"**: User hasn't installed playwright peer dependency. The loader will throw a helpful error message.

**"ReferenceError: require is not defined in ES module scope"**: A dependency is using CommonJS `require()` instead of ESM imports. Convert to:
```typescript
// Before:
var https = require('node:https');

// After:
import https from 'node:https';
```

**"Executable doesn't exist at .../pw_run.sh"**: Playwright browsers aren't installed. Run `pnpm exec playwright install`.

**Plugin not receiving events**: Check that:
- Plugin extends PuppeteerExtraPlugin or has `_isPuppeteerExtraPlugin: true`
- Plugin has `name` property
- Method is async if it needs to await
- Plugin is registered before `launch()`/`connect()`

**CDP methods failing**: Only work on Chromium-based browsers. Shim returns dummy CDP client for Firefox/WebKit to prevent crashes.

**launchPersistentContext not firing onDisconnected**: This is expected - context.close() fires instead of browser disconnect (no browser object exists).

**TypeScript error "Property 'method' does not exist on type 'UrlWithStringQuery'"**: `url.parse()` returns readonly object. Use spread to create mutable copy:
```typescript
// Before:
var options = url.parse(apiUrl);
options.method = 'POST';

// After:
var options = { ...url.parse(apiUrl), method: 'POST' };
```

## Workspace Dependencies

This package depends on sibling packages:
- `@zorilla/puppeteer-extra-plugin` - Plugin base class (must be built first)
- Test fixtures import plugins: `@zorilla/puppeteer-extra-plugin-stealth`, `@zorilla/puppeteer-extra-plugin-anonymize-ua`, `puppeteer-extra-plugin-recaptcha`

Build order matters in monorepo: plugin base → plugins → frameworks.

**Important**: When fixing ESM issues in dependencies (like the recaptcha plugin), rebuild that dependency before running tests:
```bash
cd ../puppeteer-extra-plugin-recaptcha && pnpm build
cd ../playwright-extra && pnpm test
```
