# chrome.loadTimes

## Detection Technique

The `chrome.loadTimes()` function is a deprecated but still existing Chrome-specific API that returns comprehensive browser timing and connection information. In headful Chrome, this function exists and returns detailed performance metrics, but in headless mode it's missing, making it a strong indicator of automation.

**What Servers/Clients Check:**
- `window.chrome.loadTimes` existence - Missing in headless Chrome
- `typeof chrome.loadTimes === 'function'` - Should be a function
- Return value structure - Should return an object with timing and protocol properties
- Property values should be consistent with actual page load metrics
- Connection info properties (protocol, SPDY usage, etc.)

**Browser Behavior:**
- **Real Chrome:**
  - `chrome.loadTimes` function exists
  - Returns comprehensive object with timing and connection data
  - All timing values are in seconds (not milliseconds)
  - Protocol info reflects actual HTTP/2, HTTP/3 connection details
- **Headless Chrome (Without Evasion):**
  - `chrome.loadTimes` function doesn't exist
  - Easy to detect with existence check

**Why This Matters:**
This is a MEDIUM severity detection method. Although deprecated, `chrome.loadTimes()` still exists in Chrome and provides more detailed information than `chrome.csi()`. Its absence is suspicious to bot detection systems that check for multiple Chrome-specific APIs. The function is more complex than most mocks, making it harder to fake convincingly.

## How This Evasion Works

This evasion creates a functional mock of `chrome.loadTimes()` that returns realistic timing and connection data derived from the standard Performance API and Navigation Timing API, exactly how Chromium internally implements it.

### Implementation Strategy

The mock combines data from multiple sources:

**1. Connection/Protocol Information:**
```javascript
const protocolInfo = {
  get connectionInfo() {
    // Returns 'h2' for HTTP/2, 'hq' for HTTP/3, etc.
    const ntEntry = performance.getEntriesByType('navigation')[0]
    return ntEntry.nextHopProtocol
  },
  get npnNegotiatedProtocol() {
    // Returns negotiated protocol for HTTP/2 or QUIC
    return ['h2', 'hq'].includes(ntEntry.nextHopProtocol)
      ? ntEntry.nextHopProtocol
      : 'unknown'
  },
  get navigationType() {
    // Returns 'navigate', 'reload', 'back_forward', etc.
    return ntEntry.type
  },
  get wasFetchedViaSpdy() {
    // Returns true for HTTP/2 or HTTP/3 connections
    return ['h2', 'hq'].includes(ntEntry.nextHopProtocol)
  },
  get wasNpnNegotiated() {
    // Returns true if NPN/ALPN was used (HTTP/2+)
    return ['h2', 'hq'].includes(ntEntry.nextHopProtocol)
  }
}
```

**2. Timing Information (in seconds):**
```javascript
const timingInfo = {
  get requestTime() {
    return timing.navigationStart / 1000  // Convert ms to seconds
  },
  get startLoadTime() {
    return timing.navigationStart / 1000
  },
  get commitLoadTime() {
    return timing.responseStart / 1000  // When response started
  },
  get finishDocumentLoadTime() {
    return timing.domContentLoadedEventEnd / 1000  // DOMContentLoaded
  },
  get finishLoadTime() {
    return timing.loadEventEnd / 1000  // Load event complete
  },
  get firstPaintTime() {
    // Gets first paint from Paint Timing API
    const fpEntry = performance.getEntriesByType('paint')[0]
    return (fpEntry.startTime + performance.timeOrigin) / 1000
  }
}
```

### Return Value Properties

The function returns an object with these properties:

**Connection Properties:**
- `connectionInfo` (string) - Connection protocol: 'h2', 'http/1.1', etc.
- `npnNegotiatedProtocol` (string) - Negotiated protocol for HTTP/2+
- `navigationType` (string) - Type of navigation: 'navigate', 'reload', etc.
- `wasAlternateProtocolAvailable` (boolean) - Always `false` (Alt-Svc header)
- `wasFetchedViaSpdy` (boolean) - True for HTTP/2 or HTTP/3
- `wasNpnNegotiated` (boolean) - True if ALPN was used

