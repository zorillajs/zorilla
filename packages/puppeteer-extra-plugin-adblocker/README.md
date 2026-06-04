# @zorilla/puppeteer-extra-plugin-adblocker [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/zorillajs/zorilla/test.yml?branch=main&event=push) [![npm](https://img.shields.io/npm/v/@zorilla/puppeteer-extra-plugin-adblocker.svg)](https://www.npmjs.com/package/@zorilla/puppeteer-extra-plugin-adblocker)

> A [`puppeteer-extra`](https://github.com/zorillajs/zorilla) plugin to block ads and trackers.

## Features

- Extremely efficient adblocker (both in memory usage and raw speed)
- Pure JavaScript implementation
- Effectively blocks all types of ads and tracking
- Small and minimal (only 64KB minified and gzipped)

> Thanks to [@remusao](https://github.com/remusao) for contributing this sweet plugin and [adblocker engine](https://github.com/ghostery/adblocker)! 👏

## Installation

```bash
npm install @zorilla/puppeteer-extra-plugin-adblocker
```

If this is your first [`puppeteer-extra`](https://github.com/zorillajs/zorilla) plugin here's everything you need:

```bash
npm install puppeteer @zorilla/puppeteer-extra @zorilla/puppeteer-extra-plugin-adblocker
```

## Usage

The plugin enables adblocking in puppeteer, optionally blocking trackers.

```javascript
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
import puppeteer from '@zorilla/puppeteer-extra'

// Add adblocker plugin, which will transparently block ads in all pages you
// create using puppeteer.
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer'
import AdblockerPlugin from '@zorilla/puppeteer-extra-plugin-adblocker'
puppeteer.use(
  AdblockerPlugin({
    // Optionally enable Cooperative Mode for several request interceptors
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
  })
)

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()
  // Visit a page, ads are blocked automatically!
  await page.goto('https://www.google.com/search?q=rent%20a%20car')

  await page.waitForTimeout(5 * 1000)
  await page.screenshot({ path: 'response.png', fullPage: true })

  console.log(`All done, check the screenshots. ✨`)
  await browser.close()
})
```

<details>
 <summary><strong>TypeScript usage</strong></summary><br/>

```ts
import puppeteer from '@zorilla/puppeteer-extra'
import Adblocker from '@zorilla/puppeteer-extra-plugin-adblocker'

puppeteer.use(Adblocker({ blockTrackers: true }))

puppeteer
  .launch({ headless: false, defaultViewport: null })
  .then(async browser => {
    const page = await browser.newPage()
    await page.goto('https://www.vanityfair.com')
    await page.waitForTimeout(60 * 1000)
    await browser.close()
  })
```

</details>

## Options

Usage:

```js
import AdblockerPlugin from '@zorilla/puppeteer-extra-plugin-adblocker'
const adblocker = AdblockerPlugin({
  blockTrackers: true // default: false
})
puppeteer.use(adblocker)
```

Available options:

```ts
interface PluginOptions {
  /** Whether or not to block trackers (in addition to ads). Default: false */
  blockTrackers: boolean
  /** Whether or not to block trackers and other annoyances, including cookie
      notices. Default: false */
  blockTrackersAndAnnoyances: boolean
  /** Persist adblocker engine cache to disk for speedup. Default: true */
  useCache: boolean
  /** Optional custom directory for adblocker cache files. Default: undefined */
  cacheDir?: string
  /** Optional custom filters for the adblocker. Default: undefined */
  filters?: string | string[]
  /** Whether or not to merge custom filters with prebuilt ones. Default: false */
  mergeFilters?: boolean
}
```

### Custom Filters

You can provide your own Adblock Plus (ABP) style filters using the `filters` option. The `mergeFilters` option controls how your custom filters interact with the prebuilt adblocker list (which is governed by the `blockTrackers` and `blockTrackersAndAnnoyances` options).

* **Replace prebuilt lists (Default)**: By default, `mergeFilters` is `false`. When **non-empty** `filters` are provided (e.g. a string with text or an array with at least one valid entry), the plugin will skip downloading or using the prebuilt lists entirely. The `blockTrackers` and `blockTrackersAndAnnoyances` options are ignored, and **only** the custom filters are used. This avoids unnecessary network I/O and speeds up browser launch time. Providing empty filters (like `""` or `[]`) will cause the plugin to fall back to using the prebuilt lists as if `filters` were undefined.
* **Merge with prebuilt lists**: If `mergeFilters` is `true`, the plugin will fetch the regular prebuilt list and then append your custom filters to it.

> **Note on caching**: The adblocker persists a compiled engine cache to disk to speed up subsequent launches. The cache filename is generated using a hash of your plugin configuration (`filters`, `blockTrackers`, `blockTrackersAndAnnoyances`, and `mergeFilters`). This ensures that if you change your custom filters or toggle options, the plugin safely creates a new cache without accidentally loading an older, incompatible config.

**Example 1: Replacing prebuilt lists with custom filters**
```js
import AdblockerPlugin from '@zorilla/puppeteer-extra-plugin-adblocker';

puppeteer.use(
  AdblockerPlugin({
    filters: [
      '||example.com^',      // block example.com
      '@@||example.com/allow' // except for this specific path
    ]
    // mergeFilters option is false by default, so prebuilt lists are skipped
  })
)
```

**Example 2: Merging custom filters alongside prebuilt lists**
```js
import AdblockerPlugin from '@zorilla/puppeteer-extra-plugin-adblocker';

puppeteer.use(
  AdblockerPlugin({
    blockTrackers: true,       // use the prebuilt trackers + ads list
    filters: [
      '||my-custom-annoyance.com^'
    ],
    mergeFilters: true        // merge custom filters into the prebuilt list
  })
)
```

## Motivation

Ads and trackers are on most pages and often cost a lot of bandwidth and time
to load pages. Blocking ads and trackers allows pages to load much faster,
because less requests are made and less JavaScript need to run. Also, in cases
where you want to take screenshots of pages, it's nice to have an option to
remove the ads before.

## License

[MIT](LICENSE)
