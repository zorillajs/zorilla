# extract-stealth-evasions

Extract stealth evasions from [@zorilla/puppeteer-extra-plugin-stealth](https://github.com/zorillajs/zorilla/tree/master/packages/puppeteer-extra-plugin-stealth) to standalone JavaScript files.

This tool allows you to:
- Extract stealth evasion techniques as standalone JavaScript
- Use the evasions in pure [CDP](https://chromedevtools.github.io/devtools-protocol/tot/) implementations
- Test evasions directly in browser devtools
- Customize which evasions to include or exclude
- Generate minified or readable output

## Features

- ✅ **100% test coverage** - Thoroughly tested and reliable
- 🚀 **Zero config** - Works out of the box with sensible defaults
- 📦 **Standalone output** - No dependencies in generated files
- 🔧 **Customizable** - Select specific evasions or exclude unwanted ones
- 🎯 **TypeScript** - Written in TypeScript with full type definitions

## Installation

### Using npx (recommended)

No installation required! Just run:

```bash
npx @zorilla/extract-stealth-evasions
```

This will create a `stealth.min.js` file in the current directory.

### Global installation

```bash
npm install -g @zorilla/extract-stealth-evasions
# or
pnpm add -g @zorilla/extract-stealth-evasions
```

Then run:

```bash
extract-stealth-evasions
```

### Local installation

```bash
npm install @zorilla/extract-stealth-evasions
# or
pnpm add @zorilla/extract-stealth-evasions
```

## Usage

### Basic usage

Extract all evasions to a minified file:

```bash
npx @zorilla/extract-stealth-evasions
```

Output: `stealth.min.js`

### List available evasions

```bash
npx @zorilla/extract-stealth-evasions --list
```

### Generate readable (non-minified) output

```bash
npx @zorilla/extract-stealth-evasions --no-minify
```

Output: `stealth.js`

### Include specific evasions only

```bash
# Single evasion
npx @zorilla/extract-stealth-evasions -i chrome.runtime

# Multiple evasions
npx @zorilla/extract-stealth-evasions -i chrome.runtime -i navigator.webdriver
```

### Exclude specific evasions

```bash
# Exclude one evasion
npx @zorilla/extract-stealth-evasions -e media.codecs

# Exclude multiple evasions
npx @zorilla/extract-stealth-evasions -e media.codecs -e chrome.loadTimes
```

## Options

```
Usage: extract-stealth-evasions [options]

Options:
  --version      Show version number                                   [boolean]
  -e, --exclude  Exclude evasion (repeat for multiple)
  -i, --include  Include evasion (repeat for multiple)
  -l, --list     List available evasions                               [boolean]
  -h, --help     Show help                                             [boolean]
  -m, --minify   Minify the output                     [boolean] [default: true]
```

## Using in browser devtools

You can inject the evasions directly into a webpage using the browser console:

```js
// Using the CDN version
const script = document.createElement('script');
script.src = 'https://gitcdn.xyz/repo/zorillajs/zorilla/stealth-js/stealth.min.js';
document.body.appendChild(script);
```

Or load a local file:

```js
// Load from local file (adjust path as needed)
const script = document.createElement('script');
script.src = 'file:///path/to/stealth.min.js';
document.body.appendChild(script);
```

## Programmatic usage

You can also use this package programmatically in your Node.js code:

```typescript
import {
  parseArguments,
  configureStealthPlugin,
  extractScripts,
  generateOutput,
  writeOutputFile,
  main,
} from '@zorilla/extract-stealth-evasions';
import stealth from '@zorilla/puppeteer-extra-plugin-stealth';

// Run the full extraction process
await main(['node', 'script', '--list']);

// Or use individual functions for more control
const options = parseArguments(process.argv);
const stealthPlugin = stealth();
configureStealthPlugin(stealthPlugin, { exclude: ['media.codecs'] });
const scripts = await extractScripts(stealthPlugin);
const output = await generateOutput(scripts, true);
await writeOutputFile('custom-stealth.js', output);
```

## Development

### Prerequisites

- Node.js 20+
- pnpm >= 8

### Setup

```bash
# Clone the repository
git clone https://github.com/zorillajs/zorilla.git
cd zorilla/packages/extract-stealth-evasions

# Install dependencies
pnpm install
```

### Build

```bash
pnpm build
```

### Test

```bash
# Run tests
pnpm test

# Run tests with coverage (100% coverage required)
pnpm test:coverage
```

### Lint

```bash
# Check code
pnpm check

# Auto-fix issues
pnpm fix
```

## How it works

1. Launches a headless browser with the stealth plugin
2. Intercepts the JavaScript code injected by each evasion
3. Collects all evasion scripts
4. Optionally minifies the combined output using Terser
5. Writes the result to a JavaScript file

The generated file contains standalone JavaScript that can be executed in any browser context without requiring Puppeteer or Playwright.

## Use cases

- **CDP implementations**: Use stealth evasions in pure Chrome DevTools Protocol scripts
- **Testing**: Verify detection mechanisms against known evasion techniques
- **Research**: Study and analyze bot detection evasion methods
- **Browser automation**: Inject evasions into custom automation tools

## License

[MIT](./LICENSE)

## Related

- [`@zorilla/puppeteer-extra`](https://github.com/zorillajs/zorilla/tree/master/packages/puppeteer-extra)
- [`@zorilla/puppeteer-extra-plugin-stealth`](https://github.com/zorillajs/zorilla/tree/master/packages/puppeteer-extra-plugin-stealth)
- [`@zorilla/playwright-extra`](https://github.com/zorillajs/zorilla/tree/master/packages/playwright-extra)