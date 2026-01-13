# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

This is `@zorilla/puppeteer-extra-plugin-devtools`, a plugin for puppeteer-extra and playwright-extra that creates secure tunnels to make browser DevTools accessible from anywhere over the internet. The plugin enables remote debugging with screencasting for both headless and headful browser instances, including those running in Docker containers.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm build                    # Compile TypeScript to dist/

# Testing
pnpm test                     # Run all tests with Vitest
pnpm test:watch              # Run tests in watch mode
pnpm test:coverage           # Run tests with coverage report

# Linting (from monorepo root)
cd ../.. && pnpm check       # Check with Biome
cd ../.. && pnpm fix         # Auto-fix with Biome
```

**Important:** This package uses TypeScript compilation only (TSC) - no Rollup bundling. Output is ESM-only with `"type": "module"` in package.json.

## Architecture

### Three-Layer Structure

1. **Plugin Layer** (`src/index.ts`):
   - `Plugin` class extends `PuppeteerExtraPlugin`
   - Manages multiple browser sessions via `_browserSessions` cache (keyed by `wsEndpoint`)
   - Exports factory function that returns plugin instance
   - Handles auth credential management and validation using `ow` library

2. **Tunnel Management Layer** (`src/index.ts` - `Tunnel` class):
   - Wrapper around `RemoteDevTools.DevToolsTunnel`
   - Provides user-facing API: `url` getter, `getUrlForPage()`, `close()`
   - Extracts page ID from internal Puppeteer structure (`page._target._targetInfo.targetId`)

3. **Core Infrastructure Layer** (`src/lib/RemoteDevTools.ts`):
   - **`DevToolsCommon`**: Base class with WebSocket URL parsing and DevTools Protocol JSON endpoint access
   - **`DevToolsLocal`**: Local DevTools URL generation for non-tunneled debugging
   - **`DevToolsTunnel`**: Creates HTTP proxy + localtunnel for public access with:
     - HTTP proxy server (using `http-proxy`) with request/response rewriting
     - Basic auth protection (using `http-auth`)
     - Localtunnel.me integration for public URLs
     - WebSocket upgrade handling for DevTools Protocol

### Key Implementation Details

**Proxy Architecture:**
- Intercepts HTTP requests and WebSocket upgrades
- Rewrites `Host` headers to `localhost` (fixes DevTools bug preventing non-localhost access)
- Modifies response bodies:
  - Root path (`/`): Patches `fetch()` calls to include credentials
  - JSON endpoints (`/json/list`, `/json/version`): Replaces `ws://` with `wss://` and hostname with tunnel host
- Supports both HTTP and WebSocket traffic on same port

**Tunnel Session Management:**
- One tunnel per browser (cached by WebSocket endpoint)
- Generates random subdomain using Node's `crypto.randomBytes()`
- Auto-generates 40-character password if not provided
- Tunnels persist until explicitly closed or script exits

**Security:**
- All tunnels require basic auth (enforced)
- Uses `ow` library for runtime validation
- Passwords printed to STDOUT if auto-generated
- HTTPS enforced by localtunnel.me

## Testing Strategy

Test suite achieves **100% coverage** across 5 test files (74 tests total):

1. **`test/index.test.ts`**: Plugin API surface (15 tests)
   - Plugin instantiation, options handling, validation
   - Auth credential management
   - Browser session caching

2. **`test/RemoteDevTools.test.ts`**: Core library unit tests (27 tests)
   - URL parsing and host normalization
   - Response body modification logic
   - Subdomain generation
   - Basic auth setup

3. **`test/integration.test.ts`**: Component integration (14 tests)
   - Server creation and lifecycle
   - Proxy event handling
   - Tunnel closure workflow

4. **`test/mocked.test.ts`**: Network-dependent flows with mocks (11 tests)
   - Full tunnel creation with mocked `localtunnel`, `get-port`, and `got`
   - Multi-browser scenarios
   - Event handler registration

5. **`test/server.test.ts`**: HTTP/proxy behavior (7 tests)
   - ProxyReq/ProxyRes event handling
   - WebSocket upgrade events
   - Basic auth validation (success/failure paths)

**Mocking Patterns:**
- Use `vi.mock()` at top of file for module mocks
- Port conflicts avoided via counter: `let portCounter = 12345; vi.mock('get-port', () => ({ default: vi.fn(() => Promise.resolve(portCounter++)) }))`
- Tunnel event handlers captured for testing via mock implementation

## Dependencies Removed

This package uses **Node.js built-ins** instead of external libraries where possible:
- **`crypto`** replaces `randomstring` for subdomain generation
- **`URL`** replaces `url-parse` for WebSocket URL parsing

This reduces the dependency footprint and leverages native Node.js APIs.

## Type Declarations

Custom type declarations in `src/types.d.ts` for packages without `@types`:
- `http-proxy-response-rewrite`: Response body modification function
- `localtunnel`: Tunnel creation and management types

## Common Development Tasks

**Adding a new plugin method:**
1. Add method to `Plugin` class in `src/index.ts`
2. Add tests to `test/index.test.ts`
3. Update README.md API documentation
4. Ensure `pnpm test:coverage` shows 100% coverage

**Modifying tunnel behavior:**
1. Changes go in `src/lib/RemoteDevTools.ts`
2. Add unit tests to `test/RemoteDevTools.test.ts`
3. Add integration tests to `test/integration.test.ts` or `test/server.test.ts`
4. Test with real browser: `DEBUG=remote-devtools node your-test-script.js`

**Testing with actual tunnels:**
```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import devtoolsPlugin from './src/index.js';

const devtools = devtoolsPlugin({ auth: { user: 'test', pass: 'test' } });
puppeteer.use(devtools);

const browser = await puppeteer.launch({ headless: true });
const tunnel = await devtools.createTunnel(browser);
console.log('Tunnel URL:', tunnel.url);
// Keep process alive to test tunnel
await new Promise(resolve => setTimeout(resolve, 600000));
```

## Known Limitations

- Localtunnel.me reliability depends on third-party service availability
- No automatic tunnel reconnection (marked as `@todo` in code)
- Page ID extraction relies on internal Puppeteer structure (`_target._targetInfo`)
- Some `any` types remain for third-party library integration (acceptable per linting config)
