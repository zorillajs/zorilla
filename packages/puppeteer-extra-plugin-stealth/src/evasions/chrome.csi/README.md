# chrome.csi

## Detection Technique

The `chrome.csi()` function is a deprecated but still existing Chrome-specific API that returns browser timing information. In headful Chrome, this function is available and returns performance metrics, but in headless mode it's missing, making it a detection vector for automation.

**What Servers/Clients Check:**
- `window.chrome.csi` existence - Missing in headless Chrome
- `typeof chrome.csi === 'function'` - Should be a function
- Return value structure - Should return an object with `onloadT`, `startE`, `pageT`, `tran` properties
- Values should be consistent with actual page load timings

**Browser Behavior:**
- **Real Chrome:**
  - `chrome.csi` function exists
  - Returns object with timing metrics derived from Performance API
  - Values are in milliseconds and reflect actual page load times
- **Headless Chrome (Without Evasion):**
  - `chrome.csi` function doesn't exist
  - Easy to detect with existence check

**Why This Matters:**
This is a MEDIUM severity detection method. While `chrome.csi()` is deprecated, it still exists in Chrome for backward compatibility. Its absence is a clear signal of headless mode. Bot detection systems check for multiple Chrome-specific APIs, and missing `chrome.csi` adds to the automation fingerprint.

## How This Evasion Works

This evasion creates a functional mock of `chrome.csi()` that returns realistic timing data derived from the standard Performance Timing API, exactly how Chromium internally implements it.

### Implementation Strategy

The mock uses the deprecated `window.performance.timing` API (Navigation Timing Level 1) to generate realistic values:

```javascript
window.chrome.csi = () => ({
  onloadT: timing.domContentLoadedEventEnd,  // When DOMContentLoaded finished
  startE: timing.navigationStart,             // Navigation start timestamp
  pageT: Date.now() - timing.navigationStart, // Time since navigation started
  tran: 15                                     // Transition type (constant)
})
```

### Return Value Properties

**`onloadT`** (number)
- Time when `DOMContentLoaded` event finished
- Derived from `performance.timing.domContentLoadedEventEnd`
- Represents when the document and scripts finished loading

**`startE`** (number)
- Navigation start timestamp
- Derived from `performance.timing.navigationStart`
- Unix timestamp in milliseconds

**`pageT`** (number)
- Time elapsed since navigation started
- Calculated as `Date.now() - timing.navigationStart`
- Updates dynamically as page lives longer

**`tran`** (number)
- Transition type constant
- Always returns `15` (matching Chromium implementation)
- Represents page load transition type

### Why This Works

Chromium internally switched from its own timing API to the standard Web Performance API. The `chrome.csi()` function is now just a wrapper around `performance.timing`. By using the same source data, our mock produces identical and realistic results.

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Injects the chrome.csi mock

**Requirements:**
- Checks that `window.performance` and `window.performance.timing` exist
- Only creates mock if `chrome.csi` doesn't already exist (headful mode)
- Automatically creates `window.chrome` object if needed

