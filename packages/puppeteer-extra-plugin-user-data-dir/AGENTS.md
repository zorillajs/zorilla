# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Package Overview

This is `@zorilla/puppeteer-extra-plugin-user-data-dir` - a plugin for managing custom Chrome user data directories in puppeteer-extra. It handles temporary directory creation, file injection into profiles, and automatic cleanup.

**Core functionality:**
- Creates temporary user data directories (or uses provided ones)
- Writes files into the Chrome profile before launch (e.g., preferences, cookies, extensions)
- Handles directory cleanup with retry logic for file locks
- Supports data from other plugins via `dataFromPlugins` requirement

## Development Commands

### Building
```bash
pnpm build                  # Compile TypeScript to dist/
```

Uses direct `tsc` compilation (not Rollup). Output is ESM only in `dist/`.

### Testing
```bash
pnpm test                   # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Run tests with coverage report
```

Uses Vitest with v8 coverage provider. Tests are in `test/index.test.ts`.

### Linting
```bash
npx @biomejs/biome check --write .   # Run Biome formatter/linter
```

Uses Biome (configured at monorepo root). Use `biome-ignore` comments for necessary `any` usage in tests when accessing private properties.

## Architecture

### Plugin Class Structure

The plugin extends `PuppeteerExtraPlugin` from `@zorilla/puppeteer-extra-plugin`:

**Key methods to override:**
- `name` - Returns `'user-data-dir'`
- `defaults` - Returns default options (merged with user options via base class)
- `requirements` - Returns `Set(['runLast', 'dataFromPlugins'])` to run after other plugins and access their data
- `beforeLaunch(options)` - Creates/configures user data directory and writes files
- `onDisconnected()` - Cleans up directories based on configuration

**Private state:**
- `_userDataDir: string | undefined` - Path to the user data directory
- `_isTemporary: boolean` - Whether the directory was created by the plugin

**Important:** Do NOT declare `_opts` as a private field - it's already defined in the base class. Access merged options via `this.opts` (provided by base class).

### Options Interface

```typescript
interface PluginOptions {
  deleteTemporary?: boolean;   // Delete temp dirs on disconnect (default: true)
  deleteExisting?: boolean;    // Delete non-temp dirs on disconnect (default: false)
  files?: FileToWrite[];       // Files to write to profile
  folderPath?: string;         // Parent directory for temp dirs (default: os.tmpdir())
  folderPrefix?: string;       // Prefix for temp dir names (default: 'puppeteer_dev_profile-')
}

interface FileToWrite {
  target: string;    // Must be 'Profile' (validates this)
  file: string;      // Relative path within profile (e.g., 'Preferences', 'nested/file.txt')
  contents: string;  // File contents
}
```

### Directory Lifecycle

1. **beforeLaunch**:
   - If `options.userDataDir` provided → use it, set `_isTemporary = false`
   - If not provided → create temp dir with `mkdtemp`, set `_isTemporary = true`
   - Write files from both plugin options and other plugins (via `getDataFromPlugins('userDataDirFile')`)

2. **onDisconnected**:
   - Check `shouldDeleteDirectory` (considers `_isTemporary` and options)
   - Call `fs.rm` with retry logic (maxRetries: 4, retryDelay: 100ms) to handle file locks

### File Writing

Files are written to the `Default` profile within the user data directory:

```
userDataDir/
  └── Default/           # Chrome default profile
      ├── Preferences    # Example: Chrome preferences JSON
      ├── Cookies        # Example: Cookies database
      └── nested/        # Supports nested paths
          └── file.txt
```

**File sources:**
1. Files from `options.files` array
2. Files from other plugins via `getDataFromPlugins('userDataDirFile')`

Files with invalid `target` (not 'Profile') are logged as warnings and skipped.

## Testing Patterns

**Test structure:**
- Unit tests for all public methods and lifecycle hooks
- Tests for private state by using `(instance as any)._privateField`
- Use `biome-ignore lint/suspicious/noExplicitAny: Testing private properties` for type assertions

**Common patterns:**
```typescript
// Testing private properties
// biome-ignore lint/suspicious/noExplicitAny: Testing private properties
const userDataDir = (instance as any)._userDataDir;

// Testing directory creation
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
// ... run tests ...
// Cleanup in afterEach
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Mocking getDataFromPlugins
instance.getDataFromPlugins = vi.fn().mockReturnValue([
  { value: { target: 'Profile', file: 'test.txt', contents: 'data' } }
]);
```

## Key Implementation Details

### Native Node.js fs (No Dependencies)

This plugin uses **only native Node.js fs methods** - no `fs-extra` or similar dependencies:

```typescript
// Promisified fs methods
const mkdtempAsync = util.promisify(fs.mkdtemp);
const mkdirAsync = util.promisify(fs.mkdir);
const writeFileAsync = util.promisify(fs.writeFile);

// Async rm with retry for cleanup
fs.rm(path, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 }, callback);
```

### Plugin Requirements

```typescript
get requirements(): PluginRequirements {
  return new Set(['runLast', 'dataFromPlugins']);
}
```

- `runLast` - Ensures this plugin runs after others so file paths are finalized
- `dataFromPlugins` - Enables `this.getDataFromPlugins('userDataDirFile')` to collect files from other plugins

### Debugging

Use the `debug` package with namespace `puppeteer-extra-plugin:user-data-dir`:

```bash
DEBUG=puppeteer-extra-plugin:user-data-dir node script.js
```

Within plugin code: `debug('message', data)` (initialized in src/index.ts)

## Common Issues

**TypeScript compilation errors:**
- Don't declare `_opts` as private field (inherited from base class)
- Use `override` keyword for inherited methods
- Use `PluginRequirements` type for requirements getter
- Use `LaunchOptions` from puppeteer (not deprecated `PuppeteerLaunchOptions`)

**Testing:**
- Access private fields via `(instance as any)._field` with biome-ignore comment
- Always clean up temp directories in afterEach/after hooks
- Add delays (`setTimeout`) when testing async `fs.rm` operations

**File writing:**
- Always validate `target === 'Profile'` before writing
- Create parent directories with `{ recursive: true }`
- Handle errors gracefully (log warnings, don't throw)

## Plugin Integration Example

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import UserDataDirPlugin from '@zorilla/puppeteer-extra-plugin-user-data-dir';

puppeteer.use(UserDataDirPlugin({
  files: [{
    target: 'Profile',
    file: 'Preferences',
    contents: JSON.stringify({ custom: 'preferences' })
  }],
  deleteTemporary: true
}));

const browser = await puppeteer.launch();
// userDataDir is automatically created and files are written
// On disconnect, temp directory is cleaned up
```

## Related Documentation

- Chromium user data directory docs: https://source.chromium.org/chromium/chromium/src/+/main:docs/user_data_dir.md
- Parent monorepo AGENTS.md: `../../AGENTS.md` (for plugin system architecture)
- Base plugin class: `../puppeteer-extra-plugin/src/index.ts`
