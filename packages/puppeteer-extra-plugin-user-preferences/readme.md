# @zorilla/puppeteer-extra-plugin-user-preferences

> Launch Puppeteer with arbitrary Chrome user preferences

A plugin for [`@zorilla/puppeteer-extra`](https://github.com/zorillajs/zorilla) that allows you to set Chrome user preferences when launching the browser. User preferences control various Chrome settings like default font size, content settings, language preferences, and more.

## Features

- 🎯 Set any Chrome user preference programmatically
- 🔄 Merge preferences from multiple plugins automatically
- 🔌 Integrates seamlessly with the `puppeteer-extra` plugin system
- 📝 Full TypeScript support with recursive type safety
- ✅ Works with both Puppeteer and Playwright

## Install

```bash
npm install @zorilla/puppeteer-extra-plugin-user-preferences
```

## Requirements

- Node.js 20+
- `@zorilla/puppeteer-extra` or `@zorilla/playwright-extra`
- Automatically requires @zorilla/puppeteer-extra-plugin-user-data-dir

## Usage

### Basic Example

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import UserPreferencesPlugin from '@zorilla/puppeteer-extra-plugin-user-preferences';

puppeteer.use(
  UserPreferencesPlugin({
    userPrefs: {
      webkit: {
        webprefs: {
          default_font_size: 22,
        },
      },
    },
  })
);

const browser = await puppeteer.launch();
const page = await browser.newPage();
// Font size is now 22
```

### Content Settings Example

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import UserPreferencesPlugin from '@zorilla/puppeteer-extra-plugin-user-preferences';

puppeteer.use(
  UserPreferencesPlugin({
    userPrefs: {
      profile: {
        default_content_setting_values: {
          notifications: 2, // 1=allow, 2=block
          geolocation: 2,
          media_stream: 2,
        },
      },
    },
  })
);

const browser = await puppeteer.launch();
```

### Multiple Preferences

```typescript
puppeteer.use(
  UserPreferencesPlugin({
    userPrefs: {
      webkit: {
        webprefs: {
          default_font_size: 22,
          default_fixed_font_size: 16,
          minimum_font_size: 12,
        },
      },
      profile: {
        default_content_setting_values: {
          notifications: 2,
          popups: 2,
        },
        password_manager_enabled: false,
      },
      intl: {
        accept_languages: 'en-US,en',
      },
    },
  })
);
```

## API

### `UserPreferencesPlugin(options?)`

Creates a new user preferences plugin instance.

**Parameters:**

- `options` _(Object, optional)_ - Plugin configuration
  - `options.userPrefs` _(Record<string, PreferenceValue>, optional)_ - An object containing Chrome user preferences. Default: `{}`

**Returns:** Plugin instance

**PreferenceValue Type:**

```typescript
type PreferenceValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: PreferenceValue };
```

This recursive type allows deeply nested preference objects while maintaining type safety.

## How It Works

1. **Dependencies**: This plugin automatically loads the `user-data-dir` plugin as a dependency
2. **Merging**: User-defined preferences are merged with preferences from other plugins
3. **Writing**: The combined preferences are written to the Chrome profile's `Preferences` file before launch
4. **Plugin Integration**: Other plugins can expose preferences via the `userPreferences` data entry

## Plugin Integration

Other plugins can provide preferences that will be automatically merged:

```typescript
class MyPlugin extends PuppeteerExtraPlugin {
  get name() {
    return 'my-plugin';
  }

  get data() {
    return [
      {
        name: 'userPreferences',
        value: {
          profile: {
            default_content_setting_values: {
              notifications: 2,
            },
          },
        },
      },
    ];
  }
}
```

## Chrome Preferences Reference

For a comprehensive list of available Chrome preferences, see:

- [Chrome Preference Names (Chromium Source)](https://source.chromium.org/chromium/chromium/src/+/main:chrome/common/pref_names.cc)
- [Default Preference Values](https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/prefs/browser_prefs.cc)

Common preference categories:

- `webkit.webprefs.*` - Web content preferences (fonts, JavaScript, etc.)
- `profile.default_content_setting_values.*` - Content settings (notifications, location, camera, etc.)
- `profile.password_manager_enabled` - Password manager
- `intl.accept_languages` - Language preferences
- `download.default_directory` - Download location
- `printing.*` - Print settings

## TypeScript Support

This plugin is written in TypeScript and includes full type definitions. The `PreferenceValue` type provides recursive type safety for nested preference objects.

```typescript
import type UserPreferencesPlugin from '@zorilla/puppeteer-extra-plugin-user-preferences';

// Fully typed preferences
const plugin: ReturnType<typeof UserPreferencesPlugin> = UserPreferencesPlugin({
  userPrefs: {
    webkit: {
      webprefs: {
        default_font_size: 22, // Type-safe: must be string | number | boolean | null | object
      },
    },
  },
});
```

## Testing

The plugin includes comprehensive tests with 100% code coverage:

```bash
pnpm test              # Run tests
pnpm test:coverage     # Run tests with coverage report
```

## License

[MIT](./LICENSE)

## Related Plugins

- [`@zorilla/puppeteer-extra-plugin-user-data-dir`](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-user-data-dir) - Manage Chrome user data directory (required dependency)
- [`@zorilla/puppeteer-extra-plugin-stealth`](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth) - Stealth mode for bot detection evasion
