# playwright-extra [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/zorillajs/zorilla/test.yml?branch=main&event=push)](https://github.com/zorillajs/zorilla/actions) [![npm](https://img.shields.io/npm/v/playwright-extra.svg)](https://www.npmjs.com/package/playwright-extra)

> A modular plugin framework for [playwright](https://github.com/microsoft/playwright) to enable cool [plugins](#plugins) through a clean interface.

**Part of the [zorilla](https://github.com/zorillajs/zorilla) monorepo** - a maintained fork of `puppeteer-extra` with modern tooling and ESM support.

## Requirements

- Node.js 20+ (ESM only)
- Playwright 1.x

## Installation

```bash
pnpm add playwright playwright-extra
# - or -
npm install playwright playwright-extra
```

After installing, make sure to install the Playwright browsers:

```bash
pnpm exec playwright install
# - or -
npx playwright install
```

## Quickstart

```js
// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
import { chromium } from 'playwright-extra'

// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

// Add the plugin to playwright (any number of plugins can be added)
chromium.use(StealthPlugin())

// That's it, the rest is playwright usage as normal 😊
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

console.log('Testing the stealth plugin..')
await page.goto('https://bot.sannysoft.com', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'stealth.png', fullPage: true })

console.log('All done, check the screenshot. ✨')
await browser.close()
```

The above example uses the compatible [`stealth`](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth) plugin, which needs to be installed as well:

```bash
pnpm add @zorilla/puppeteer-extra-plugin-stealth
# - or -
npm install @zorilla/puppeteer-extra-plugin-stealth
```

If you'd like to see debug output just run your script like so:

```bash
# macOS/Linux (Bash)
DEBUG=playwright-extra*,puppeteer-extra-plugin* node myscript.js

# Windows (Powershell)
$env:DEBUG='playwright-extra*,puppeteer-extra-plugin*'; node myscript.js
```

### More examples

<details>
 <summary><strong>TypeScript usage</strong></summary><br/>

`playwright-extra` and most plugins are written in TS, so you get perfect type support out of the box. :)

```ts
import { chromium } from 'playwright-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

chromium.use(StealthPlugin())

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

console.log('Testing the stealth plugin..')
await page.goto('https://bot.sannysoft.com', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'stealth.png', fullPage: true })

console.log('All done, check the screenshot. ✨')
await browser.close()
```

New to TypeScript? Here's a quick setup:

```bash
# Create new package.json if it's a new project
pnpm init

# Add TypeScript and dependencies
pnpm add -D typescript @types/node tsx

# Add dependencies used in the quick start example
pnpm add playwright playwright-extra @zorilla/puppeteer-extra-plugin-stealth

# Create a TypeScript config
pnpm tsc --init

# Create source folder for the .ts files
mkdir src

# Now place the example code above in `src/index.ts`

# Run the TypeScript code directly (no compilation needed)
pnpm tsx src/index.ts
```

</details>

<details>
 <summary><strong>Using different browsers</strong></summary><br/>

```ts
// Any browser supported by playwright can be used with plugins
import { chromium, firefox, webkit } from 'playwright-extra'

chromium.use(plugin)
firefox.use(plugin)
webkit.use(plugin)
```

</details>

<details>
 <summary><strong>Multiple instances with different plugins</strong></summary><br/>

Node.js imports are cached, therefore the default `chromium`, `firefox`, `webkit` exports from `playwright-extra` will always return the same playwright instance.

```ts
// Use `addExtra` to create fresh and independent instances
import playwright from 'playwright'
import { addExtra } from 'playwright-extra'

const chromium1 = addExtra(playwright.chromium)
const chromium2 = addExtra(playwright.chromium)

chromium1.use(pluginA)
chromium2.use(pluginB)
// chromium1 and chromium2 are independent instances
```

</details>

---

## Plugins

The following plugins are compatible with `playwright-extra`:

### 🔥 [`@zorilla/puppeteer-extra-plugin-stealth`](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth)

- Applies various evasion techniques to make detection of automated browsers harder
- Compatible with Puppeteer & Playwright and chromium-based browsers

<details>
<summary>&nbsp;&nbsp;Example: Using stealth in Playwright with custom options</summary>

```js
// The stealth plugin is optimized for chromium based browsers
import { chromium } from 'playwright-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

chromium.use(StealthPlugin())

// Customize options for specific evasion techniques
chromium.plugins.setDependencyDefaults('stealth/evasions/webgl.vendor', {
  vendor: 'Bob',
  renderer: 'Alice'
})

// That's it, the rest is playwright usage as normal 😊
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

console.log('Testing the webgl spoofing feature of the stealth plugin..')
await page.goto('https://webglreport.com', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'webgl.png', fullPage: true })

console.log('All done, check the screenshot. ✨')
await browser.close()
```

</details>

### 🏴 [`puppeteer-extra-plugin-recaptcha`](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-recaptcha)

- Solves reCAPTCHAs and hCaptchas automatically, using a single line of code: `page.solveRecaptchas()`
- Compatible with Puppeteer & Playwright and all browsers (chromium, firefox, webkit)

<details>
<summary>&nbsp;&nbsp;Example: Solving captchas in Playwright & Firefox</summary>

```js
// Any browser (chromium, webkit, firefox) can be used
import { firefox } from 'playwright-extra'
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'

firefox.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN || 'YOUR_API_KEY'
    }
  })
)

// Works in headless as well
const browser = await firefox.launch({ headless: false })
const context = await browser.newContext()
const page = await context.newPage()

await page.goto('https://www.google.com/recaptcha/api2/demo', {
  waitUntil: 'networkidle'
})

console.log('Solving captchas..')
await page.solveRecaptchas()

await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle' }),
  page.click('#recaptcha-demo-submit')
])

const content = await page.content()
const isSuccess = content.includes('Verification Success')
console.log('Done', { isSuccess })
await browser.close()
```

</details>

### 📡 [`@zorilla/plugin-proxy-router`](https://github.com/zorillajs/zorilla/tree/main/packages/plugin-proxy-router)

- Use multiple proxies dynamically with flexible per-host routing
- Compatible with Puppeteer & Playwright and all browsers (chromium, firefox, webkit)

### 🔌 [`@zorilla/puppeteer-extra-plugin-anonymize-ua`](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-anonymize-ua)

- Anonymizes the user-agent on all pages
- Compatible with Puppeteer & Playwright

**Additional Resources**

- For adblocking, consider using [@cliqz/adblocker-playwright](https://www.npmjs.com/package/@cliqz/adblocker-playwright) or [blocking resources natively](https://playwright.dev/docs/network#handle-requests)
- To write your own plugins, check out the [`@zorilla/puppeteer-extra-plugin`](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin) base class

---

## Development

This package is part of the [zorilla monorepo](https://github.com/zorillajs/zorilla) and uses:
- **TypeScript** for type safety (ESM only, no CommonJS support)
- **Playwright Test** for testing across chromium, firefox, and webkit
- **c8** for coverage reporting
- **Biome** for linting and formatting

### Building and Testing

```bash
# Install dependencies (from monorepo root)
pnpm install

# Build the package
pnpm build

# Run tests (requires Playwright browsers to be installed)
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Code Quality

```bash
# Check code formatting and linting
npx biome check .

# Auto-fix formatting issues
npx biome check --write .
```

### Browser Installation

Tests require Playwright browsers. Install them with:

```bash
pnpm exec playwright install
```

---

## API

### Default Export

The package exports augmented browser launchers that work as drop-in replacements for playwright:

```ts
import { chromium, firefox, webkit } from 'playwright-extra'
```

### `addExtra(launcher)`

Create a fresh `playwright-extra` instance with its own plugin registry:

```ts
import { addExtra } from 'playwright-extra'
import playwright from 'playwright'

const chromium = addExtra(playwright.chromium)
```

### `launcher.use(plugin)`

Register a plugin with the browser launcher:

```ts
chromium.use(StealthPlugin())
```

### `launcher.plugins`

Access the plugin registry to configure plugins:

```ts
// Set default options for a plugin dependency
chromium.plugins.setDependencyDefaults('stealth/evasions/webgl.vendor', {
  vendor: 'Custom',
  renderer: 'Custom'
})

// List registered plugins
console.log(chromium.plugins.names)
```

---

## Contributors

<a href="https://github.com/zorillajs/zorilla/graphs/contributors">
  <img src="https://contributors-img.firebaseapp.com/image?repo=zorillajs/zorilla" />
</a>

---

## License

[MIT](LICENSE)
