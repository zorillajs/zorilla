# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Package Overview

`@zorilla/extract-stealth-evasions` is a utility that extracts stealth evasion techniques from `@zorilla/puppeteer-extra-plugin-stealth` and outputs them as standalone JavaScript files. The extracted scripts can be used in pure CDP implementations or injected directly into browser contexts without requiring Puppeteer or Playwright.

## Development Commands

### Building
```bash
pnpm build                    # Compile TypeScript to dist/
```

Output goes to `dist/` directory with declarations and source maps.

### Testing
```bash
pnpm test                     # Run all tests
pnpm test:coverage            # Run tests with coverage report (requires 100%)
```

**Test Structure:**
- `test/index.test.ts` - Unit tests for all exported functions (40 tests)
- `test/cli.test.ts` - Integration test that runs the compiled CLI script
- `test/minify-edge-case.test.ts` - Tests for terser edge cases using module mocking

**Coverage Requirements:**
- All metrics must be at 100%: statements, branches, functions, lines
- Configuration in `vitest.config.ts` enforces these thresholds

### Linting
```bash
pnpm check                    # Check code with Biome
pnpm fix                      # Auto-fix issues
```

**Note:** Test files use `any` types for mocking. The root `biome.json` has an override to disable `noExplicitAny` for `*.test.ts` files.

## Code Architecture

### Main Entry Point (`src/index.ts`)

The code is structured as a series of composable functions that can be used independently or together:

```typescript
// CLI execution flow:
parseArguments() → configureStealthPlugin() → extractScripts() → generateOutput() → writeOutputFile()
```

**Key Functions:**

1. **`parseArguments(args: string[])`**: Parses CLI arguments using yargs and returns an `ExtractOptions` object

2. **`configureStealthPlugin(plugin, options)`**: Modifies the stealth plugin's `enabledEvasions` set based on include/exclude options

3. **`extractScripts(plugin)`**:
   - Launches headless browser with the stealth plugin
   - Patches `page.evaluateOnNewDocument()` and `page.evaluate()` to intercept injected scripts
   - Collects all scripts in a container object
   - Returns concatenated scripts as a string

4. **`minifyScripts(scripts)`**: Wrapper around terser's `minify()` with nullish coalescing for undefined results

5. **`generateOutput(scripts, shouldMinify)`**: Adds header comment and optionally minifies the scripts

6. **`writeOutputFile(filename, content)`**: Promisified wrapper around `fs.writeFile()`

7. **`main(args)`**: Orchestrates the full extraction process

### Script Interception Mechanism

The core technique uses prototype patching to intercept Puppeteer's script injection:

```typescript
const scriptsContainer = { scripts: '' };
const patchEval = createPatchEval(scriptsContainer);

// Patch the page's prototype methods
(page as any).__proto__.evaluateOnNewDocument = patchEval;
(page as any).__proto__.evaluate = patchEval;

// When plugins call page.evaluateOnNewDocument(fn, args)
// patchEval captures: '(' + fn.toString() + ')(' + JSON.stringify(args) + ');\n'
```

This allows collecting all the JavaScript that would be injected without actually executing it in the browser.

### Module Entry Point

The file has a conditional execution block that only runs when invoked directly as a script:

```typescript
if (isMainModule()) {
  main().catch(handleError);
}
```

This allows importing functions for testing/programmatic use without triggering execution.

## Testing Strategy

### Unit Tests (`test/index.test.ts`)

Tests are organized by function with comprehensive coverage:
- **parseArguments**: Tests all CLI options (exclude, include, list, minify)
- **configureStealthPlugin**: Tests single/multiple include/exclude, edge cases
- **createPatchEval**: Tests script accumulation with/without arguments
- **generateOutput**: Tests minification, headers, edge cases
- **minifyScripts**: Tests terser integration
- **writeOutputFile**: Tests success/error cases with fs mocking
- **extractScripts**: Tests browser integration with mocked puppeteer
- **main**: End-to-end tests with full mocking

**Mocking Patterns:**
- Puppeteer: Mock browser, page, launch, use methods
- Stealth plugin: Mock with enabledEvasions and availableEvasions Sets
- File system: Mock fs.writeFile with callback-style error handling

### Edge Case Testing (`test/minify-edge-case.test.ts`)

Uses `vi.doMock()` to test the nullish coalescing operator in `minifyScripts()`:
```typescript
vi.doMock('terser', () => ({
  minify: vi.fn().mockResolvedValue({ code: undefined }),
}));
```

This ensures the `?? ''` operator is tested when terser returns undefined/null code.

### Integration Test (`test/cli.test.ts`)

Spawns the compiled script as a child process to test real execution:
- Verifies the shebang and entry point work correctly
- Tests the `--list` option with real output
- Ensures the compiled code runs as a standalone CLI tool

## Common Development Scenarios

### Adding a New Function

1. Add the function to `src/index.ts`
2. Export it for public use (if needed)
3. Add unit tests covering all branches
4. Run `pnpm test:coverage` to ensure 100% coverage
5. Update README.md if it's a public API

### Modifying the Extraction Logic

The extraction happens in `extractScripts()`. Key points:
- Must launch a real browser to trigger plugin execution
- Browser is always closed in the `finally` block
- Scripts are accumulated via the `scriptsContainer` closure
- All pages need their prototype methods patched

### Handling Terser Edge Cases

Terser's `minify()` can return `{ code: undefined }` or `{ code: null }`:
- Use `minifyScripts()` wrapper with `?? ''` to handle this
- Test with module mocking in a separate test file
- The nullish coalescing ensures consistent string return type

## File Outputs

Generated files follow this naming convention:
- Minified: `stealth.min.js`
- Non-minified: `stealth.js`

All generated files include a header comment with:
- Auto-generation warning
- Generation timestamp (UTC)
- Link to this package
- MIT license notice

## Dependencies

**Runtime:**
- `puppeteer`: For browser automation
- `@zorilla/puppeteer-extra`: Framework for plugin system
- `@zorilla/puppeteer-extra-plugin-stealth`: Source of evasions
- `terser`: JavaScript minification
- `yargs`: CLI argument parsing

**Dev:**
- `vitest`: Test runner with v8 coverage
- `@types/node`: Node.js type definitions
- `@types/yargs`: Yargs type definitions

## TypeScript Configuration

Extends root `tsconfig.json` with:
- `outDir: "dist"`
- `rootDir: "src"`
- `include: ["src/**/*"]`

The package uses `"type": "module"` in package.json for ESM output.

## Programmatic Usage

The package exports all functions for use in Node.js:

```typescript
import {
  parseArguments,
  configureStealthPlugin,
  extractScripts,
  generateOutput,
  writeOutputFile,
  main,
  type ExtractOptions,
} from '@zorilla/extract-stealth-evasions';
```

This allows custom workflows beyond the CLI, such as:
- Extracting specific evasions programmatically
- Integrating into build pipelines
- Generating multiple variants
- Custom post-processing of scripts
