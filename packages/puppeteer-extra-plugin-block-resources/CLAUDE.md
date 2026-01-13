# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

This is `puppeteer-extra-plugin-block-resources`, a plugin for the puppeteer-extra ecosystem that blocks HTTP resources (images, stylesheets, fonts, etc.) during page navigation. It's part of the Zorilla monorepo.

## Development Commands

### Building
```bash
pnpm build              # Compile TypeScript to dist/
```

### Testing
```bash
pnpm test               # Run tests in watch mode (vitest)
pnpm test:coverage      # Run tests with coverage report (100% required)
```

### Linting
```bash
# From repo root:
pnpm check              # Check with Biome (read-only)
pnpm fix                # Auto-fix with Biome
```

## Architecture

### Plugin Pattern
This plugin extends `PuppeteerExtraPlugin` from `puppeteer-extra-plugin`. The plugin:
1. Registers lifecycle hooks with puppeteer-extra
2. Intercepts the `onPageCreated` event to enable request interception
3. Handles each request via `onRequest` method to block/allow based on resource type

### Key Implementation Details

**Request Interception Logic** (src/index.ts:149-191)
- Uses `page.setRequestInterception(true)` on page creation
- Checks if request is already handled (for Cooperative Intercept Mode compatibility)
- Blocks or continues requests based on `blockedTypes` Set
- Supports both standard and Cooperative Intercept Mode (Puppeteer v15+)

**Cooperative Intercept Mode Support**
The plugin detects and uses Cooperative Intercept Mode when:
- `interceptResolutionPriority` is set in options
- Request has `abortErrorReason` or `continueRequestOverrides` properties
- This allows multiple plugins to intercept requests without conflicts

**Type Safety for Cross-Version Compatibility**
- `HTTPRequestWithCooperativeMode`: Type intersection to check for Cooperative Mode features
- `MinimalPage`: Interface with only required page methods to avoid puppeteer version conflicts
- Uses `any` type for `MinimalPage.on` handler with biome-ignore comment (required for compatibility)

### Dynamic Blocking
The `blockedTypes` property is a mutable Set that users can modify at runtime:
```typescript
plugin.blockedTypes.add('image')    // Start blocking
plugin.blockedTypes.delete('image') // Stop blocking
```

## Testing Requirements

Tests must maintain **100% coverage** (configured in vitest.config.ts with 90% thresholds).

Test structure:
- Unit tests in `test/index.test.ts`
- Uses vitest with mock requests/pages
- Tests cover: plugin instantiation, options, getters, request handling (block/continue), Cooperative Mode, dynamic blocking

## TypeScript Configuration

- Extends root `tsconfig.json` with strict mode enabled
- `noImplicitOverride: true` requires `override` keyword on overridden methods
- Outputs to `dist/` with declarations, source maps, and declaration maps
- Excludes test files from build

## Code Style

Uses Biome for linting/formatting (configured at repo root):
- `noExplicitAny: error` - Avoid `any` types except where absolutely necessary with biome-ignore comments
- Single quotes, no semicolons (ASI), trailing commas (ES5)
- 80 character line width

## Critical Bug Fix Context

A critical bug was fixed in src/index.ts:155-157 where `alreadyHandled` logic was inverted:
- **Before**: Requests without Cooperative Mode returned `true` (early return = no processing)
- **After**: Returns `false` when `isInterceptResolutionHandled` doesn't exist
- This ensures requests are processed in standard (non-Cooperative) mode

## Resource Types

The plugin supports blocking 13 Puppeteer resource types:
`document`, `stylesheet`, `image`, `media`, `font`, `script`, `texttrack`, `xhr`, `fetch`, `eventsource`, `websocket`, `manifest`, `other`

## Dependencies

- `puppeteer-extra-plugin` (base class) - ^3.2.3
- `debug` (logging) - ^4.4.3
- `puppeteer` (dev, for types) - ^24.34.0
- `vitest` + `@vitest/coverage-v8` (testing)

Peer dependency: `puppeteer-extra` (optional)
