# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Package Overview

This is `@zorilla/puppeteer-extra-plugin-repl`, a plugin for the puppeteer-extra ecosystem that provides an interactive REPL (Read-Eval-Print-Loop) for debugging and exploring Puppeteer Page and Browser instances. It's part of the Zorilla monorepo.

## Development Commands

### Building
```bash
pnpm build              # Compile TypeScript to dist/
```

### Testing
```bash
pnpm test               # Run all tests once (vitest run)
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Run tests with coverage report
```

### Linting
```bash
# From repo root:
pnpm check              # Check with Biome (read-only)
pnpm fix                # Auto-fix with Biome
```

## Architecture

### Plugin Pattern
This plugin extends `PuppeteerExtraPlugin` from `@zorilla/puppeteer-extra-plugin`. The plugin:
1. Registers lifecycle hooks with puppeteer-extra
2. Optionally adds `.repl()` methods to `Page` and `Browser` instances via `onPageCreated` hook
3. Creates interactive REPL sessions using a custom readline interface

### Three-Layer Architecture

**Layer 1: Plugin (src/index.ts)**
- Extends `PuppeteerExtraPlugin`
- Exports factory function that returns plugin instance
- Handles `onPageCreated` lifecycle to inject `.repl()` method onto Page/Browser instances
- The `repl(obj)` method is the main entry point, accepting any object for REPL inspection

**Layer 2: REPL Session (src/lib/REPLSession.ts)**
- Manages REPL lifecycle: creation, intro display, line input handling
- Uses `ow` for runtime validation of constructor arguments
- Extracts object metadata (type, constructor name, prototype members) to populate completions
- Handles two special commands:
  - `inspect`: Returns the wrapped object itself
  - `exit`: Closes the REPL session
- Evaluates user input via `eval()` (intentional, core REPL functionality)

**Layer 3: Super Readline (src/lib/super-readline.ts)**
- Extends Node.js native `readline.Interface` with color support
- Accesses private readline APIs (`_tabComplete`, `_writeToOutput`, `_prompt`) via prototype casting
- Provides `showTabCompletions()` to display available completions on startup
- Exports a `defaultCompleter` function for tab auto-completion with prefix matching

### Key Design Decisions

**Private API Access Pattern:**
```typescript
// Accessing Node.js readline private methods requires type casting:
(Interface.prototype as any)._tabComplete.call(this, lastKeypressWasTab);
```

**Eval Usage:**
The plugin intentionally uses `eval()` (with biome-ignore) as it's fundamental to REPL functionality - allowing dynamic execution of user input in the context of the inspected object.

**Optional Plugin Behavior:**
The `addToPuppeteerClass` option (default: true) controls whether `.repl()` methods are added to Puppeteer instances. When false, users must call `pluginInstance.repl(obj)` directly.

## TypeScript Configuration

- Extends root `tsconfig.json` with strict mode
- `noImplicitOverride: true` requires `override` keyword on overridden methods
- Outputs to `dist/` with declarations and source maps
- Test files excluded from build

## Testing Requirements

Tests use vitest with v8 coverage provider. Coverage thresholds in `vitest.config.ts`:
- Lines: 80%
- Functions: 80%
- Branches: 70%
- Statements: 80%

Test structure:
- Unit tests co-located with source in `src/lib/*.test.ts`
- Integration tests in `test/index.test.ts`
- Tests verify plugin instantiation, options, REPL session creation, readline features

## Linting Notes

Uses Biome (configured at repo root). Key allowances for this plugin:
- `.d.ts` files excluded from linting (see root `biome.json`)
- `any` types allowed with `biome-ignore` comments where necessary:
  - REPL must accept any object type
  - Accessing private Node.js readline APIs
  - Intentional `eval()` usage for REPL functionality

## Dependencies

- `chalk` (^5.6.2) - Terminal color support
- `ow` (^3.1.1) - Runtime type validation
- `debug` (^4.4.3) - Debug logging (inherited from plugin system)
- `@zorilla/puppeteer-extra-plugin` (workspace) - Base plugin class

Peer dependencies: `puppeteer-extra` and `playwright-extra` (both optional)
