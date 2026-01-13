# @zorilla/puppeteer-extra-plugin-user-data-dir

> Manage Chrome user data directories (profiles) with automatic temporary directory creation, file injection, and cleanup.

A plugin for [`puppeteer-extra`](https://github.com/zorillajs/zorilla) and [`playwright-extra`](https://github.com/zorillajs/zorilla) that gives you full control over Chrome's user data directory. Perfect for managing browser profiles, injecting custom preferences, pre-loading cookies, or ensuring clean browser states between test runs.

## Features

- 🚀 **Automatic temporary directories** - Creates and cleans up temp profiles automatically
- 📁 **File injection** - Write files into the profile before browser launch (preferences, cookies, extensions)
- 🧹 **Smart cleanup** - Handles file locks with retry logic when deleting directories
- 🔌 **Plugin integration** - Collects files from other plugins for coordinated profile setup
- 🎯 **Flexible control** - Use temporary or persistent profiles with configurable cleanup

## Install

```bash
npm install @zorilla/puppeteer-extra-plugin-user-data-dir
```

## Usage

### Basic Usage (Automatic Temporary Directory)

By default, the plugin creates a temporary directory that's automatically cleaned up when the browser disconnects:

```typescript
import puppeteer from '@zorilla/puppeteer-extra'
import UserDataDirPlugin from '@zorilla/puppeteer-extra-plugin-user-data-dir'

puppeteer.use(UserDataDirPlugin())

const browser = await puppeteer.launch()
// Temporary directory created automatically at /tmp/puppeteer_dev_profile-xxxxx
// Directory is deleted when browser disconnects
```

### Inject Files into Profile

Write custom files into the Chrome profile before launch. Useful for preferences, cookies, or other profile data:

```typescript
import puppeteer from '@zorilla/puppeteer-extra'
import UserDataDirPlugin from '@zorilla/puppeteer-extra-plugin-user-data-dir'

puppeteer.use(
  UserDataDirPlugin({
    files: [
      {
        target: 'Profile',
        file: 'Preferences',
        contents: JSON.stringify({
          profile: {
            default_content_setting_values: {
              notifications: 2 // Block notifications
            }
          }
        })
      },
      {
        target: 'Profile',
        file: 'First Run',
        contents: '' // Skip first run wizard
      }
    ]
  })
)

const browser = await puppeteer.launch()
// Files are written to the Default profile before launch
```

### Use a Persistent Profile Directory

Provide your own user data directory path to maintain state across browser sessions:

```typescript
import puppeteer from '@zorilla/puppeteer-extra'
import UserDataDirPlugin from '@zorilla/puppeteer-extra-plugin-user-data-dir'

puppeteer.use(
  UserDataDirPlugin({
    deleteExisting: false // Don't delete the directory on disconnect
  })
)

const browser = await puppeteer.launch({
  userDataDir: '/path/to/my/profile'
})
// Your existing profile is used and preserved after disconnect
```

### Custom Temporary Directory Location

Control where temporary directories are created:

```typescript
import puppeteer from '@zorilla/puppeteer-extra'
import UserDataDirPlugin from '@zorilla/puppeteer-extra-plugin-user-data-dir'

puppeteer.use(
  UserDataDirPlugin({
    folderPath: '/custom/temp/location',
    folderPrefix: 'my-browser-profile-',
    deleteTemporary: true // Clean up when done
  })
)

const browser = await puppeteer.launch()
// Temporary directory created at /custom/temp/location/my-browser-profile-xxxxx
```

### Playwright Usage

Works exactly the same with Playwright:

```typescript
import { chromium } from '@zorilla/playwright-extra'
import UserDataDirPlugin from '@zorilla/puppeteer-extra-plugin-user-data-dir'

chromium.use(
  UserDataDirPlugin({
    files: [
      {
        target: 'Profile',
        file: 'Preferences',
        contents: JSON.stringify({ custom: 'settings' })
      }
    ]
  })
)

const browser = await chromium.launch()
```

## API

### Options

```typescript
interface PluginOptions {
  /** Delete temporary directories on disconnect (default: true) */
  deleteTemporary?: boolean

  /** Delete non-temporary directories on disconnect (default: false) */
  deleteExisting?: boolean

  /** Files to write into the profile before launch */
  files?: Array<{
    target: 'Profile'  // Must be 'Profile'
    file: string       // Path relative to profile (e.g., 'Preferences', 'nested/file.txt')
    contents: string   // File contents
  }>

  /** Parent directory for temporary directories (default: os.tmpdir()) */
  folderPath?: string

  /** Prefix for temporary directory names (default: 'puppeteer_dev_profile-') */
  folderPrefix?: string
}
```

### File Writing

Files are written to Chrome's `Default` profile directory within the user data directory. The plugin:

- Creates nested directories automatically if needed
- Writes files from both plugin options and other plugins
- Validates that `target` is `'Profile'` (logs warnings for invalid targets)
- Handles write errors gracefully without crashing

Common files you might want to inject:

- **`Preferences`** - Chrome preferences JSON (settings, permissions, etc.)
- **`First Run`** - Empty file to skip first-run wizard
- **`Local State`** - Browser-level state and settings
- **Custom extension data** - Files in nested directories

### Directory Cleanup

The plugin handles cleanup intelligently:

- **Temporary directories** (`deleteTemporary: true`): Created by the plugin, deleted on disconnect
- **Existing directories** (`deleteExisting: false`): Provided via `userDataDir`, preserved by default
- **Retry logic**: Uses `fs.rm` with 4 retries and 100ms delays to handle file locks from Chrome processes

## Use Cases

- **Clean test environments** - Each test gets a fresh profile, no state leakage
- **Pre-configured browsers** - Inject settings, permissions, or auth tokens before launch
- **Profile management** - Easily switch between different browser configurations
- **Extension testing** - Set up extension data before the browser starts
- **CI/CD pipelines** - Ensure consistent, reproducible browser states

## Further Reading

- [Chromium User Data Directory Documentation](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md)
- [Chrome Preferences Reference](https://chromium.googlesource.com/chromium/src/+/master/chrome/common/pref_names.cc)

## License

MIT
