# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

This is **@zorilla/proxy-router**, a plugin for playwright-extra and puppeteer-extra that enables dynamic proxy routing. It launches a local proxy server that routes browser connections to configured upstream proxies based on custom logic.

## Development Commands

### Building
```bash
pnpm build          # Compile TypeScript to dist/
pnpm clean          # Remove dist/ directory
pnpm tscheck        # Run TypeScript type checking without emitting files
```

### Testing
```bash
pnpm test                # Run tests in watch mode with Vitest
pnpm test:coverage       # Run tests with coverage report
pnpm test-ci             # Run tests once (no watch mode)
```

**Test Coverage Thresholds:**
- Lines: 98%
- Functions: 100%
- Branches: 97%
- Statements: 98%

**Test Infrastructure:**
- Uses Vitest with v8 coverage provider
- `vitest.setup.ts` handles expected async cleanup errors from proxy-chain library
- Test files use `serverClosed` flag to prevent duplicate cleanup attempts
- All test files include comprehensive edge case coverage

### Linting & Formatting
```bash
# From repo root:
cd /Users/justinbeckwith/Code/zorilla
pnpm exec biome check packages/plugin-proxy-router/src
pnpm exec biome check packages/plugin-proxy-router/src --write  # Auto-fix
```

**Note:** This package doesn't have its own biome.json - it uses the root configuration which automatically disables `noExplicitAny` for test files.

## Architecture

### Three-Layer Design

1. **ExtraPluginProxyRouter** (`src/plugin.ts`)
   - Extends `PuppeteerExtraPlugin` base class
   - Implements plugin lifecycle hooks (`onPluginRegistered`, `beforeLaunch`, `onDisconnected`)
   - Detects framework (Playwright vs Puppeteer) and configures browser launch options accordingly
   - Proxies access to underlying `ProxyRouter` instance for convenience

2. **ProxyRouter** (`src/router.ts`)
   - Core routing logic - can be used standalone without the plugin wrapper
   - Manages local proxy server using `proxy-chain` library
   - Implements `prepareRequestFunction` to route each request to the appropriate upstream proxy
   - Handles proxy authentication automatically
   - Emits events for connection lifecycle and errors

3. **ProxyRouterStats** (`src/stats.ts`)
   - Collects traffic statistics per proxy and per host
   - Maintains connection log (id → proxy name → host mapping)
   - Calculates bytes transferred using `trgRxBytes` and `trgTxBytes` from proxy-chain

### Request Flow

1. Browser connects to local proxy server (e.g., `localhost:2800`)
2. `handleProxyServerRequest` is called for each connection
3. If `routeByHost` function exists, it determines which proxy to use
4. Returns special proxy names (`DIRECT`, `ABORT`) or custom proxy name
5. Proxy router looks up actual proxy URL from `proxies` dictionary
6. Connection is routed to upstream proxy or direct connection
7. Statistics are collected when connection closes

### Special Proxy Names

- `DEFAULT`: Used when no custom routing specified (falls back to `proxies.DEFAULT`)
- `DIRECT`: Bypass all proxies, connect directly
- `ABORT`: Block/cancel the request (throws `RequestError` with 400)
- Custom names: Any other string looks up `proxies[name]`

### Framework Compatibility

**Playwright:**
- Sets `options.proxy.server` to local proxy URL
- Sets `options.proxy.bypass` from `proxyBypassList`

**Puppeteer:**
- Appends `--proxy-server=<url>` to launch args
- Appends `--proxy-bypass-list=<list>` if configured

Both frameworks use the same underlying ProxyRouter instance.

## Key Files

- `src/index.ts`: Entry point, exports factory function and all types
- `src/plugin.ts`: Plugin wrapper implementing puppeteer-extra/playwright-extra lifecycle
- `src/router.ts`: Core proxy routing logic (can be used standalone)
- `src/stats.ts`: Traffic statistics collection and aggregation
- `src/utils/port.ts`: Port availability checker (tries preferred port, falls back to random)
- `vitest.setup.ts`: Suppresses expected `ERR_SERVER_NOT_RUNNING` errors during cleanup

## Important Implementation Details

### Port Selection Strategy
The `getPort` utility attempts to bind to the preferred port (default: 2800). If unavailable, it falls back to a random available port (port 0). This prevents conflicts when multiple instances run concurrently.

### Error Handling
The router intercepts and enhances error messages from the proxy-chain library:
- Resurfaces swallowed authentication errors
- Provides actionable debugging suggestions (curl commands, configuration hints)
- Deduplicates repeated error messages per host+proxy combination
- Supports `muteProxyErrors` and `muteProxyErrorsForHost` for noise reduction

### Test Cleanup Pattern
Tests that start the proxy server must handle async cleanup carefully:
```typescript
afterEach(async () => {
  if (router) {
    try {
      if (router.isListening) {
        await router.close();
      }
    } catch {
      // Ignore errors when closing
    }
  }
});
```

The global `vitest.setup.ts` suppresses `ERR_SERVER_NOT_RUNNING` rejections that can occur asynchronously after tests complete.

## TypeScript Configuration

- Extends root `tsconfig.json`
- ES2022 modules with `"type": "module"` in package.json
- Excludes test files from compilation (`src/**/*.test.ts`)
- Emits declarations and source maps to `dist/`
- `strict` mode disabled (inherited from monorepo settings)

## Dependencies

**Runtime:**
- `@zorilla/puppeteer-extra-plugin`: Plugin base class
- `proxy-chain`: Local proxy server implementation
- `debug`: Namespaced debug logging

**Peer Dependencies (optional):**
- `playwright-extra` OR `puppeteer-extra` (at least one required)

**Dev Dependencies:**
- `vitest` + `@vitest/coverage-v8`: Testing framework
- `typescript`: Compilation
- `playwright-core` + `puppeteer`: For type definitions only
