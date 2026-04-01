# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Package Overview

This is `@zorilla/puppeteer-extra-plugin-user-preferences`, a plugin for the zorilla monorepo that allows setting arbitrary Chrome user preferences when launching Puppeteer or Playwright browsers. This plugin is part of the puppeteer-extra plugin ecosystem.

**Key Characteristics:**
- **Required Dependency**: `@zorilla/puppeteer-extra-plugin-user-data-dir` (automatically loaded)
- **Plugin Requirements**: `runLast` and `dataFromPlugins` - runs after other plugins to merge all preferences
- **Data Integration**: Exposes data via `userDataDirFile` that the user-data-dir plugin consumes
- **Type Safety**: Uses recursive `PreferenceValue` type instead of `any` for deep preference objects

## Development Commands

```bash
# Building
pnpm build                  # Compile TypeScript to dist/

# Testing
pnpm test                   # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Run tests with coverage (requires 100%)

# Linting & Formatting
cd ../.. && pnpm check packages/puppeteer-extra-plugin-user-preferences  # Check with Biome
cd ../.. && pnpm fix packages/puppeteer-extra-plugin-user-preferences    # Auto-fix with Biome
```

**Note**: Biome commands must be run from the monorepo root (`cd ../..`), not from this package directory.

## Architecture & Data Flow

### Plugin Lifecycle

1. **Registration**: User registers plugin with `puppeteer.use(UserPreferencesPlugin(...))`
2. **Dependency Loading**: Plugin system automatically loads `user-data-dir` plugin (via `dependencies` getter)
3. **beforeLaunch Hook**:
   - Collects `userPreferences` data from all other plugins via `getDataFromPlugins('userPreferences')`
   - Merges plugin preferences using `merge.all()`
   - Stores merged result in `_userPrefsFromPlugins`
4. **Data Exposure** (via `data` getter):
   - Returns `userDataDirFile` entry containing merged preferences
   - Format: `{ target: 'Profile', file: 'Preferences', contents: JSON.stringify(...) }`
5. **File Writing**: The `user-data-dir` plugin reads `userDataDirFile` data and writes the Preferences file

### Preference Merging Strategy

```typescript
// User preferences (from plugin options)
this.opts.userPrefs

// + Plugin preferences (from other plugins)
this._userPrefsFromPlugins = merge.all(
  this.getDataFromPlugins('userPreferences').map(d => d.value)
)

// = Combined preferences (deep merge)
this.combinedPrefs = merge(this.opts.userPrefs, this._userPrefsFromPlugins)
```

Uses `deepmerge` library to handle nested preference objects. User preferences take precedence over plugin preferences in case of conflicts.

## Type System

### PreferenceValue Type

The plugin uses a recursive type definition instead of `any` for type safety:

```typescript
type PreferenceValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: PreferenceValue };
```

This allows deeply nested structures like:
```typescript
{
  webkit: {
    webprefs: {
      default_font_size: 22  // number
    }
  },
  profile: {
    password_manager_enabled: false  // boolean
  }
}
```

**Important**: When modifying types, maintain this recursive structure rather than using `any` or `unknown` for flexibility.

## Plugin Integration Pattern

This plugin demonstrates the **data provider/consumer pattern**:

### As a Consumer
- Uses `getDataFromPlugins('userPreferences')` to collect preferences from other plugins
- Requires `dataFromPlugins` requirement to enable this functionality

### As a Provider
- Exposes `userDataDirFile` data that the `user-data-dir` plugin consumes
- Uses the plugin dependency system to ensure `user-data-dir` is loaded

### Example: Another Plugin Providing Preferences

```typescript
class MyPlugin extends PuppeteerExtraPlugin {
  get data() {
    return [
      {
        name: 'userPreferences',  // This key is collected by user-preferences plugin
        value: {
          profile: {
            default_content_setting_values: {
              notifications: 2
            }
          }
        }
      }
    ];
  }
}
```

## Testing Patterns

Tests use Vitest and follow these patterns:

**Mock Plugin Data**:
```typescript
instance.getDataFromPlugins = vi.fn().mockReturnValue([
  { value: { /* preferences */ } }
]);
```

**Test Private Properties**:
```typescript
// biome-ignore lint/suspicious/noExplicitAny: Testing private properties
const privateValue = (instance as any)._userPrefsFromPlugins;
```

**Coverage Requirements**: 100% coverage on all metrics (statements, branches, functions, lines)

## Common Chrome Preferences

Reference: https://source.chromium.org/chromium/chromium/src/+/main:chrome/common/pref_names.cc

**Font Settings**:
- `webkit.webprefs.default_font_size`
- `webkit.webprefs.default_fixed_font_size`
- `webkit.webprefs.minimum_font_size`

**Content Settings**:
- `profile.default_content_setting_values.notifications` (1=allow, 2=block)
- `profile.default_content_setting_values.geolocation`
- `profile.default_content_setting_values.media_stream`

**Other Common Settings**:
- `profile.password_manager_enabled` (boolean)
- `intl.accept_languages` (string, e.g., "en-US,en")
- `download.default_directory` (string, file path)

## Build Configuration

- **Build System**: Direct TypeScript compilation (`tsc`)
- **Output**: ESM only (`"type": "module"` in package.json)
- **Target Directory**: `dist/`
- **Includes**: Source maps and type declarations
- **Configuration**: `tsconfig.json` extends root monorepo config

## Related Plugins in Monorepo

- **user-data-dir**: Required dependency, writes preferences file to Chrome profile
- **stealth**: Uses user-preferences to set stealth-related Chrome preferences
- **puppeteer-extra-plugin**: Base class providing plugin infrastructure
