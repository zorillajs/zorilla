# @zorilla/puppeteer-extra-plugin-anonymize-ua

> A plugin for [`puppeteer-extra`](https://github.com/zorillajs/zorilla) that anonymizes the user agent string.

[![npm version](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-anonymize-ua.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-anonymize-ua)

## Features

- 🎭 Removes "HeadlessChrome" signature from user agent
- 🪟 Optionally changes platform to Windows 10 64-bit (most common)
- 🔧 Supports custom user agent transformation functions
- ⚡ Works with both Puppeteer and Playwright
- 🌐 Preserves actual Chrome version for authenticity

## Installation

```bash
npm install @zorilla/puppeteer-extra-plugin-anonymize-ua
```

## Usage

### Basic Usage

```typescript
import puppeteer from '@zorilla/puppeteer-extra'
import AnonymizeUA from '@zorilla/puppeteer-extra-plugin-anonymize-ua'

puppeteer.use(AnonymizeUA())

const browser = await puppeteer.launch()
const page = await browser.newPage()
// User agent will be anonymized automatically
```

### With Options

```typescript
import puppeteer from '@zorilla/puppeteer-extra'
import AnonymizeUA from '@zorilla/puppeteer-extra-plugin-anonymize-ua'

puppeteer.use(AnonymizeUA({
  stripHeadless: true,   // Remove HeadlessChrome (default: true)
  makeWindows: true,     // Set platform to Windows (default: true)
  customFn: null         // Custom transformer function (default: null)
}))

const browser = await puppeteer.launch()
```

### Custom User Agent Function

```typescript
puppeteer.use(AnonymizeUA({
  customFn: (ua) => 'MyCoolAgent/' + ua.replace('Chrome', 'Beer')
}))
```

### Disable Modifications

```typescript
puppeteer.use(AnonymizeUA({
  stripHeadless: false,  // Keep HeadlessChrome
  makeWindows: false     // Keep original platform
}))
```

## API

### Plugin Options

**stripHeadless** `boolean` (default: `true`)
- Replace `HeadlessChrome` with `Chrome` in the user agent string
- Helps avoid headless browser detection

**makeWindows** `boolean` (default: `true`)
- Sets the platform to Windows 10, 64-bit (most common desktop platform)
- Replaces the platform portion of the user agent with `(Windows NT 10.0; Win64; x64)`

**customFn** `((ua: string) => string) | null` (default: `null`)
- Custom function to transform the user agent string
- Receives the user agent after `stripHeadless` and `makeWindows` transformations
- Return the modified user agent string

## How It Works

The plugin hooks into the `onPageCreated` lifecycle event and modifies the user agent for each new page:

1. Gets the current browser user agent
2. Applies `stripHeadless` transformation (if enabled)
3. Applies `makeWindows` transformation (if enabled)
4. Applies `customFn` transformation (if provided)
5. Sets the modified user agent on the page

This approach preserves the actual Chrome version number, making the browser appear more authentic.

## Examples

### Before (Default Headless Chrome)
```
Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/131.0.0.0 Safari/537.36
```

### After (With Default Options)
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36
```

## Debugging

Enable debug logging to see user agent transformations:

```bash
DEBUG=puppeteer-extra-plugin:anonymize-ua node your-script.js
```

## License

[MIT](LICENSE)