**Key Implementation:**
```javascript
async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument(utils => {
    // Create window.chrome if needed
    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        writable: true,
        enumerable: true,
        configurable: false,
        value: {}
      })
    }

    // Skip if already exists
    if ('csi' in window.chrome) {
      return
    }

    // Check Performance API is available
    if (!window.performance || !window.performance.timing) {
      return
    }

    const { timing } = window.performance

    // Create functional mock
    window.chrome.csi = () => ({
      onloadT: timing.domContentLoadedEventEnd,
      startE: timing.navigationStart,
      pageT: Date.now() - timing.navigationStart,
      tran: 15
    })

    // Make toString() look native
    utils.patchToString(window.chrome.csi)
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import ChromeCSI from '@zorilla/puppeteer-extra-plugin-stealth/evasions/chrome.csi'

puppeteer.use(ChromeCSI())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

await page.goto('https://example.com')

// Wait for page to fully load
await page.waitForLoadState('domcontentloaded')

// Verify chrome.csi exists and returns timing data
const csiData = await page.evaluate(() => {
  const data = window.chrome.csi()
  return {
    exists: typeof window.chrome.csi === 'function',
    onloadT: data.onloadT,
    startE: data.startE,
    pageT: data.pageT,
    tran: data.tran,
    hasAllProps: 'onloadT' in data && 'startE' in data && 'pageT' in data && 'tran' in data
  }
})

console.log('chrome.csi exists:', csiData.exists) // true
console.log('onloadT:', csiData.onloadT) // e.g., 1642531891234
console.log('startE:', csiData.startE) // e.g., 1642531890123
console.log('pageT:', csiData.pageT) // e.g., 1234 (ms since nav start)
console.log('tran:', csiData.tran) // 15
console.log('Has all properties:', csiData.hasAllProps) // true

// Verify timing values are realistic
const timingCheck = await page.evaluate(() => {
  const csi = window.chrome.csi()
  const perf = window.performance.timing

  return {
    onloadTMatches: csi.onloadT === perf.domContentLoadedEventEnd,
    startEMatches: csi.startE === perf.navigationStart,
    pageTIsPositive: csi.pageT > 0
  }
})

console.log('Timing values match Performance API:', timingCheck)
// { onloadTMatches: true, startEMatches: true, pageTIsPositive: true }
```

## Testing

Test the evasion against detection services:
- https://bot.sannysoft.com - Should show chrome.csi as present
- https://arh.antoinevastel.com/bots/areyouheadless - Should pass chrome.csi checks

**Manual Test in DevTools:**
```javascript
// Check chrome.csi exists and is a function
console.log(typeof chrome.csi) // "function"

// Call the function and inspect returned data
const timing = chrome.csi()
console.log(timing)
// {onloadT: 1642531891234, startE: 1642531890123, pageT: 2456, tran: 15}

// Verify values match Performance API
console.log(timing.startE === performance.timing.navigationStart) // true
console.log(timing.onloadT === performance.timing.domContentLoadedEventEnd) // true

// Check toString() looks native
console.log(chrome.csi.toString())
// "function () { [native code] }"

// Verify pageT increases over time
const t1 = chrome.csi().pageT
setTimeout(() => {
  const t2 = chrome.csi().pageT
  console.log(t2 > t1) // true - time has passed
}, 100)
```

## About chrome.csi

**What is chrome.csi?**
The name "CSI" stands for "Chrome Speed Index" or "Chrome Site Info". It was an internal Chrome API for gathering page load performance metrics before the standard Performance API was fully developed.

**Deprecation Status:**
- Officially deprecated by Chrome in 2017
- Chromium switched internal implementation to use Web Performance API
- Function still exists for backward compatibility
- May be removed in future Chrome versions

**Related APIs:**
- `chrome.loadTimes()` - Similar deprecated timing API (see chrome.loadTimes evasion)
- `performance.timing` - Standard replacement (Navigation Timing Level 1)
- `performance.getEntriesByType('navigation')` - Modern replacement (Navigation Timing Level 2)

## References

- [Chrome CSI Chromium Bug](https://bugs.chromium.org/p/chromium/issues/detail?id=113048)
- [Chromium Code Review: CSI Implementation](https://codereview.chromium.org/2456293003/)
- [Google Developers: chrome.loadTimes Deprecation](https://developers.google.com/web/updates/2017/12/chrome-loadtimes-deprecated)
- [MDN: PerformanceTiming API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming) (Deprecated)
- [Chromium Source: loadtimes_extension_bindings.cc](https://source.chromium.org/chromium/chromium/src/+/master:chrome/renderer/loadtimes_extension_bindings.cc;l=124?q=loadtimes&ss=chromium)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Mock the `chrome.csi` function if not available (e.g. when running headless).
It's a deprecated (but unfortunately still existing) chrome specific API to fetch browser timings.

Internally chromium switched the implementation to use the WebPerformance API,
so we can do the same to create a fully functional mock.

Note: We're using the deprecated PerformanceTiming API instead of the new Navigation Timing Level 2 API on purpose.

**Options:**
- `opts` (optional, default `{}`)