**Timing Properties (all in seconds, not milliseconds):**
- `requestTime` (number) - When navigation started (Unix timestamp in seconds)
- `startLoadTime` (number) - Same as requestTime
- `commitLoadTime` (number) - When response started arriving
- `finishDocumentLoadTime` (number) - When DOMContentLoaded finished
- `finishLoadTime` (number) - When load event finished
- `firstPaintTime` (number) - When first paint occurred
- `firstPaintAfterLoadTime` (number) - Always `0` (never implemented in Chrome)

### Why This Works

Chromium deprecated `chrome.loadTimes()` in favor of standard APIs and internally switched to using:
- Navigation Timing API (`performance.timing`)
- Navigation Timing Level 2 (`performance.getEntriesByType('navigation')`)
- Paint Timing API (`performance.getEntriesByType('paint')`)

By using these same data sources, our mock produces values identical to real Chrome.

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Injects the chrome.loadTimes mock

**Requirements:**
- Checks for `window.performance.timing` (Navigation Timing v1)
- Checks for `window.PerformancePaintTiming` (Paint Timing API)
- Uses `performance.getEntriesByType('navigation')` for connection info
- Uses `performance.getEntriesByType('paint')` for first paint time

**Fallback Handling:**
For `about:blank` and pages without navigation, provides fallback values:
```javascript
const ntEntryFallback = {
  nextHopProtocol: 'h2',
  type: 'other'
}
```

**Key Implementation:**
```javascript
async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument((utils, { opts }) => {
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
    if ('loadTimes' in window.chrome) {
      return
    }

    // Check required APIs exist
    if (!window.performance?.timing || !window.PerformancePaintTiming) {
      return
    }

    // Define protocol and timing info (getters)
    const protocolInfo = { /* ... */ }
    const timingInfo = { /* ... */ }

    // Create the function
    window.chrome.loadTimes = () => ({
      ...protocolInfo,
      ...timingInfo
    })

    // Make toString() look native
    utils.patchToString(window.chrome.loadTimes)
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import ChromeLoadTimes from '@zorilla/puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes'

puppeteer.use(ChromeLoadTimes())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

await page.goto('https://example.com')
await page.waitForLoadState('load')

// Verify chrome.loadTimes exists and returns data
const loadData = await page.evaluate(() => {
  const data = window.chrome.loadTimes()
  return {
    exists: typeof window.chrome.loadTimes === 'function',
    // Connection info
    connectionInfo: data.connectionInfo,
    wasFetchedViaSpdy: data.wasFetchedViaSpdy,
    npnNegotiatedProtocol: data.npnNegotiatedProtocol,
    // Timing info (in seconds)
    requestTime: data.requestTime,
    commitLoadTime: data.commitLoadTime,
    finishDocumentLoadTime: data.finishDocumentLoadTime,
    finishLoadTime: data.finishLoadTime,
    firstPaintTime: data.firstPaintTime,
    // Check all expected properties exist
    hasAllProps: 'requestTime' in data && 'connectionInfo' in data
  }
})

console.log('chrome.loadTimes exists:', loadData.exists) // true
console.log('Connection:', loadData.connectionInfo) // e.g., "h2"
console.log('Used SPDY/HTTP2:', loadData.wasFetchedViaSpdy) // true or false
console.log('Request time:', loadData.requestTime) // e.g., 1642531890.123 (seconds)
console.log('First paint:', loadData.firstPaintTime) // e.g., 1642531891.456 (seconds)

// Verify timing values are realistic
const timingCheck = await page.evaluate(() => {
  const lt = window.chrome.loadTimes()
  const perf = window.performance.timing

  return {
    // Times should match (converting ms to seconds)
    requestTimeMatches: Math.abs(lt.requestTime - (perf.navigationStart / 1000)) < 0.001,
    commitTimeMatches: Math.abs(lt.commitLoadTime - (perf.responseStart / 1000)) < 0.001,
    // Times should be in logical order
    commitAfterRequest: lt.commitLoadTime > lt.requestTime,
    finishAfterCommit: lt.finishLoadTime > lt.commitLoadTime
  }
})

console.log('Timing validation:', timingCheck)
```

