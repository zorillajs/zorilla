<div align="center">

<img src="https://raw.githubusercontent.com/zorillajs/zorilla/main/docs/zorilla-wide.png" alt="Zorilla" />

[![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra?label=npm%20%7C%20puppeteer-extra)](https://www.npmjs.com/package/@zorilla/puppeteer-extra)
[![npm](https://img.shields.io/npm/v/@zorilla/playwright-extra?label=npm%20%7C%20playwright-extra)](https://www.npmjs.com/package/@zorilla/playwright-extra)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Biome](https://img.shields.io/badge/linter-Biome-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev/)
[![Node.js CI](https://github.com/zorillajs/zorilla/actions/workflows/test.yml/badge.svg)](https://github.com/zorillajs/zorilla/actions/workflows/test.yml)
</div>

## Zorilla

**Zorilla** is a modular plugin framework that extends Puppeteer and Playwright with additional functionality through a clean plugin architecture. Build powerful browser automation with composable plugins for stealth mode, captcha solving, ad blocking, and much more.

> [!NOTE]
> **About this fork:** This project is a maintained hard fork of the excellent [puppeteer-extra](https://github.com/berstend/puppeteer-extra) originally created by [Tobias Buschor (@berstend)](https://github.com/berstend). The original project pioneered the modular plugin architecture for Puppeteer. This fork exists to continue maintenance, provide bug fixes, and keep dependencies up to date with modern Puppeteer and Playwright versions. All credit for the original architecture and design goes to the original puppeteer-extra team.

---

## 📦 Available Packages

### Core Frameworks

| Package | Description | Version |
|---------|-------------|---------|
| [`@zorilla/puppeteer-extra`](./packages/puppeteer-extra/) | Modular plugin framework for Puppeteer | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra) |
| [`@zorilla/playwright-extra`](./packages/playwright-extra/) | Modular plugin framework for Playwright | [![npm](https://img.shields.io/npm/v/@zorilla/playwright-extra.svg)](https://www.npmjs.com/package/@zorilla/playwright-extra) |
| [`@zorilla/puppeteer-extra-plugin`](./packages/puppeteer-extra-plugin/) | Base class for creating puppeteer-extra plugins | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin) |

### Plugins

| Package | Description | Version |
|---------|-------------|---------|
| [`@zorilla/puppeteer-extra-plugin-stealth`](./packages/puppeteer-extra-plugin-stealth/) | Apply various techniques to make headless detection harder | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-stealth.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-stealth) |
| [`@zorilla/puppeteer-extra-plugin-recaptcha`](./packages/puppeteer-extra-plugin-recaptcha/) | Automatically solve reCAPTCHAs and hCaptchas | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-recaptcha.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-recaptcha) |
| [`@zorilla/puppeteer-extra-plugin-adblocker`](./packages/puppeteer-extra-plugin-adblocker/) | Block ads and trackers using Cliqz adblocker | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-adblocker.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-adblocker) |
| [`@zorilla/puppeteer-extra-plugin-block-resources`](./packages/puppeteer-extra-plugin-block-resources/) | Block resources like images, media, fonts, etc. | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-block-resources.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-block-resources) |
| [`@zorilla/puppeteer-extra-plugin-anonymize-ua`](./packages/puppeteer-extra-plugin-anonymize-ua/) | Anonymize and customize the User-Agent header | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-anonymize-ua.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-anonymize-ua) |
| [`@zorilla/puppeteer-extra-plugin-user-preferences`](./packages/puppeteer-extra-plugin-user-preferences/) | Launch with arbitrary Chrome user preferences | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-user-preferences.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-user-preferences) |
| [`@zorilla/puppeteer-extra-plugin-user-data-dir`](./packages/puppeteer-extra-plugin-user-data-dir/) | Manage custom user data directories | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-user-data-dir.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-user-data-dir) |
| [`@zorilla/puppeteer-extra-plugin-repl`](./packages/puppeteer-extra-plugin-repl/) | Start an interactive REPL for debugging | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-repl.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-repl) |
| [`@zorilla/puppeteer-extra-plugin-devtools`](./packages/puppeteer-extra-plugin-devtools/) | Remote debugging with secure DevTools tunnels | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-devtools.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-devtools) |
| [`@zorilla/puppeteer-extra-plugin-flash`](./packages/puppeteer-extra-plugin-flash/) | Allow Flash on all sites without user interaction | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-flash.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-flash) |
| [`@zorilla/puppeteer-extra-plugin-font-size`](./packages/puppeteer-extra-plugin-font-size/) | Adjust font sizes in the browser | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-font-size.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-font-size) |
| [`@zorilla/puppeteer-extra-plugin-click-and-wait`](./packages/puppeteer-extra-plugin-click-and-wait/) | Wait for navigation to complete after clicking | [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-click-and-wait.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-click-and-wait) |
| [`@zorilla/proxy-router`](./packages/plugin-proxy-router/) | Route proxies dynamically in Puppeteer & Playwright | [![npm](https://img.shields.io/npm/v/@zorilla/proxy-router.svg)](https://www.npmjs.com/package/@zorilla/proxy-router) |

### Utilities

| Package | Description | Version |
|---------|-------------|---------|
| [`@zorilla/extract-stealth-evasions`](./packages/extract-stealth-evasions/) | Extract stealth evasions as standalone JavaScript | [![npm](https://img.shields.io/npm/v/@zorilla/extract-stealth-evasions.svg)](https://www.npmjs.com/package/@zorilla/extract-stealth-evasions) |

---

## 🚀 Quick Start

### With Puppeteer

```bash
npm install puppeteer @zorilla/puppeteer-extra @zorilla/puppeteer-extra-plugin-stealth
```

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto('https://example.com')
await browser.close()
```

### With Playwright

```bash
npm install playwright @zorilla/playwright-extra @zorilla/puppeteer-extra-plugin-stealth
```

```javascript
import { chromium } from '@zorilla/playwright-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

chromium.use(StealthPlugin())

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('https://example.com')
await browser.close()
```

## 🤝 Contributing

We welcome contributions! **[Read the Contributing Guide →](./CONTRIBUTING.md)**

## License
[MIT](./LICENSE)
