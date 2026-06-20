# @zorilla/puppeteer-extra-plugin-block-resources

[![npm version](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-block-resources.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-block-resources)
[![npm downloads](https://img.shields.io/npm/dm/@zorilla/puppeteer-extra-plugin-block-resources.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-block-resources)

> A plugin for [`@zorilla/puppeteer-extra`](https://github.com/zorillajs/zorilla) to block resources like images, stylesheets, fonts, and more.

## Features

- 🚫 **Block any resource type** - Images, stylesheets, fonts, media, scripts, and more
- ⚡ **Performance boost** - Significantly speeds up page loads by blocking unnecessary resources
- 🎯 **Dynamic control** - Add or remove blocked types on the fly between page navigations
- 🤝 **Cooperative Intercept Mode** - Compatible with multiple request interceptors
- 📦 **TypeScript support** - Fully typed API
- 🔧 **Simple API** - Easy to use with sensible defaults
- ✅ **100% test coverage** - Comprehensive test suite with all edge cases covered

## Installation

```bash
npm install @zorilla/puppeteer-extra @zorilla/puppeteer-extra-plugin-block-resources
```

## Usage

### Basic Example

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import blockResourcesPlugin from '@zorilla/puppeteer-extra-plugin-block-resources'

// Block images and stylesheets
puppeteer.use(blockResourcesPlugin({
  blockedTypes: new Set(['image', 'stylesheet'])
}))

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.goto('https://example.com')
await browser.close()
```

### Dynamic Blocking

You can dynamically change which resource types are blocked between page navigations:

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import blockResourcesPlugin from '@zorilla/puppeteer-extra-plugin-block-resources'

const plugin = blockResourcesPlugin()
puppeteer.use(plugin)

const browser = await puppeteer.launch()
const page = await browser.newPage()

// Block images
plugin.blockedTypes.add('image')
await page.goto('https://example.com')

// Also block stylesheets and fonts
plugin.blockedTypes.add('stylesheet')
plugin.blockedTypes.add('font')
await page.goto('https://another-site.com')

// Stop blocking images, but keep blocking stylesheets
plugin.blockedTypes.delete('image')
await page.goto('https://yet-another-site.com')

await browser.close()
```

### Cooperative Intercept Mode

If you're using multiple plugins that intercept requests, you can enable Cooperative Intercept Mode (available in Puppeteer v15+):

```javascript
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer'
import puppeteer from '@zorilla/puppeteer-extra'
import blockResourcesPlugin from '@zorilla/puppeteer-extra-plugin-block-resources'

puppeteer.use(blockResourcesPlugin({
  blockedTypes: new Set(['image']),
  interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
}))

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.goto('https://example.com')
await browser.close()
```

## API

### \`blockResourcesPlugin(options)\`

Creates a new instance of the block resources plugin.

#### Options

All options are optional:

- **\`blockedTypes\`** (\`Set<ResourceType>\`) - Set of resource types to block. Default: empty set (no blocking)
- **\`availableTypes\`** (\`Set<ResourceType>\`) - Set of available resource types. Default: all 13 types (rarely needs to be changed)
- **\`interceptResolutionPriority\`** (\`number\`) - Priority for Cooperative Intercept Mode. Default: \`undefined\` (not using Cooperative Mode)

### Plugin Instance Properties

#### \`blockedTypes\`

**Type:** \`Set<ResourceType>\`

Get or modify the set of blocked resource types. You can add or remove types dynamically:

```javascript
const plugin = blockResourcesPlugin()

// Add types
plugin.blockedTypes.add('image')
plugin.blockedTypes.add('stylesheet')

// Remove types
plugin.blockedTypes.delete('image')

// Check if type is blocked
plugin.blockedTypes.has('stylesheet') // true

// Clear all
plugin.blockedTypes.clear()
```

#### \`availableTypes\`

**Type:** \`Set<ResourceType>\` (read-only)

Get all available resource types. Returns a Set containing all 13 resource types.

#### \`interceptResolutionPriority\`

**Type:** \`number | undefined\`

Get the current Cooperative Intercept Mode priority setting.

## Resource Types

The following resource types can be blocked:

| Type | Description |
|------|-------------|
| \`document\` | The main HTML document |
| \`stylesheet\` | CSS stylesheets |
| \`image\` | Images (PNG, JPG, SVG, etc.) |
| \`media\` | Media files (video, audio) |
| \`font\` | Web fonts |
| \`script\` | JavaScript files |
| \`texttrack\` | Text tracks for video (subtitles, captions) |
| \`xhr\` | XMLHttpRequest |
| \`fetch\` | Fetch API requests |
| \`eventsource\` | Server-sent events |
| \`websocket\` | WebSocket connections |
| \`manifest\` | Web app manifests |
| \`other\` | Other resource types (e.g., favicons) |

## Use Cases

### Speed up page loads

Block images, stylesheets, and fonts to load pages much faster:

```javascript
puppeteer.use(blockResourcesPlugin({
  blockedTypes: new Set(['image', 'stylesheet', 'font', 'media'])
}))
```

### Scraping text content

When you only need text content, block everything except the document:

```javascript
puppeteer.use(blockResourcesPlugin({
  blockedTypes: new Set([
    'stylesheet', 'image', 'media', 'font', 'script',
    'texttrack', 'xhr', 'fetch', 'eventsource',
    'websocket', 'manifest', 'other'
  ])
}))
```

### Testing with limited resources

Test how your site works without certain resources:

```javascript
puppeteer.use(blockResourcesPlugin({
  blockedTypes: new Set(['image', 'font'])
}))
```

### Reduce bandwidth usage

Save bandwidth by blocking heavy resources:

```javascript
puppeteer.use(blockResourcesPlugin({
  blockedTypes: new Set(['image', 'media', 'font'])
}))
```

## Performance

Blocking resources can significantly improve page load times and reduce bandwidth usage. For example:

- **Blocking images**: Can reduce page size by 50-80%
- **Blocking stylesheets**: Speeds up rendering but may affect layout
- **Blocking fonts**: Reduces requests and speeds up text rendering
- **Blocking media**: Prevents large video/audio file downloads

## Debugging

Enable debug logs to see what's being blocked:

```bash
DEBUG=puppeteer-extra-plugin:block-resources node your-script.js
```

Or using the \`debug\` package:

```javascript
import debug from 'debug'
debug.enable('puppeteer-extra-plugin:block-resources')
```

## TypeScript

This plugin is written in TypeScript and includes type definitions out of the box:

```typescript
import puppeteer from '@zorilla/puppeteer-extra'
import blockResourcesPlugin from '@zorilla/puppeteer-extra-plugin-block-resources'
import type { ResourceType } from 'puppeteer'

const blockedTypes: Set<ResourceType> = new Set(['image', 'stylesheet'])

const plugin = blockResourcesPlugin({ blockedTypes })
puppeteer.use(plugin)

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.goto('https://example.com')
```

## Compatibility

- ✅ **Puppeteer**: v24.35.0+ (tested with latest)
- ✅ **`@zorilla/puppeteer-extra`**: Latest version
- ✅ **Headless modes**: Both headless and headful
- ✅ **Cooperative Intercept Mode**: Puppeteer v15+ (optional feature)
- ✅ **Node.js**: 22+
- ✅ **TypeScript**: Full type definitions included

## Test Coverage

This plugin has **100% test coverage**:
- ✅ 21 comprehensive tests
- ✅ All functionality tested including edge cases
- ✅ Cooperative Intercept Mode scenarios
- ✅ Dynamic blocking behavior
- ✅ All resource types

Run tests:
```bash
pnpm test          # Run tests with vitest
pnpm test:coverage # Run tests with coverage report
pnpm build         # Build TypeScript
```

## Related Plugins

- [@zorilla/puppeteer-extra-plugin-stealth](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth) - Make Puppeteer undetectable
- [@zorilla/puppeteer-extra-plugin-recaptcha](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-recaptcha) - Solve reCAPTCHAs automatically
- [@zorilla/puppeteer-extra-plugin-adblocker](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-adblocker) - Block ads and trackers

## License

[MIT](LICENSE)

## Contributing

PRs are welcome! Please read the [contributing guidelines](../../CONTRIBUTING.md) before submitting a pull request.