## Testing

Test the evasion against detection services:
- https://bot.sannysoft.com - Should show chrome.loadTimes as present
- https://arh.antoinevastel.com/bots/areyouheadless - Should pass chrome.loadTimes checks

**Manual Test in DevTools:**
```javascript
// Check chrome.loadTimes exists
console.log(typeof chrome.loadTimes) // "function"

// Call and inspect the data
const timing = chrome.loadTimes()
console.log(timing)
/*
{
  connectionInfo: "h2",
  navigationType: "navigate",
  npnNegotiatedProtocol: "h2",
  wasAlternateProtocolAvailable: false,
  wasFetchedViaSpdy: true,
  wasNpnNegotiated: true,
  requestTime: 1642531890.123,
  startLoadTime: 1642531890.123,
  commitLoadTime: 1642531890.456,
  finishDocumentLoadTime: 1642531891.234,
  finishLoadTime: 1642531891.567,
  firstPaintTime: 1642531891.234,
  firstPaintAfterLoadTime: 0
}
*/

// Verify connection info
console.log(timing.connectionInfo) // "h2" or "http/1.1"
console.log(timing.wasFetchedViaSpdy) // true for HTTP/2

// Verify timing values (in seconds)
console.log(timing.requestTime < timing.finishLoadTime) // true
console.log(timing.firstPaintTime > 0) // true

// Check toString() looks native
console.log(chrome.loadTimes.toString())
// "function () { [native code] }"
```

## About chrome.loadTimes

**What is chrome.loadTimes?**
The `chrome.loadTimes()` function was a Chrome-specific API that provided detailed page load timing and connection information. It predated the standard Performance APIs and gave developers access to internal Chrome metrics.

**Deprecation Timeline:**
- Originally created before Web Performance APIs existed
- Deprecated in Chrome 64 (January 2018)
- Chromium switched implementation to use standard APIs internally
- Still exists for backward compatibility
- Will be removed in a future Chrome version

**Why Timing Values Are in Seconds:**
Unlike most JavaScript timing APIs that use milliseconds, `chrome.loadTimes()` returns Unix timestamps in **seconds** (with fractional parts). This was a design choice from when the API was created.

**Connection Info Properties:**
- **SPDY**: Predecessor to HTTP/2 (deprecated)
- **NPN**: Negotiation protocol (replaced by ALPN)
- **nextHopProtocol**: Modern way to get connection protocol ('h2', 'h3', 'http/1.1')

## Related APIs

**Standard Replacements:**
- `performance.timing` - Navigation Timing Level 1 (also deprecated)
- `performance.getEntriesByType('navigation')` - Navigation Timing Level 2 (current standard)
- `performance.getEntriesByType('paint')` - Paint Timing API
- `PerformanceObserver` - Modern way to observe performance events

**Related Evasions:**
- `chrome.csi` - Simpler Chrome timing API
- `window.performance` - Standard Performance API (always available)

## References

- [Google Developers: chrome.loadTimes() Deprecation](https://developers.google.com/web/updates/2017/12/chrome-loadtimes-deprecated)
- [MDN: PerformanceTiming API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming) (Deprecated)
- [MDN: Navigation Timing Level 2](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming)
- [MDN: Paint Timing API](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming)
- [Chromium Source: loadtimes_extension_bindings.cc](https://source.chromium.org/chromium/chromium/src/+/master:chrome/renderer/loadtimes_extension_bindings.cc;l=124?q=loadtimes&ss=chromium)
- [W3C: Navigation Timing](https://www.w3.org/TR/navigation-timing-2/)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Mock the `chrome.loadTimes` function if not available (e.g. when running headless).
It's a deprecated (but unfortunately still existing) chrome specific API to fetch browser timings and connection info.

Internally chromium switched the implementation to use the WebPerformance API,
so we can do the same to create a fully functional mock.

Note: We're using the deprecated PerformanceTiming API instead of the new Navigation Timing Level 2 API on purpose.

**Options:**
- `opts` (optional, default `{}`)
