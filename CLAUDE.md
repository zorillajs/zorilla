# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is **zorilla**, a maintained fork of puppeteer-extra - a modular plugin framework that extends Puppeteer and Playwright with additional functionality through a clean plugin system. The project consists of two main frameworks (`@zorilla/puppeteer-extra` and `@zorilla/playwright-extra`) and a collection of plugins that work with both.

### Key Architecture Concepts

**Plugin System Architecture:**
- Plugins extend `PuppeteerExtraPlugin` base class from `packages/puppeteer-extra-plugin`
- Plugins are framework-agnostic and work with both Puppeteer and Playwright through a compatibility shim
- Plugins hook into lifecycle events: `beforeLaunch`, `beforeConnect`, `onBrowser`, `onPageCreated`, `onContextCreated`, etc.
- Plugins can declare requirements (`headful`, `runLast`, `dataFromPlugins`) and dependencies on other plugins
- Plugin options are deep-merged with defaults and accessible via `this.opts`

**Puppeteer vs Playwright:**
- `packages/puppeteer-extra`: Wraps Puppeteer API, supports `puppeteer` and `puppeteer-core`
- `packages/playwright-extra`: Wraps Playwright API, supports all browsers (chromium, firefox, webkit)
- Both use the same plugin base class with a compatibility shim in `packages/playwright-extra/src/puppeteer-compatiblity-shim`
- Playwright-extra uses `addExtra()` internally to create separate instances per browser type

**Dual Export Pattern:**
- Default export: Drop-in replacement that auto-requires installed puppeteer/playwright
- `addExtra()` export: Allows creating custom instances with different plugins or wrapping alternative implementations

## Development Commands

### Building
```bash
pnpm install                           # Install all dependencies
pnpm build                             # Build all packages in sequence
cd packages/<package-name> && pnpm build  # Build single package
```

### Testing
```bash
pnpm test                              # Run all tests across all packages
pnpm -r run test:coverage             # Run tests with coverage for all packages
cd packages/<package-name> && pnpm test           # Test single package
cd packages/<package-name> && pnpm test:coverage  # Test with coverage
```

**Testing Notes:**
- Most packages use Vitest with v8 coverage provider
- `playwright-extra` uses `@playwright/test` with c8 for coverage
- Stealth plugin tests run with `--pool.threads.maxThreads=2` to avoid race conditions
- Coverage reports are generated in `coverage/` directories (gitignored)

### Linting & Formatting
```bash
pnpm check                             # Check code with Biome (no changes)
pnpm fix                               # Auto-fix issues with Biome
```

Uses Biome (not ESLint/Prettier) for linting and formatting.

### Publishing
```bash
pnpm changeset                         # Create a changeset for your changes
pnpm version                           # Version packages and update changelogs
pnpm release                           # Build and publish to npm
```

Uses Changesets for version management. Lerna is no longer used.

## Monorepo Structure

**Package Categories:**
1. **Core Frameworks:** `puppeteer-extra`, `playwright-extra`
2. **Plugin Base:** `puppeteer-extra-plugin` (used by all plugins)
3. **Plugins:** All packages prefixed with `puppeteer-extra-plugin-*`
4. **Utilities:** `plugin-proxy-router`, `extract-stealth-evasions`

**Important Plugin Packages:**
- `puppeteer-extra-plugin-stealth`: Complex evasion system with sub-evasions in `src/evasions/`
- `puppeteer-extra-plugin-recaptcha`: Integrates with captcha solving services
- `puppeteer-extra-plugin-adblocker`: Uses `@cliqz/adblocker-puppeteer`

## Plugin Development

### Creating a New Plugin

1. Extend `PuppeteerExtraPlugin` from `@zorilla/puppeteer-extra-plugin`
2. Implement required getter `name` (convention: matches package name without prefix)
3. Optional: Implement `defaults` getter for default options
4. Optional: Implement lifecycle hooks (`onPageCreated`, `beforeLaunch`, etc.)
5. Export a factory function that returns a new plugin instance

```typescript
import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin'

class MyPlugin extends PuppeteerExtraPlugin {
  get name() { return 'my-plugin' }

  get defaults() { return { option: 'default' } }

  async onPageCreated(page) {
    // Plugin logic using this.opts
  }
}

export default (opts) => new MyPlugin(opts)
```

### Plugin Lifecycle Events

**Browser Lifecycle:**
- `beforeLaunch(options)` / `beforeConnect(options)` - Modify launch/connect options
- `afterLaunch(browser, options)` / `afterConnect(browser, options)` - Post-launch actions
- `onBrowser(browser, options)` - Called for any browser acquisition
- `onDisconnected()` - Browser disconnected

**Page Lifecycle:**
- `beforeContext(options)` - Before context creation (Playwright)
- `onContextCreated(context)` - Context created (Playwright)
- `onPageCreated(page)` - New page created
- `onTargetCreated(target)` - New target created

### Debugging Plugins

```bash
DEBUG=puppeteer-extra*,puppeteer-extra-plugin:* node script.js
DEBUG=playwright-extra*,puppeteer-extra-plugin:* node script.js
```

Use `this.debug('message', data)` in plugins - automatically namespaced to plugin name.

## TypeScript Configuration

- Root `tsconfig.json` defines shared compiler options
- Each package has its own `tsconfig.json` that extends or customizes settings
- Module system: ES2022 with `moduleResolution: "bundler"`
- Strict mode enabled with additional type checking flags
- Output includes declarations and source maps

### TypeScript Best Practices

**Avoid `any` Types:**
- **Never** use `any` types unless absolutely necessary (extremely rare edge cases)
- Using `any` defeats the purpose of TypeScript and eliminates type safety
- Instead of `any`, use:
  - `unknown` - when you truly don't know the type (requires type narrowing before use)
  - `Record<string, unknown>` - for objects with unknown structure
  - Proper type imports from `@zorilla/puppeteer-extra-plugin/dist/puppeteer` (e.g., `LaunchOptions`, `ConnectOptions`, `Page`, `Browser`)
  - Generic types - when writing reusable code
  - Type assertions (`as Type`) - only when you have more information than TypeScript
  - Double assertion (`as unknown as Type`) - only for known-safe type conversions between incompatible interfaces

**Examples:**

```typescript
// ❌ BAD - Using any
async beforeLaunch(options: any): Promise<void> {
  // Type safety lost
}

// ✅ GOOD - Proper type imports
import type { LaunchOptions, Page } from '@zorilla/puppeteer-extra-plugin/dist/puppeteer'

async beforeLaunch(options: LaunchOptions): Promise<void> {
  // Type safe
}

async onPageCreated(page: Page): Promise<void> {
  // Type safe
}

// ❌ BAD - any for complex types
const modules: Record<string, any> = { ... }

// ✅ GOOD - Proper type definition with explanation
type EvasionFactory = (opts?: unknown) => PuppeteerExtraPlugin;
const modules: Record<string, EvasionFactory> = {
  'foo': fooPlugin as unknown as EvasionFactory, // Type assertion needed due to implementation variance
}
```

**When Type Assertions Are Acceptable:**
- When interfacing with dynamic imports that return plugins with slightly different implementations
- When working with third-party libraries that have incomplete type definitions
- Always add a comment explaining why the assertion is necessary

## Build System

**ESM-Only Project:**
- This project exclusively uses ES Modules (ESM) - CommonJS (CJS) is NOT supported
- All packages have `"type": "module"` in their package.json
- TypeScript compilation outputs to `dist/` directory
- Module system: ES2022 with `moduleResolution: "bundler"`
- All imports/exports use ESM syntax (import/export, not require/module.exports)

**Stealth Plugin Structure:**
- Main plugin in `src/index.ts`
- Individual evasions in `src/evasions/*/index.ts`
- Each evasion is a mini-plugin with its own package.json
- Evasions are exported via `./evasions/*` in package.json exports

## Working with Stealth Evasions

The stealth plugin contains multiple evasion techniques in `packages/puppeteer-extra-plugin-stealth/src/evasions/`. Each evasion:
- Has its own directory with `index.ts`, tests, and package.json
- Extends `PuppeteerExtraPlugin`
- Can be used independently or as part of the stealth plugin suite
- Common patterns: modify navigator properties, mock chrome APIs, override CDP methods

To add a new evasion, copy the `_template` directory and implement the specific technique.

## Testing Patterns

**Vitest packages:**
- Tests in `test/` or co-located `*.test.ts` files
- Configuration in `vitest.config.ts` with coverage settings
- Use `describe`, `test`, `expect` from vitest

**Playwright-extra:**
- Uses `@playwright/test` framework
- Configuration in `test/playwright.config.ts`
- Tests multiple browser types (chromium, firefox, webkit)
- Custom fixtures in `test/fixtures/extra.ts` provide pre-configured instances

## Common Patterns

**addExtra Pattern:**
Both frameworks use this to wrap vanilla implementations:
```typescript
import { addExtra } from '@zorilla/puppeteer-extra'
import vanilla from 'puppeteer'
const puppeteer = addExtra(vanilla)
puppeteer.use(plugin)
```

**Plugin Registration:**
```typescript
import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())
```

**Multiple Instances:**
Useful for different plugin configurations or testing:
```typescript
const pptr1 = addExtra(vanilla)
const pptr2 = addExtra(vanilla)
pptr1.use(pluginA)
pptr2.use(pluginB)
```

## Package Scoping

All packages are published under `@zorilla` scope. Internal cross-references use this scope name.
